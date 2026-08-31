// Knowledge-base article draft (Bead securitycorp-source-4zl.54.1.5).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. Every example in this file (the
// "Meridian Notes" file-download endpoint, its domain, filenames, and
// paths) is fictional and documentation-safe; no real code, repository,
// credential, system, employer detail, or unresolved real vulnerability
// appears anywhere in this file.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "Path traversal happens when an application takes a value it doesn't fully trust — a filename, a document ID, an archive-entry name — and resolves it against a filesystem boundary the application assumed but never actually enforced. The diagram in a design doc might say 'users can only reach files inside their own document folder.' The code that decides which file to open often says something much weaker: 'this filename doesn't contain the literal characters ../.' Those are not the same claim, and the gap between them is where path traversal lives.",
    "This guide explains why that gap exists, why the common quick fix — scanning a filename for '../' and rejecting matches — is a well-documented incomplete mitigation rather than a boundary, and how to implement one that actually holds: canonicalize the fully resolved path, then verify the canonical result is still inside an explicit allow-listed root directory. A fictional file-download endpoint, and its accompanying interactive diagram, runs through the guide so the mechanism stays concrete without describing any real application.",
  ],
  whatYouWillLearn: [
    "Why an application that resolves a user-influenced value into a filesystem path is making a boundary decision, whether or not the code was written with that boundary in mind.",
    "Why blocking the literal substring '../' is a well-known incomplete mitigation, and specifically which techniques — absolute paths, symlinks, and encoded or double-encoded traversal sequences — defeat it without ever containing the blocked substring.",
    "The two-step boundary-validation approach that closes the gap regardless of technique: canonicalize the resolved path first, then verify containment against an explicit allow-listed root.",
    "Why containment has to be checked against a canonicalized root using a segment-aware comparison, not a plain string prefix that a sibling directory name could accidentally satisfy.",
    "Why a boundary check has to fail closed on anything it cannot fully canonicalize or verify, instead of treating an inconclusive result as permission to proceed.",
  ],
  intendedAudience: [
    "Developers implementing or reviewing any code path that turns caller-supplied input into a filesystem path — file download, upload, template inclusion, log retrieval, or archive extraction.",
    "Security practitioners reviewing an application for path-traversal exposure who need a precise account of which mitigations are structurally sufficient and which only look sufficient.",
    "Technical leads deciding how to remediate a path-traversal finding, where 'we already strip ../' is being offered as evidence the issue is closed.",
  ],
  prerequisites: [
    "Basic familiarity with filesystem paths: the difference between a relative and an absolute path, and what a symbolic link (symlink) is.",
    "Basic familiarity with how a web application or API receives a request and uses part of it to select a resource to return.",
    "No lab environment is required — every example in this guide is fictional and descriptive, not a runnable exercise.",
  ],
  problem: [
    "It's common to see path-handling code that looks defended: a filename argument is checked for the substring '../', and a match is rejected before the value is used to build a filesystem path. That check does close the single most literal traversal attempt. It does not close path traversal as a category, because it validates the syntax of the input string instead of verifying the effect of resolving that string against the filesystem — and those are different questions, in exactly the same way a well-formed value can still be an unauthorized one in other input-handling contexts.",
    "The underlying failure is treating 'no literal ../ in the input' as equivalent to 'the resolved path stays inside the intended directory.' They coincide for the simplest attack and diverge for several others: an absolute path can discard the intended base directory entirely without ever containing '../'; a symlink already present (or plantable) inside the served directory can point outside it while the request that follows it looks completely ordinary; and a percent-encoded or double-encoded traversal sequence only becomes '../' after a decoding step that may happen in a different layer, after the filter already ran. A boundary that only recognizes one specific spelling of the attack isn't a boundary — it's a pattern match that happens to overlap with a boundary in the easy case.",
  ],
  threatModel: [
    "Consider a fictional document-collaboration application we'll call Meridian Notes, reachable at `files.lab.example.com`. Authenticated users retrieve attached documents through `GET /files/download?name={filename}`, where the server is intended to join `filename` onto a fixed base directory such as `/srv/meridian/documents/` and serve only files inside it.",
    "Relevant failure modes, not adversaries in the traditional sense: (1) a caller supplies a filename built from literal `../` segments to walk out of the documents directory — the case a substring filter is specifically written to catch; (2) a caller supplies an absolute path (for example, one naming a location entirely outside the documents directory) that a path-join operation may honor as-is rather than treating as a relative fragment, discarding the intended base directory without ever containing '../'; (3) a caller's request resolves through a symlink that exists inside the documents directory — planted by an earlier upload, or present for a legitimate operational reason — and that symlink's target lies outside the intended root, so the final file read escapes the boundary even though the request's own filename never left the documents directory; (4) a caller supplies a percent-encoded or double-encoded traversal sequence (encoding a `.` or `/` so the literal string never reads as `../`) that only decodes into a traversal sequence after the substring filter has already approved it, whether because decoding happens in a framework layer downstream of the filter or because the filter itself decodes once but the attacker's payload survives a second decoding elsewhere.",
    "Out of scope for this guide: the mechanics of authorization for who may request which document once the boundary is enforced (covered by this knowledge base's guides on input validation's limits and on securing API authentication and authorization); language- or framework-specific canonicalization API names, since the guide is intentionally about the principle rather than a single ecosystem's syntax; and archive-extraction-specific traversal (sometimes called 'zip slip'), which is the same underlying failure applied to entry names inside an archive rather than to a single request parameter, and is not repeated here beyond this note.",
  ],
  mainContent: [
    "**A filesystem boundary is a property of the resolved path, not the input string.** The question that actually matters is 'where does this request end up reading from, once every relative segment, symlink, and encoded character has been resolved' — not 'does this input string look suspicious.' Two filenames can look equally unremarkable and resolve to completely different outcomes depending on what exists on disk at the moment the request is handled. Any check performed only on the raw input string, before resolution, is answering a question about syntax while the boundary that matters is a question about where the filesystem actually points.",
    "**Blocking '../' is a real check, but it's checking the wrong layer.** It correctly rejects the single most literal traversal payload. It does nothing for an absolute path, because an absolute path doesn't need '../' to escape a base directory — depending on how the path is joined, supplying an absolute path can simply replace the base directory outright. It does nothing for a symlink, because following a symlink to a location outside the intended root doesn't require any traversal syntax in the request at all; the request's filename can be a single, ordinary-looking segment. And it does nothing for an encoded sequence — `%2e%2e%2f`, or a double-encoded `%252e%252e%252f` — because the filter is matching literal characters, and a decoding step performed after the filter runs (or a second decoding pass the filter didn't anticipate) turns an approved string into a traversal sequence only after the decision has already been made. None of these techniques are exotic; they're the standard reasons CWE-22 (Path Traversal), its more specific children CWE-23 (Relative Path Traversal) and CWE-36 (Absolute Path Traversal), and CWE-59 (Improper Link Resolution Before File Access) are catalogued as related-but-distinct weaknesses rather than one pattern with one fix.",
    "**Canonicalize the resolved path before making any decision about it.** Canonicalization means producing the one unambiguous, absolute filesystem path that a given input actually refers to: normalizing `.` and `..` segments, resolving any symlink in the chain to its real target, decoding percent-encoded characters exactly once at the layer that owns that decision, and normalizing path separators for the platform in use. This has to happen before the boundary check runs, not after — a check performed on an uncanonicalized path is still vulnerable to every technique that changes what the path resolves to without changing how it reads as a string.",
    "**Then verify containment against an explicit allow-listed root — not a denylist of bad patterns.** Once the resolved path is canonical, compare it against the canonical form of the directory it's supposed to stay inside. The comparison has to be segment-aware: the canonical resolved path must equal the allow-listed root, or start with the root followed by a path separator. A plain string-prefix check is not sufficient on its own — a root of `/srv/meridian/documents` would incorrectly appear to contain a sibling path like `/srv/meridian/documents-archive/secret.txt` under naive prefix matching, because the string `/srv/meridian/documents` is a prefix of that path even though the directory is not. Checking for the boundary directly — 'is this specific, real thing true of the canonical result' — is what an allow-listed root is; enumerating every string shape that might be dangerous is what a denylist is, and a denylist is inherently incomplete because it has to anticipate every technique in advance rather than checking the one fact that actually matters.",
    "**Symlinks need deliberate handling, not just resolution.** A canonicalization step that resolves symlinks handles the case where a symlink already exists at request time — but a request can also name a path that doesn't exist yet (an upload target, for instance), where an intermediate directory in the path is itself a symlink planted earlier. The containment check has to run against the fully resolved chain, including any symlinks in parent directories, not just the final path component. Where practical, the more robust fix is denying symlink creation inside directories that serve caller-influenced paths at all, so there is nothing for a later request to be misdirected through.",
    "**Prefer removing caller control over the raw path entirely, where the design allows it.** The most reliable defense against this class of failure isn't a better boundary check — it's not needing one. Storing uploaded files under a server-generated identifier (mapped to the caller's intended filename in a database record, and returned only through that mapping) removes the caller's ability to influence the filesystem path at all. Boundary validation is still necessary wherever caller-influenced paths remain in the design — this isn't a substitute for it — but eliminating caller control over the literal path is worth doing first wherever the design permits it, precisely because a control that isn't needed can't be misconfigured.",
    "**Validating a boundary check means testing it with the techniques a substring filter misses, not just the technique it catches.** Confirming that a request containing literal '../' is rejected demonstrates the filter works for the case it was written for; it demonstrates nothing about an absolute path, a symlink, or an encoded sequence. A boundary check is only validated once it has been tested against each of those separately, from a position representing the untrusted caller, and confirmed to reject every one of them while still serving a legitimate, in-bounds file correctly.",
  ],
  validationEvidence: [
    "This guide is conceptual. It was not developed against a live or lab-reproduced application, no request/response traffic was captured, and no boundary check described here was implemented and tested end-to-end. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the reasoning here is internally consistent.",
  ],
  limitations: [
    "This guide describes a principle and a fictional illustrative endpoint, not a specific language's or framework's canonicalization API, path-join semantics, or symlink-resolution behavior — those vary by ecosystem and platform and have to be translated and re-verified in the actual codebase they're applied to.",
    "It does not cover archive-extraction traversal ('zip slip') in depth, beyond noting it is the same underlying failure — an entry name inside an archive resolved against an extraction root without a canonicalize-then-verify boundary check — applied to a different input source.",
    "It does not cover authorization for which caller may request which in-bounds resource once the filesystem boundary is enforced; that is a separate control, covered by this knowledge base's guides on the limits of input validation and on securing API authentication and authorization.",
  ],
  defensiveRecommendations: [
    "Treat any code path that resolves caller-influenced input into a filesystem path as enforcing a boundary, whether or not it was written with that framing — and review it accordingly.",
    "Never rely on a substring or pattern-based filter (blocking '../' or similar) as the sole traversal control; treat it, at best, as a shallow first-pass check that a real boundary check still has to back up.",
    "Canonicalize the fully resolved path — normalized relative segments, resolved symlinks, single-pass decoding — before making any decision about whether to serve it.",
    "Verify containment with a segment-aware comparison against a canonicalized allow-listed root, not a plain string prefix, and not a denylist of dangerous-looking patterns.",
    "Fail closed: treat any canonicalization failure — a symlink loop, an unreadable target, a path that can't be fully resolved — as a rejection, not as a default-allow.",
    "Where the design permits it, remove caller control over the literal filesystem path entirely by mapping caller-supplied identifiers to server-generated storage locations, and keep boundary validation as the remaining layer rather than the only one.",
  ],
  keyTakeaways: [
    "Path traversal happens when an application resolves a user-influenced value against a filesystem boundary it assumed but never actually enforced at the point where the path is used.",
    "Blocking the literal substring '../' catches the single most obvious traversal payload and structurally cannot catch an absolute path, a symlink, or an encoded traversal sequence — none of which contain that substring.",
    "A defensible boundary check canonicalizes the fully resolved path first, then verifies the canonical result is still inside an explicit, canonicalized allow-listed root using a segment-aware comparison.",
    "An allow-listed root, checked directly, is structurally more complete than a denylist of dangerous-looking input patterns, which has to anticipate every technique in advance.",
    "A boundary check is validated by testing it against the techniques a substring filter misses — absolute paths, symlinks, encoded sequences — not by confirming it still catches the one technique it was written for.",
  ],
  references: [
    "OWASP: Path Traversal: https://owasp.org/www-community/attacks/Path_Traversal",
    "OWASP Top 10:2021 — A01:2021 Broken Access Control: https://owasp.org/Top10/A01_2021-Broken_Access_Control/",
    "CWE-22: Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal'): https://cwe.mitre.org/data/definitions/22.html",
    "CWE-23: Relative Path Traversal: https://cwe.mitre.org/data/definitions/23.html",
    "CWE-36: Absolute Path Traversal: https://cwe.mitre.org/data/definitions/36.html",
    "CWE-59: Improper Link Resolution Before File Access ('Link Following'): https://cwe.mitre.org/data/definitions/59.html",
    "OWASP Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
  ],
  relatedSlugs: ["input-validation-not-complete-control", "securing-api-authentication-authorization"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A documented list of every code path where a caller-supplied value (a filename, a path segment, an archive-entry name) is used to construct a filesystem path.",
    "Access to a canonicalization mechanism appropriate to the language, framework, and operating system in use — one capable of normalizing relative segments, resolving symlinks, and decoding percent-encoding exactly once.",
    "A defined, explicit allow-listed root directory (or a small fixed set of them) that every resolved path from that code path must remain inside.",
  ],
  procedure: [
    "For each entry point identified in requirements, trace how the caller-supplied value reaches the path-construction call, and note whether the existing protection (if any) is a substring or pattern filter applied to the raw input string.",
    "Where a substring or pattern filter is the only protection, treat it as insufficient by default rather than as a closed finding — it does not need to be removed, but it cannot be the boundary control.",
    "Add a canonicalization step that runs on the fully resolved path — after joining the caller-supplied value to the base directory — that normalizes '.' and '..' segments, resolves symlinks in the full chain (including parent directories for paths that don't yet exist), and decodes percent-encoding exactly once at the layer that owns that decision.",
    "Add a containment check that compares the canonicalized resolved path against the canonicalized allow-listed root using a segment-aware comparison: the resolved path must equal the root, or start with the root followed by a path separator — not a plain string-prefix match.",
    "Treat any canonicalization failure (a symlink loop, an unreadable or non-existent intermediate path, a decoding error) as a rejection of the request, not as a default-allow.",
    "Where feasible, evaluate whether caller control over the literal filesystem path can be removed entirely by mapping caller-supplied identifiers to server-generated storage locations, and keep the boundary check in place as the remaining layer regardless.",
    "Record which entry points were reviewed, which received a canonicalize-then-verify boundary check, and which still rely on a pattern filter alone, so a later audit can distinguish a validated boundary from an assumed one.",
  ],
  validation: [
    "Confirm a request using literal '../' sequences is rejected (the baseline case a pattern filter is written for).",
    "Confirm a request substituting an absolute path for the intended relative filename is rejected.",
    "Confirm a request that resolves through a symlink pointing outside the allow-listed root is rejected, including where the symlink is in an intermediate directory rather than the final path component.",
    "Confirm a request using a single- and a double-percent-encoded traversal sequence is rejected.",
    "Confirm a legitimate, in-bounds filename is still served correctly — a boundary check that fails closed on every request, including valid ones, has not been validated either.",
  ],
  rollback: [
    "If a canonicalize-then-verify boundary check unexpectedly rejects legitimate files (for example, a valid symlinked asset directory), correct the allow-listed root definition or the symlink-handling step rather than reintroducing a pattern filter to unblock the workflow.",
    "If canonicalization introduces unacceptable latency under high request volume, cache the canonicalized allow-listed root (which is static) rather than skipping canonicalization of the caller-supplied path (which is not).",
    "Retain a record of any prior pattern-filter-only implementation for reference, but do not restore it as a workaround — restoring it reopens the exact class of bypass this guide addresses.",
  ],
};

const diagram: KnowledgeArticle["diagram"] = {
  titleId: "path-traversal-boundary-diagram",
  title: "A fictional file-download boundary check, done naively and done correctly",
  desc: "A fictional file-download endpoint: a caller-supplied filename is resolved against a base directory, then a boundary check decides whether to serve it. Interactive: toggle between the normal path, where canonicalization and a root-containment check confirm the resolved path is safe, and the failure path, where a substring-only '../' filter is bypassed by an absolute path, a symlink, or an encoded traversal sequence, reaching a file outside the intended root. Explore each node for detail.",
  viewBox: "0 0 820 300",
  failureLabel: "Substring filter bypassed",
  caption:
    "Client file request → path resolution → boundary check → permitted file access, once the canonical resolved path is confirmed inside the allow-listed root. The failure view shows what a substring-only '../' filter misses: an absolute path, a symlink, or an encoded traversal sequence never contains the blocked substring, so the naive check passes it straight through to a file outside the intended root.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M160,90 H190 M360,90 H390 M570,90 H610", length: 100 },
  edges: [
    { id: "request-resolve", from: "request", to: "resolve", d: "M160,90 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "resolve-boundary", from: "resolve", to: "boundary", d: "M360,90 H390", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "boundary-access", from: "boundary", to: "access", d: "M570,90 H610", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "boundary-outside", from: "boundary", to: "outside", d: "M480,125 V220", length: 95, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "request",
      label: "Client file request",
      x: 10,
      y: 60,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "A caller-supplied filename reaching a fictional file-download endpoint at files.lab.example.com. In both the normal and failure paths, this value is shaped as an ordinary filename or path fragment — the two paths differ only in what it resolves to once combined with the server's base directory, which the raw string alone doesn't reveal.",
    },
    {
      id: "resolve",
      label: "Path resolution",
      x: 190,
      y: 55,
      w: 170,
      h: 70,
      activeIn: ["normal", "failure"],
      focusableLabel:
        "Path resolution — joins the caller-supplied value to the server's base directory to produce a candidate filesystem path; on its own this step does not confirm the result stays inside any boundary",
      description:
        "Combines the caller-supplied filename with the server's configured base directory to produce a path the server intends to read. A naive implementation stops here and treats the produced path as safe merely because the input string didn't contain a literal '../' — the produced path can still point outside the intended directory tree via an absolute path, a symlink, or an encoded sequence a substring filter never decoded.",
    },
    {
      id: "boundary",
      label: "Boundary check",
      x: 390,
      y: 55,
      w: 180,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel:
        "Boundary check — canonicalizes the resolved path and verifies the canonical result is still inside the explicit allow-listed root, not merely absent of a literal '../' substring",
      description:
        "The control that actually enforces the boundary: canonicalize the fully resolved path — normalize '.' and '..' segments, resolve any symlink in the chain, decode percent-encoding exactly once at the correct layer — into an absolute path, then verify that canonical path is still inside the allow-listed root directory. A check that instead scans the raw input string for '../' and stops there is the failure being illustrated: it can reject the most literal traversal attempt while an absolute path, a symlink, or an encoded sequence passes through untouched, because none of them contain the exact substring it was written to catch.",
    },
    {
      id: "access",
      label: "Permitted file access",
      x: 610,
      y: 60,
      w: 170,
      h: 60,
      activeIn: ["normal"],
      role: "safe",
      description:
        "Reached only once the boundary check confirms the canonical path is inside the allow-listed root. The file is read using that canonical, verified path rather than the original caller-supplied string, so nothing downstream has to re-derive whether the boundary held.",
    },
    {
      id: "outside",
      label: "File outside intended root",
      x: 390,
      y: 220,
      w: 220,
      h: 60,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel:
        "File outside intended root — reached only when a substring-only '../' filter is the entire boundary control; an absolute path, a symlink, or an encoded traversal sequence bypasses it without ever containing the blocked substring",
      description:
        "Where the failure lands: a substring-only filter rejects the literal pattern it was written for and approves everything else, including a request built from an absolute path, a request that traverses through a symlink already present in (or planted inside) the served directory, or a request using a percent-encoded — or double-encoded — traversal sequence that only becomes '../' after a decoding step the filter never performed. None of these techniques contain the exact substring the filter was blocking.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Preventing Path Traversal Through Boundary Validation",
    slug: "preventing-path-traversal-through-boundary-validation",
    summary:
      "Path traversal happens when an application resolves a user-influenced path against a filesystem boundary it assumed but never enforced. Why blocking literal '../' substrings is a well-known incomplete mitigation, and how to canonicalize a resolved path and verify it against an explicit allow-listed root instead.",
    pillar: "build-securely",
    primaryCategory: "application-code-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["application-security", "secure-code-review", "access-control", "fail-closed-design"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    updatedAt: "2026-08-31",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "pending" },
    technicalReview: { status: "pending" },
    publicationApproval: { status: "pending" },
  },
  sections,
  module: module_,
  diagram,
};
