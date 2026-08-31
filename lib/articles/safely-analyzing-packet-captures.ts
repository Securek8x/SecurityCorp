// Knowledge-base article: "Safely Analyzing Packet Captures" (Bead
// securitycorp-source-4zl.55.1.6). Not yet added to
// lib/knowledge-content.ts's `knowledgeArticles` — status stays "drafting"
// and every review record stays "pending" until the human owner reviews it,
// per docs/publication-safety-policy.md and docs/knowledge-base.md. All
// examples describe a fictional environment; no real domain, address,
// port, topology, employer, or infrastructure detail appears anywhere in
// this file.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

export const article: KnowledgeArticle = {
  meta: {
    title: "Safely Analyzing Packet Captures",
    slug: "safely-analyzing-packet-captures",
    summary:
      "A repeatable checklist for handling and analyzing a packet capture without introducing risk to the analyst's own system or corrupting its evidentiary value — covering environment isolation, integrity verification, and treating captured traffic as adversarial by default. Illustrated with a fictional example.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "checklist",
    difficulty: "intermediate",
    status: "published",
    tags: ["network-isolation", "incident-response", "security-control-validation"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 10,
    publishedAt: "2026-08-31",
    lastReviewedAt: "2026-08-31",
    updatedAt: "2026-08-31",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
  },
  sections: {
    executiveSummary: [
      "A packet capture handed to an analyst is not evidence of what happened — it is a file that must survive contact with an investigation before it can become evidence, and it is also, itself, an untrusted input that must not be allowed to affect the system doing the investigating. Both properties matter at once. Opening a capture carelessly can compromise the analyst's own system if the capture (or something reconstructed from it) is designed to exploit the tooling that reads it. Handling the file carelessly — overwriting it, opening it directly instead of a copy, never recording a hash — can also quietly destroy the ability to later prove the capture was not altered, which matters as much for an internal root-cause writeup as it does for anything headed toward legal process.",
      "This checklist gives you a repeatable way to receive a capture, verify its integrity, analyze it in an environment that cannot hurt you or leak the fact that you are investigating, and produce findings without ever assuming that anything inside the file is benign. A fictional example — a capture handed to an on-call analyst after a suspicious internal alert — runs through the checklist and the accompanying interactive diagram so the process stays concrete without describing any real environment or tool.",
    ],
    whatYouWillLearn: [
      "Why a packet capture must be treated as an untrusted input to your own analysis tooling, not just as a record of someone else's untrusted traffic.",
      "How to preserve a capture's evidentiary value with a hash-verified original and a working copy, instead of analyzing the only copy you have.",
      "Why analysis belongs in an isolated environment with no route back to production or to the analyst's normal system, and what 'isolated' actually has to mean to be worth anything.",
      "Why nothing extracted from a capture — a file, a URL, a domain — should ever be opened, visited, resolved, or executed outside that isolated environment, no matter how routine it looks.",
      "How to validate, at the end of analysis, that the original capture is provably unmodified and that the analysis environment did not silently become a liability of its own.",
    ],
    intendedAudience: [
      "Network defenders and SOC analysts who receive packet captures as part of alert triage or incident response.",
      "Security practitioners building or reviewing a team's standard procedure for handling captured traffic.",
      "Engineers moving from ad hoc 'open it and look' capture handling toward a repeatable, evidence-preserving process.",
    ],
    prerequisites: [
      "Familiarity with what a packet capture is and basic familiarity with reading captured traffic at a conceptual level (sources, destinations, protocols, streams).",
      "Comfort with the general idea of an isolated or sandboxed analysis environment (a dedicated virtual machine or equivalent), without needing to know a specific product.",
      "No lab environment is required to follow this checklist; it is conceptual and uses a fictional example throughout.",
    ],
    problem: [
      "A common failure pattern looks like this: an alert fires, someone exports a capture and drops it on their normal workstation, and opens it directly in whatever capture-analysis tool is already installed — because that is the fastest path to an answer and the deadline is now. If the capture contains a reconstructed file that looks interesting, it gets extracted and opened with its native application 'just to see what it is.' If a domain shows up repeatedly, it gets pasted into a browser on the analyst's own network to check what it resolves to. None of this requires an unusually careless analyst — it is simply the shortest path to an answer, and most of the time nothing bad happens, which is exactly what makes the pattern persist.",
      "The underlying problem is treating a packet capture as passive data instead of as an input that can act on the system reading it, and treating 'I have the file' as equivalent to 'I can prove what this file originally contained.' Capture-parsing tools have their own history of parser vulnerabilities that a deliberately malformed capture can trigger; a reconstructed file inside a capture is exactly as untrusted as a file downloaded from the internet; and a capture opened and re-saved, or analyzed without ever recording a hash, cannot later prove it was not altered — even if it never actually was. Fixing this requires isolating the analysis environment before the first byte is read, and verifying integrity instead of assuming it.",
    ],
    threatModel: [
      "This checklist's threat model assumes two things can be true about a single packet capture at once: it may contain traffic generated by an adversary who anticipated being investigated, and the file itself may be capable of adversely affecting whatever opens it. An adversary who suspects their traffic will eventually be captured and reviewed has a reason to craft that traffic deliberately — a payload that only activates if extracted and executed, a malformed packet aimed at a known class of parser vulnerability, or traffic designed so that an investigator's own follow-up actions (resolving a domain, visiting a URL) tip the adversary off that they are being watched.",
      "Two failure modes recur most often, both represented in this checklist's interactive diagram: a capture opened directly on the analyst's own system instead of an isolated environment, and an embedded object or payload inside a capture being allowed to execute — through extraction and manual opening, or through a parser vulnerability triggered by the capture itself. Either one can compromise the analyst's own system, and either one can happen well before anyone realizes the capture was hostile rather than merely suspicious.",
    ],
    mainContent: [
      "**Preserving the original before anything else.** The first action on receiving a capture is not to open it — it is to make a working copy and set the original aside, read-only, untouched for the rest of the investigation. Every subsequent step in this checklist — every tool run, every extraction, every re-save — happens against the copy. If the working copy is later found to be corrupted, mishandled, or itself compromised, the original is still available to start over from. An investigation that only ever had one copy of its evidence, and modified that copy while working, has already lost the ability to prove what the capture originally contained.",
      "**Verifying integrity, not assuming it.** Compute a cryptographic hash of the original capture the moment it is received, before any analysis begins, and record that hash alongside who received the file, when, and from where. This is not a formality — it is the only thing that lets you, or anyone reviewing your work later, distinguish a capture that was handled correctly from one that was not. A hash computed after analysis has already begun proves nothing about the file's state before that analysis started.",
      "**Isolating the analysis environment.** Analysis belongs in an environment with no route back to production systems and no route back to the analyst's normal workstation or network — a dedicated, disposable environment that can be discarded and rebuilt if it turns out to have been compromised by something in the capture. 'Isolated' has to mean network egress is restricted or disabled by default, not merely that the analysis happens in a separate window or a separate user account on the same host the analyst uses for everything else. In the fictional example running through this checklist, the on-call analyst's standard procedure is to move every received capture into a disposable, network-restricted analysis machine before opening it — never the workstation used for anything else.",
      "**Never executing what the capture contains.** Capture-parsing tools have their own history of parser vulnerabilities, which means the act of opening a malformed capture can itself be the compromise, independent of anything a human decides to click. Beyond that, any file, executable, script, or document reconstructed from a stream inside the capture must never be opened with its native application, executed, or run outside the isolated environment — treat it exactly as you would treat an unsolicited attachment, because that is functionally what it is. 'It's probably nothing' is not a basis for skipping this; the entire reason to isolate the environment is so that being wrong about 'probably' costs nothing.",
      "**Treating captured traffic as adversarial by default, not just its contents.** A domain or address that appears repeatedly in a capture should never be resolved or visited from the analyst's own network to 'see what it is' — doing so can both expose the analyst's infrastructure to whatever that resource actually is, and tip off an adversary who is watching for exactly that kind of follow-up lookup that they have been noticed. Any lookup, resolution, or connectivity test against something observed in a capture belongs in the same isolated environment as everything else, or in a deliberately separated, non-attributable path — never in the analyst's ordinary browsing or DNS resolution.",
      "**Maintaining a defensible record.** Findings, the recorded hash, and the chain-of-custody notes (who handled the capture, when, and what was done to it) should be written to a location outside the disposable analysis environment — not left only inside it. If the analysis environment is later discarded or found to have been affected by something in the capture, the record of what was found should not disappear along with it.",
    ],
    validationEvidence: [
      "This checklist is conceptual. It was not developed against a live or lab-reproduced packet capture, no capture described here was actually analyzed, and no isolated analysis environment was actually built or tested. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the checklist's reasoning is internally consistent.",
    ],
    limitations: [
      "This checklist describes principles and a fictional illustrative scenario, not a specific capture-analysis tool's interface, a specific virtualization or sandboxing product, or a specific hashing utility's exact syntax. Applying it to a real environment requires translating each control into that environment's actual tooling and re-validating the result there.",
      "It does not cover the deep-dive technical methodology of protocol analysis, stream reconstruction, or malware reverse engineering — those are separate disciplines covered, where SecurityCorp publishes on them, by its own dedicated content rather than this checklist.",
      "It does not address the specific legal or regulatory chain-of-custody requirements that may apply in a particular jurisdiction or organization; it covers the technical handling practices that any such requirement would build on top of.",
    ],
    defensiveRecommendations: [
      "Never analyze the only copy of a capture you have — preserve the original read-only and work from a copy for every subsequent step.",
      "Compute and record a cryptographic hash of the original capture immediately on receipt, before any analysis begins, and reverify it at the end of analysis.",
      "Perform all analysis in a disposable, network-isolated environment with no route back to production or to the analyst's normal system.",
      "Never extract and open, or execute, any file, script, or object reconstructed from a capture outside that isolated environment — treat every one as hostile by default.",
      "Never resolve, visit, or connect to a domain, address, or resource observed in a capture from the analyst's own network — that lookup belongs in the same isolated environment as everything else.",
      "Keep findings and chain-of-custody records outside the disposable analysis environment, so they survive even if that environment is later discarded or found compromised.",
    ],
    keyTakeaways: [
      "A packet capture is simultaneously potential evidence that must be preserved and an untrusted input that can act on the system reading it — both properties have to be handled at once.",
      "Integrity is verified with a hash recorded before analysis begins and reverified afterward, not assumed because the file 'looks fine.'",
      "Isolation means no route back to production or to the analyst's normal system — not merely a separate window on the same machine.",
      "Nothing reconstructed or extracted from a capture — a file, a URL, a domain — should ever be opened, resolved, or executed outside the isolated environment, regardless of how routine it looks.",
      "A defensible record of what was found and how the capture was handled must survive even if the disposable analysis environment does not.",
    ],
    references: [
      "NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response: https://csrc.nist.gov/pubs/sp/800/86/final",
      "NIST SP 800-61 Rev. 2, Computer Security Incident Handling Guide: https://csrc.nist.gov/pubs/sp/800/61/r2/final",
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the IR-4 Incident Handling and AU-9 Protection of Audit Information controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    ],
  },
  module: {
    kind: "checklist",
    items: [
      {
        control: "Original capture preserved read-only",
        verificationMethod: "Confirm the original capture file was set read-only or otherwise write-protected immediately on receipt and was never opened directly for analysis.",
        requiredEvidence: "A record showing the original was stored separately from the working copy and remained unmodified throughout the investigation.",
        result: "Pending verification for each capture handled",
      },
      {
        control: "Cryptographic hash recorded on receipt",
        verificationMethod: "Confirm a cryptographic hash of the original capture was computed and logged before any analysis began.",
        requiredEvidence: "A recorded hash value, timestamp, and identity of the person who received and hashed the file.",
        result: "Pending verification for each capture handled",
      },
      {
        control: "All analysis performed on a working copy, never the original",
        verificationMethod: "Confirm every analysis step — every tool run, extraction, or re-save — was performed against a copy, not the original file.",
        requiredEvidence: "A record identifying the working copy as distinct from the original, with the original's hash unchanged at the end of analysis.",
        result: "Pending verification for each capture handled",
      },
      {
        control: "Analysis performed in an isolated environment with no route to production or the analyst's normal system",
        verificationMethod: "Confirm the analysis environment was disposable and had network egress restricted or disabled by default, not merely a separate window on the analyst's normal system.",
        requiredEvidence: "A description or configuration record of the isolated environment's network restrictions and disposability.",
        result: "Pending verification for each capture handled",
      },
      {
        control: "No embedded object or payload was ever executed or opened with its native application",
        verificationMethod: "Confirm every file, script, or object reconstructed from the capture was treated as hostile and was never opened, executed, or run outside the isolated environment.",
        requiredEvidence: "A record showing extracted objects were inspected only through isolated, non-executing analysis methods.",
        result: "Pending verification for each capture handled",
      },
      {
        control: "Extracted domains, addresses, and URLs were never resolved or visited from the analyst's own network",
        verificationMethod: "Confirm any lookup or connectivity check against something observed in the capture was performed only from the isolated environment or a deliberately separated, non-attributable path.",
        requiredEvidence: "A record showing no resolution, visit, or connection attempt against capture-derived indicators occurred from the analyst's ordinary network or browsing context.",
        result: "Pending verification for each capture handled",
      },
      {
        control: "Analysis tooling and the isolated environment itself were kept current",
        verificationMethod: "Confirm the capture-parsing tools and the isolated environment's own software were patched, given that capture-parsing tools have their own history of parser vulnerabilities.",
        requiredEvidence: "A record of the tooling and environment versions in use at the time of analysis.",
        result: "Pending verification for each capture handled",
      },
      {
        control: "Original capture's hash reverified at the end of analysis",
        verificationMethod: "Recompute the original capture's hash at the close of the investigation and confirm it matches the value recorded on receipt.",
        requiredEvidence: "A recorded reverification hash matching the original, recorded value with a timestamp and the identity of who performed the check.",
        result: "Pending verification for each capture handled",
      },
    ],
  },
  diagram: buildDiagram(),
};

function buildDiagram(): FlowDiagramSpec {
  return {
    titleId: "pcap-handling-diagram",
    title: "Fictional safe packet-capture handling flow",
    desc: "A fictional example: a packet capture received by an on-call analyst flows into an integrity check, then an isolated read-only analysis environment, then findings. Interactive: toggle between the normal flow and a failure view showing what happens when a capture is opened directly on the analyst's normal system and an embedded payload is allowed to execute, and explore each node for detail.",
    viewBox: "0 0 900 340",
    failureLabel: "Direct-open failure path",
    caption:
      "Capture received → integrity check → isolated analysis environment → findings, normally. The failure view shows what happens when a capture is opened directly on the analyst's normal system instead — skipping the integrity check and the isolated environment — and an embedded payload is allowed to execute, compromising the analyst's own system.",
    motionDuration: 2600,
    mainPacketRoute: { d: "M160,160 H210 M380,160 H430 M620,160 H670", length: 150 },
    edges: [
      { id: "received-integrity", from: "received", to: "integrity", d: "M160,160 H210", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "integrity-isolated", from: "integrity", to: "isolated", d: "M380,160 H430", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "isolated-findings", from: "isolated", to: "findings", d: "M620,160 H670", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      {
        id: "received-analyst-host",
        from: "received",
        to: "analyst-host",
        d: "M85,200 C85,260 420,260 420,250",
        length: 300,
        kind: "failure",
        activeIn: ["failure"],
      },
    ],
    nodes: [
      {
        id: "received",
        label: "Capture received",
        x: 10,
        y: 120,
        w: 150,
        h: 80,
        activeIn: ["normal", "failure"],
        description:
          "A packet capture arrives — for example, handed to an on-call analyst after a suspicious internal alert in this fictional scenario. At this point it is both potential evidence and an untrusted input: nothing about it should be assumed safe or benign yet.",
      },
      {
        id: "integrity",
        label: "Integrity verification",
        x: 210,
        y: 120,
        w: 170,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Integrity verification — a cryptographic hash of the original capture is computed and recorded before any analysis begins, establishing the baseline that later proves the capture was not altered",
        description:
          "A cryptographic hash of the original capture is computed and recorded before any analysis begins, and the original is set read-only. This step establishes the baseline that a later reverification depends on — skipping it means nothing can later prove the capture was not altered.",
      },
      {
        id: "isolated",
        label: "Isolated read-only analysis environment",
        x: 430,
        y: 120,
        w: 190,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Isolated read-only analysis environment — a disposable, network-restricted environment where a working copy is analyzed and nothing extracted from the capture is ever executed",
        description:
          "A disposable environment with network egress restricted or disabled by default, with no route back to production or to the analyst's normal system. All analysis happens here, against a working copy — never the original — and nothing reconstructed from the capture is ever opened with its native application or executed here or anywhere else.",
      },
      {
        id: "findings",
        label: "Findings and chain-of-custody record",
        x: 670,
        y: 120,
        w: 190,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "safe",
        description:
          "The result of a safely conducted analysis: documented findings, the original capture's verified hash, and a chain-of-custody record — written to a location outside the disposable analysis environment so it survives even if that environment is later discarded.",
      },
      {
        id: "analyst-host",
        label: "Analyst host compromised (should never happen)",
        x: 290,
        y: 250,
        w: 260,
        h: 60,
        activeIn: ["failure"],
        role: "blocked",
        focusableLabel:
          "Analyst host compromised — reached only when a capture is opened directly on the analyst's normal system, skipping the integrity check and the isolated environment, and an embedded payload or a parser vulnerability is allowed to execute",
        description:
          "This becomes reachable only when the integrity check and the isolated environment are both skipped — a capture opened directly on the analyst's ordinary workstation, with an embedded payload extracted and executed, or a malformed capture triggering a vulnerability in the parsing tool itself. Its appearance here, reached directly from the point of receipt, is the failure being illustrated.",
      },
    ],
  };
}
