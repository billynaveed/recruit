// Simple in-memory token bucket rate limiter, scoped per (key, bucket).
// Suitable for a single-process PM2 deployment. Replace with Redis/Upstash
// if scaling to multiple processes or instances.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  /** Maximum tokens (request burst capacity). */
  capacity: number;
  /** Tokens added per second. */
  refillPerSecond: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.capacity, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(
      config.capacity,
      bucket.tokens + elapsedSeconds * config.refillPerSecond
    );
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      retryAfterSeconds: 0,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.ceil((1 - bucket.tokens) / config.refillPerSecond),
  };
}

// Best-effort cleanup of stale buckets to keep memory bounded.
// Runs lazily on each call rather than via setInterval (edge-runtime safe).
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;
const STALE_THRESHOLD_MS = 10 * 60_000;

export function maybeSweep(): void {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > STALE_THRESHOLD_MS) {
      buckets.delete(key);
    }
  }
}
