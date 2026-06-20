// Google Workspace hosted domain allowed to sign in to the admin area.
// Every admin must have a Google account on this domain; the sign-in route
// verifies the Google `hd` (hosted-domain) claim before issuing a session.
//
// Set ADMIN_HOSTED_DOMAIN to your organization's Workspace domain, e.g.
// "acme.com". The default below is deliberately unusable so a misconfigured
// deployment fails closed (nobody can sign in) rather than open.
//
// This module is edge-safe (no next/headers, no Node APIs) so it can be
// imported from middleware as well as server components and route handlers.
export const ADMIN_HOSTED_DOMAIN =
  process.env.ADMIN_HOSTED_DOMAIN?.trim().toLowerCase() || "example.com";

export function isWorkspaceEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ADMIN_HOSTED_DOMAIN}`);
}
