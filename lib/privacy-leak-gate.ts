// Detects likely-private content leaking into a public-facing surface, per
// docs/publication-safety-policy.md's prohibited-disclosures list (private
// IP ranges, internal-domain patterns, real emails, absolute filesystem
// paths, credentials/tokens, private repository identifiers). This
// complements human sanitization review — it does not replace it.
//
// Pure detection functions live here (tested in
// lib/privacy-leak-gate.test.ts); scripts/check-privacy-leak-gate.ts is the
// CLI that walks the filesystem and calls these against real content.
//
// No real, private values are hardcoded anywhere in this file — every
// pattern below is a structural rule (an IP-range shape, a domain suffix, a
// credential-format regex), never a specific real secret or identifier. An
// optional, git-ignored local denylist file can supply site-specific real
// values to check against without ever committing them to this public repo.
//
// Coverage against the bead's acceptance criteria: private IP ranges,
// internal-domain patterns, email addresses, absolute filesystem paths,
// credentials/tokens, and suspicious log-style secret assignments are all
// structurally detectable and covered by scanTextForLeaks below. Real
// usernames and private repository identifiers are NOT structurally
// detectable (a username has no distinguishing shape from any other word) —
// those are covered by scanTextAgainstDenylist against a git-ignored local
// value list instead, by design, not as a gap.

export type LeakFinding = {
  rule: string;
  match: string;
  context: string;
};

// RFC 1918 + loopback + link-local private IPv4 ranges. Deliberately does
// NOT match the RFC 5737 documentation ranges (192.0.2.0/24,
// 198.51.100.0/24, 203.0.113.0/24) — those live in a disjoint address space
// from the ranges below, so they are permitted by construction, not by an
// explicit allowlist carve-out.
const PRIVATE_IPV4_PATTERN =
  /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})\b/g;

// RFC 4193 unique local IPv6. Does not match the RFC 3849 documentation
// prefix (2001:db8::/32), same disjoint-address-space reasoning as above.
const PRIVATE_IPV6_PATTERN = /\bf[cd][0-9a-f]{2}:[0-9a-f:]{2,}\b/gi;

// Negative lookahead excludes filenames like "settings.local.json" or
// "config.internal.yaml" — a real internal-domain mention in prose is never
// immediately followed by another ".ext"-shaped segment.
const INTERNAL_DOMAIN_PATTERN =
  /\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(internal|local|corp|lan|intranet|home\.arpa)\b(?!\.[a-z0-9]{2,5}\b)/gi;

// Documentation-safe email domains this catalog's own publication-safety
// policy already treats as approved placeholders.
const ALLOWED_EMAIL_DOMAINS = new Set(["example.com", "example.org", "example.net"]);
const EMAIL_PATTERN = /\b[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;

// Absolute machine filesystem paths — deliberately scoped to path *shapes*
// that only appear on a real filesystem (a home directory, a mount point, a
// Windows drive letter), not ordinary site-relative URL paths like
// "/knowledge/some-slug", which never match any of these prefixes.
const ABSOLUTE_PATH_PATTERN = /(^|[\s"'`(<])(\/home\/[\w.\-/]+|\/Users\/[\w.\-/]+|\/mnt\/[\w.\-/]+|[A-Z]:\\[\w.\-\\]+)/g;

const CREDENTIAL_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { name: "bearer-token", pattern: /\bBearer\s+[A-Za-z0-9._-]{20,}\b/g },
  { name: "pem-private-key", pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/g },
  { name: "slack-token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
];

// Generic "key=value" / "key: value" secret-shaped log fragments — catches
// leaked credentials in ad-hoc formats the specific patterns above miss,
// such as a pasted log line assigning a password, API key, or token to a
// non-placeholder value. Deliberately excludes obvious placeholders (env-var
// references, angle-bracket/curly-brace templates, and common non-secret
// filler words) so documentation showing an env-var reference as a value
// doesn't false-positive. Not applied to built JS bundles (see the built-
// file extension allowlist in scripts/check-privacy-leak-gate.ts) — minified
// framework code routinely contains coincidental "password=" property
// assignments that aren't secrets.
const SUSPICIOUS_LOG_KEY_PATTERN =
  /\b(password|passwd|pwd|secret|api[_-]?key|apikey|auth[_-]?token|access[_-]?token|private[_-]?key)\s*[:=]\s*["']?([^\s"'<>{}]{6,})["']?/gi;
const PLACEHOLDER_VALUE_PATTERN =
  /^(process\.env|\$\{|<|your[_-]|xxx+|changeme|example|placeholder|redacted|\*+$)/i;

/** Scans one piece of text content and returns every finding, tagged with
 * `context` (typically the file path or asset name it came from) so a
 * caller can report exactly where each violation lives. */
export function scanTextForLeaks(text: string, context: string): LeakFinding[] {
  const findings: LeakFinding[] = [];

  for (const m of text.matchAll(PRIVATE_IPV4_PATTERN)) {
    findings.push({ rule: "private-ipv4", match: m[0], context });
  }
  for (const m of text.matchAll(PRIVATE_IPV6_PATTERN)) {
    findings.push({ rule: "private-ipv6", match: m[0], context });
  }
  for (const m of text.matchAll(INTERNAL_DOMAIN_PATTERN)) {
    findings.push({ rule: "internal-domain", match: m[0], context });
  }
  for (const m of text.matchAll(EMAIL_PATTERN)) {
    const domain = (m[1] ?? "").toLowerCase();
    if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
      findings.push({ rule: "email-address", match: m[0], context });
    }
  }
  for (const m of text.matchAll(ABSOLUTE_PATH_PATTERN)) {
    findings.push({ rule: "absolute-filesystem-path", match: m[0].trim(), context });
  }
  for (const { name, pattern } of CREDENTIAL_PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      // Never echo the full matched secret back into script output/logs —
      // report only enough to locate and confirm it, per the same
      // "don't multiply the exposure" principle the publication-safety
      // policy applies to real incidents.
      findings.push({ rule: `credential-${name}`, match: `${m[0].slice(0, 10)}…(redacted)`, context });
    }
  }
  for (const m of text.matchAll(SUSPICIOUS_LOG_KEY_PATTERN)) {
    const value = m[2] ?? "";
    if (PLACEHOLDER_VALUE_PATTERN.test(value)) continue;
    findings.push({ rule: "suspicious-log-fragment", match: `${m[1]}=${value.slice(0, 6)}…(redacted)`, context });
  }

  return findings;
}

/** Optional, git-ignored local denylist of additional real values to check
 * for (private repository identifiers, internal project codenames, etc.)
 * that must never be committed to this public repository. Returns an empty
 * array — not an error — when the file doesn't exist, since most
 * environments won't have one. */
export type LocalDenylist = { terms: string[] };

export function scanTextAgainstDenylist(text: string, denylist: LocalDenylist, context: string): LeakFinding[] {
  const lower = text.toLowerCase();
  const findings: LeakFinding[] = [];
  for (const term of denylist.terms) {
    if (term.trim().length === 0) continue;
    if (lower.includes(term.toLowerCase())) {
      findings.push({ rule: "local-denylist-term", match: term, context });
    }
  }
  return findings;
}

/** Lightweight, dependency-free check for image metadata that shouldn't
 * ship in a public asset: a JPEG APP1/Exif segment, or a PNG ancillary
 * chunk type known to carry free-text/software/GPS metadata (tEXt, iTXt,
 * zTXt, eXIf). Operates on raw bytes so it needs no image-processing
 * library — this project has none as a dependency and the bead's own
 * acceptance criteria says avoid unnecessary new ones. */
export function findImageMetadata(bytes: Uint8Array, context: string): LeakFinding[] {
  const findings: LeakFinding[] = [];
  const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng =
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  if (isJpeg) {
    // Walk JPEG markers looking for APP1 (0xFFE1) with an "Exif" signature.
    let i = 2;
    while (i + 4 <= bytes.length) {
      if (bytes[i] !== 0xff) break;
      const marker = bytes[i + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        i += 2;
        continue;
      }
      const segmentLength = (bytes[i + 2] << 8) | bytes[i + 3];
      if (segmentLength < 2) break;
      if (marker === 0xe1) {
        const sigStart = i + 4;
        const sig = String.fromCharCode(...bytes.slice(sigStart, sigStart + 4));
        if (sig === "Exif") {
          findings.push({ rule: "image-exif-metadata", match: "JPEG APP1/Exif segment present", context });
        }
      }
      if (marker === 0xda) break; // start of scan data, no more markers to read
      i += 2 + segmentLength;
    }
  } else if (isPng) {
    let i = 8;
    const metadataChunkTypes = new Set(["tEXt", "iTXt", "zTXt", "eXIf"]);
    while (i + 8 <= bytes.length) {
      const length = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
      const type = String.fromCharCode(...bytes.slice(i + 4, i + 8));
      if (metadataChunkTypes.has(type)) {
        findings.push({ rule: "image-png-metadata-chunk", match: `PNG ${type} chunk present`, context });
      }
      if (type === "IEND") break;
      i += 8 + length + 4; // length + type + data + CRC
      if (length < 0 || i > bytes.length) break;
    }
  }

  return findings;
}
