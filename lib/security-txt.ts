// RFC 9116 security.txt content and expiry logic (Bead securitycorp-source-tzm).
// Served as plain text at /.well-known/security.txt (app/.well-known/security.txt/route.ts).
// Single source of truth for the Expires field so the served file and the
// automated expiry check (scripts/check-security-txt-expiry.ts) can never
// drift apart.
//
// This is deliberately narrow: it covers vulnerability reports about the
// site itself (hosting, headers, build pipeline, dependencies). It is NOT
// the channel for ordinary article-content corrections (typos, outdated
// technical claims, broken citations) — see SECURITY.md's "Reporting a
// vulnerability" section for that distinction. A dedicated per-article
// correction workflow (securitycorp-source-nyu) is separate, not-yet-built
// scope; this bead does not invent it.

/** RFC 9116 recommends an Expires date less than a year out and re-signing
 * before it lapses — a stale, expired security.txt is treated by scanners
 * as effectively absent. One year from first publication. */
export const SECURITY_TXT_EXPIRES = "2027-09-03T00:00:00.000Z";

const CANONICAL_URL = "https://securitycorp.net/.well-known/security.txt";
const CONTACT_URL = "https://github.com/Securek8x/SecurityCorp/security/advisories/new";
const POLICY_URL = "https://github.com/Securek8x/SecurityCorp/blob/main/SECURITY.md";

/** The exact file content served at /.well-known/security.txt. RFC 9116
 * requires Contact and Expires at minimum; Canonical and Policy are
 * recommended. No personal contact information is included — Contact
 * points to GitHub's private vulnerability-advisory form, matching
 * SECURITY.md's own stated preference, not a personal email. */
export function getSecurityTxtContent(): string {
  return [
    `Contact: ${CONTACT_URL}`,
    `Expires: ${SECURITY_TXT_EXPIRES}`,
    `Canonical: ${CANONICAL_URL}`,
    `Policy: ${POLICY_URL}`,
    "Preferred-Languages: en",
    "",
  ].join("\n");
}

export type SecurityTxtExpiryStatus = "ok" | "expiring-soon" | "expired";

/** Warns well ahead of the actual RFC 9116 lapse so there's real time to
 * re-sign — 30 days is short enough to stay a genuine warning, long enough
 * that it won't fire on every single validation run in the weeks before. */
const EXPIRY_WARNING_WINDOW_DAYS = 30;

export function getSecurityTxtExpiryStatus(now: Date = new Date()): SecurityTxtExpiryStatus {
  const expires = new Date(SECURITY_TXT_EXPIRES);
  const daysUntilExpiry = Math.floor((expires.getTime() - now.getTime()) / 86_400_000);
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= EXPIRY_WARNING_WINDOW_DAYS) return "expiring-soon";
  return "ok";
}
