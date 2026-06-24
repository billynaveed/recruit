import { NextResponse, type NextRequest } from "next/server";
import { unsealData } from "iron-session";
import type { SessionData } from "@/lib/session";
import { ADMIN_HOSTED_DOMAIN } from "@/lib/admin-domain";
import { rateLimit, maybeSweep } from "@/lib/rate-limit";

const SESSION_COOKIE = "yfs_recruit_session";

async function getSessionFromCookie(
  request: NextRequest
): Promise<SessionData | null> {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  try {
    const data = await unsealData<SessionData>(cookieValue, {
      password: secret,
      ttl: 60 * 60 * 24 * 7,
    });
    return data ?? null;
  } catch {
    return null;
  }
}

function getClientIp(request: NextRequest): string {
  // Cloudflare sits in front of nginx. Prefer CF-Connecting-IP (real client IP
  // as Cloudflare sees it). Fall back to leftmost X-Forwarded-For (real client
  // is leftmost when CF appends its own edge IP to the chain). X-Real-IP is
  // last resort and would only be the CF edge IP, not the real user.
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitResponse(retryAfter: number): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limit candidate-facing routes ──────────────────────────────────
  if (pathname.startsWith("/apply") || pathname.startsWith("/api/apply")) {
    maybeSweep();
    const ip = getClientIp(request);

    // CV uploads: 10/min burst, 1/min sustained
    if (pathname.startsWith("/api/apply/upload")) {
      const result = rateLimit(`upload:${ip}`, {
        capacity: 10,
        refillPerSecond: 10 / 60,
      });
      if (!result.allowed) {
        return rateLimitResponse(result.retryAfterSeconds);
      }
    } else {
      // Apply pages and other apply API routes: 60/min burst, 1/sec sustained
      const result = rateLimit(`apply:${ip}`, {
        capacity: 60,
        refillPerSecond: 1,
      });
      if (!result.allowed) {
        return rateLimitResponse(result.retryAfterSeconds);
      }
    }

    return NextResponse.next();
  }

  // ── Login route: stricter rate limit to slow brute-force ────────────────
  if (pathname === "/login" || pathname === "/api/auth/login") {
    maybeSweep();
    const ip = getClientIp(request);
    const result = rateLimit(`login:${ip}`, {
      capacity: 50,
      refillPerSecond: 50 / 300, // 50 per 5min — generous enough for E2E test runs while still slowing brute-force
    });
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfterSeconds);
    }
    return NextResponse.next();
  }

  // ── Admin auth gate ─────────────────────────────────────────────────────
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = await getSessionFromCookie(request);

  if (!session || !session.email || !session.sessionId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.expiresAt < Date.now()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Any Google Workspace member of ADMIN_HOSTED_DOMAIN can sign in. The
  // sign-in route verifies the Google hosted-domain (`hd`) claim before issuing
  // a session cookie, so checking the email suffix here is enough.
  if (!session.email.toLowerCase().endsWith(`@${ADMIN_HOSTED_DOMAIN}`)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/apply/:path*",
    "/api/apply/:path*",
    "/login",
    "/api/auth/login",
  ],
};
