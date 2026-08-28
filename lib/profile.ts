// Canonical author/profile facts — the single source every page renders
// from, so the credentials list can't drift out of sync between pages.
export const profile = {
  name: "Ravi Teja Thota",
  role: "Security Engineer",
  education: "MS in Cybersecurity Engineering",
};

export const certifications = ["CKA", "CKS", "CKAD", "CRTP", "AWS SAA", "CySA+", "Security+", "Network+"];

// Homepage strip shows a compact subset; About shows the full list — both
// slice from this one array rather than hand-copying it.
export const homepageCertifications = certifications.slice(0, 5);

// Only a publicly known, user-confirmed link goes here. Do not add LinkedIn,
// X/Mastodon, or an email address until the exact value is confirmed —
// inventing one would be worse than omitting it.
export const profileLinks = [{ label: "GitHub", href: "https://github.com/Securek8x" }];
