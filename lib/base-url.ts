// Public base URL used to build candidate-facing links (magic-link invites,
// bulk apply links, exported reports). Set NEXT_PUBLIC_BASE_URL to your
// deployment origin, e.g. https://recruit.example.com. Defaults to localhost
// for development. NEXT_PUBLIC_ is required so client components can read it.
export const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

export function applyUrl(token: string): string {
  return `${PUBLIC_BASE_URL}/apply/${token}`;
}

export function bulkApplyUrl(token: string): string {
  return `${PUBLIC_BASE_URL}/apply/bulk/${token}`;
}
