import { ExternalLink } from "lucide-react";
import { verifiableUrl, type Certification } from "@/lib/profile";

/** A certification name, linked to its public verification page only when a
 * real verify URL is recorded (s41.20.19); otherwise plain text. */
export function CertificationItem({ cert }: { cert: Certification }) {
  const href = verifiableUrl(cert);
  if (!href) return <span>{cert.name}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="credential-link">
      {cert.name}
      <span className="sr-only"> — verify this certification (opens in a new tab)</span>
      <ExternalLink size={11} aria-hidden="true" />
    </a>
  );
}
