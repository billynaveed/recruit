// Branding and contact details surfaced in user-facing copy (login footer,
// privacy policy, terms of use, page metadata). Override these via env to
// rebrand the app for your organization. NEXT_PUBLIC_ is required so they are
// available in both server and client components.
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Recruit";

export const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || "Your Organization";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "privacy@example.com";
