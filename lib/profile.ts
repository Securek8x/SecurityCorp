// Canonical author/profile facts — the single source every page renders
// from, so the credentials list can't drift out of sync between pages.
export const profile = {
  name: "Ravi Teja Thota",
  role: "Security Engineer",
  education: "MS in Cybersecurity Engineering",
};

export type Certification = {
  name: string;
  /** Public verification page. Add only a real, confirmed https URL from the
   * issuer or its credential platform — never a placeholder. Absent = the
   * name renders without a link (s41.20.19). */
  verifyUrl?: string;
};

export const certifications: Certification[] = [
  { name: "CKA" },
  { name: "CKS" },
  { name: "CKAD" },
  { name: "CRTP" },
  { name: "AWS SAA" },
  { name: "CySA+" },
  { name: "Security+" },
  { name: "Network+" },
];

/** A verify link is rendered only for an absolute https URL with a real host. */
export function verifiableUrl(c: Certification): string | undefined {
  if (!c.verifyUrl) return undefined;
  try {
    const u = new URL(c.verifyUrl);
    if (u.protocol !== "https:" || !u.hostname.includes(".") || /(^|\.)(example\.(com|org|net)|localhost)$/i.test(u.hostname)) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

// Homepage strip shows a compact subset; About shows the full list — both
// slice from this one array rather than hand-copying it.
export const homepageCertifications = certifications.slice(0, 5);

// Only a publicly known, user-confirmed link goes here. Do not add LinkedIn,
// X/Mastodon, or an email address until the exact value is confirmed —
// inventing one would be worse than omitting it.
export const profileLinks = [{ label: "GitHub", href: "https://github.com/Securek8x" }];
