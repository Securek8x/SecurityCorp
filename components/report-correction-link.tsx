import { Flag } from "lucide-react";

const SITE_URL = "https://securitycorp.net";
const REPO = "Securek8x/SecurityCorp";

/** Prefilled GitHub Issue link — no backend, no visitor data collected or
 * transmitted (the query string carries only public article facts: title,
 * slug, canonical URL, evidence state). Triage is manual: reports land as
 * public Issues labeled "correction" in the site's own repository, the same
 * pattern lib/security-txt.ts already uses for vulnerability reports. */
export function ReportCorrectionLink({ title, slug, evidenceState }: { title: string; slug: string; evidenceState: string }) {
  const canonicalUrl = `${SITE_URL}/knowledge/${slug}/`;
  const body = [
    `Article: ${title}`,
    `URL: ${canonicalUrl}`,
    `Evidence state: ${evidenceState}`,
    `Live build / exact source commit: ${SITE_URL}/build-info.json`,
    `Full source history: https://github.com/${REPO}/commits/main`,
    "",
    "What's incorrect or out of date?",
    "",
  ].join("\n");
  const href = `https://github.com/${REPO}/issues/new?labels=correction&title=${encodeURIComponent(`Correction report: ${title}`)}&body=${encodeURIComponent(body)}`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="correction-link outline-link">
      <Flag size={14} aria-hidden="true" />
      Report a correction
    </a>
  );
}
