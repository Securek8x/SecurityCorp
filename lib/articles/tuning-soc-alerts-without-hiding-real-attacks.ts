// Knowledge-base article draft (Bead securitycorp-source-4zl.56.2.1,
// "Tuning SOC Alerts Without Hiding Real Attacks", category
// securitycorp-source-4zl.56.2 "SOC Operations and Alert Tuning").
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is registered in lib/knowledge-content.ts as a drafting-status
// entry; it becomes part of the published catalog only after human privacy/
// technical/publication review, per docs/knowledge-base.md. Every
// organization, analyst, alert, and threshold in this file is fictional and
// sanitized; no real SOC case, alert configuration, telemetry, or employer-
// derived rule appears anywhere in this file.
//
// Judgment calls (for the reviewer):
// - primaryCategory "soc-operations" is lib/taxonomy.ts's existing category
//   id for "SOC Operations and Alert Tuning" (securitycorp-source-4zl.56.2)
//   — not invented.
// - Controlled tags: the bead's suggested "soc-operations" and
//   "alert-tuning" are both canonical ids in lib/knowledge-tags.ts and are
//   used as-is. The bead's third suggestion, "detection", is not a
//   canonical tag id — the vocabulary has "detection-engineering" instead,
//   which is the closest real match and is used here.
// - contentType "playbook" (bead-specified) maps to PlaybookModule
//   (lib/knowledge-content-types.ts). Its fields (trigger/severity/triage/
//   decisionPoints/escalation/containment/recovery) are written for the
//   change-management process of tuning a detection, not for a live
//   incident — this is the first "playbook"-typed and first
//   "detect-respond"-pillar article in the catalog, so there is no sibling
//   article to match field usage against; the mapping is this agent's
//   judgment call, described inline in each field's own prose.
// - No coverImage is added — that workflow is separate and out of scope
//   for this task.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788655329178-fx7oky, template "research", task
// describing this article's research brief needs: NIST/MITRE/CISA-grounded
// alert-tuning technique tradeoffs). Two bounded mcp__ruflo__workflow_status
// checks afterward both showed it reproduced the documented issue in
// CLAUDE.md: 0% progress, a single pending "Execute" step, no retrievable
// editorial output. This draft was therefore produced with the disclosed
// native fallback instead — separate research (primary-source verification
// via WebFetch against attack.mitre.org, csrc.nist.gov, and cisecurity.org,
// not recalled from memory — this caught that NIST SP 800-61 Rev. 2 was
// withdrawn in April 2025 and superseded by Rev. 3, which is cited here
// instead), drafting, technical-verification, publication-safety, and final
// editorial passes — not credited to Ruflo. See the calling agent's final
// report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, PlaybookModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "Every SOC eventually tunes something. Alert fatigue from high-volume, low-precision detections is a documented operational risk, not an analyst-comfort complaint — a queue an analyst can no longer triage carefully degrades their judgment on everything in it, including the one alert that was real. Tuning a noisy detection down is a legitimate response to that problem. Leaving it un-tuned is not automatically the safer default either.",
    "The failure this guide is about starts exactly where tuning succeeds by the most visible measure: the queue gets quieter. Five common techniques — thresholding, suppression windows, aggregation, enrichment, and allowlisting — can each reduce noise correctly, and each can also, misapplied, remove detection of the genuine attack variant that shares a shape with the noise. Both outcomes look identical on a dashboard that only counts alerts per day. This is a playbook for the tuning decision itself: what to check before changing a noisy detection, what each technique risks, a worked (fictional) example, and how to measure whether a change actually helped instead of just went quiet. Every organization, analyst, and alert described here is synthetic.",
  ],
  whatYouWillLearn: [
    "Why alert fatigue is a real, documented risk to genuine detection, and why 'always tune it down' and 'never touch it' are both wrong defaults.",
    "Five tuning techniques — thresholding, suppression windows, aggregation, enrichment, and allowlisting — and the specific way each one can hide a real attack instead of just noise.",
    "A worked example: tuning a noisy, volume-based authentication-failure alert without losing detection of a lower-and-slower variant of the same technique.",
    "How to measure a tuning change's actual effect on both false positives and true-positive catch rate, instead of treating a quieter queue as proof the change worked.",
    "A repeatable checklist for deciding whether a proposed tuning change closes noise or closes a detection.",
  ],
  intendedAudience: [
    "SOC analysts who triage a noisy detection daily and are positioned to propose tuning it.",
    "Detection engineers who own the underlying logic and need a shared vocabulary with analysts about why a rule is loud and what changing it actually risks.",
    "Team leads deciding whether a given tuning request needs a second reviewer, a staged rollout, or a rollback plan before it reaches production.",
  ],
  prerequisites: [
    "Basic familiarity with how a SIEM or detection platform evaluates and fires an alert — a rule, a threshold, a time window, a correlation across events.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
    "Some prior exposure to MITRE ATT&CK's technique/sub-technique structure is helpful for the worked example, but not assumed.",
  ],
  problem: [
    "Alert volume and quality directly affect whether a real incident gets recognized in time. NIST's current incident-response guidance frames detection and analysis as dependent on the signal an analyst actually receives — precursors and indicators have to be prioritized and correlated to be useful, and that work is only possible at a volume a human (or a downstream automated step) can actually process. A detection that fires two hundred times a day at low precision does not get two hundred careful reviews; it gets skimmed, and a skim does not reliably distinguish the alert that matters from the one that doesn't.",
    "Tuning that detection down is a legitimate, often necessary response. The hazard is that the tuning change most likely to cause real harm looks, on the one dashboard most teams check, identical to the tuning change that helped: both produce fewer alerts. A team that measures success only by alert-count-per-day cannot tell 'we removed noise' from 'we removed a variant of the actual attack,' because both events are the same event on that metric. The detection stays green. Nobody is paged. The gap is invisible until, or unless, the removed variant actually occurs.",
  ],
  threatModel: [
    "This is not an adversary threat model in the traditional sense. The failure mode here is a defensive process failure: an analyst or detection engineer, acting in good faith to reduce noise, narrows a detection's coverage rather than its false-positive rate, and no one notices until a real instance of the narrowed-out variant occurs — at which point the detection that should have caught it stays silent by design.",
    "Representative scenario, fictional throughout: a mid-size organization we'll call Cobalt Ridge Utilities operates a SOC whose SIEM includes a detection named 'Excessive Authentication Failures.' It fires whenever a single account records more than a configured number of failed logins from a single source within a fixed time window — a standard implementation of MITRE ATT&CK T1110, Brute Force. It is, by a wide margin, the loudest detection in the environment, and the SOC lead has proposed tuning it.",
    "Failure modes to watch for while tuning this exact detection, none of which require a sophisticated attacker to exploit — only an attacker whose behavior happens to fall outside the newly narrowed window: (1) raising the per-account volume threshold high enough to quiet routine noise, without checking whether the new threshold also sits above what a deliberately slow, low-volume attempt against that same account would ever produce; (2) a suppression window that treats a second alert on the same account within an hour as duplicate noise to swallow, when it could instead be an attacker returning after an unsuccessful first burst; (3) aggregating failed-login events across the whole environment into a single rolled-up daily digest, which can average away a sharp spike localized to one account or one source that a per-entity view would have caught; (4) an allowlist entry added for a known noisy source — a misconfigured service account, a vulnerability scanner's IP range — that has no expiry and quietly outlives the reason it was added; (5) enrichment fields added only to help an analyst dismiss an alert faster, rather than to make a genuine positive easier to recognize and a false one easier to justify dismissing on stated evidence.",
    "Out of scope: the tuning interface or query syntax of any specific SIEM product, and authoring new detection logic from scratch rather than adjusting an existing detection's sensitivity.",
  ],
  mainContent: [
    "**Thresholding raises the bar — and can raise it above a real, quieter variant of the same technique.** Raising a volume-based threshold (more failed logins required per account, per window, before the rule fires) is the most common first move, and it works precisely because most benign noise sits well below any threshold that would still catch a real, fast brute-force burst. The risk is that 'still catches a fast burst' is not the same claim as 'still catches every real attempt.' MITRE ATT&CK documents password spraying (T1110.003) as a distinct sub-technique specifically because it uses a small number of attempts per account across many accounts, rather than many attempts against one account — a per-account volume threshold, however well-tuned against ordinary brute force, is structurally blind to that shape of traffic, not just less sensitive to it. Raising a threshold answers 'how much single-account noise can we tolerate' without ever asking the separate question of what a spread-out attempt would look like against the same rule.",
    "**Suppression windows deduplicate — and can swallow a returning attacker along with a returning false positive.** A suppression window (don't re-alert on the same account or source for N minutes/hours after the first alert) is a reasonable response to a single benign source triggering the same alert repeatedly, but the same window has no way to distinguish 'this is the same benign cause firing again' from 'this is an attacker who paused and resumed.' A window scoped too broadly — suppressing on account alone, with no re-check of whether the suppressed period actually still matches the original benign cause — quietly extends a blind spot for exactly as long as the suppression lasts, on every account it covers, whether or not the underlying cause is still benign.",
    "**Aggregation summarizes — and can average a localized spike into invisibility.** Rolling many individual events into one summary (a daily count instead of per-event detail, an environment-wide total instead of a per-account or per-source breakdown) reduces the volume an analyst has to review, at the cost of the granularity that made a spike visible in the first place. NIST's guidance on log management describes aggregation and correlation as tools for making large log volumes usable, not as a substitute for retaining the entity-level detail a correlation step needs — a digest that only preserves a total, with no way to drill back into which single account or source drove it, has traded the ability to notice a spike for the ability to see fewer numbers.",
    "**Enrichment adds context — and can be misused to build an auto-dismiss shortcut instead of a better-informed review.** Attaching context to an alert (asset criticality, account role, source geography or ASN, whether MFA is enforced on the account) is one of the more defensible tuning moves, because it doesn't remove detection — it changes what the analyst sees when the detection fires. The risk shows up when enrichment is used to justify an automatic close rather than a faster, better-informed one: trusting a 'known corporate VPN range' field to auto-dismiss without periodically verifying that the underlying geo-IP or asset-inventory feed is current, for example, converts a helpful signal into an unverified assumption sitting silently in the tuning logic.",
    "**Allowlisting is the technique most likely to become permanent, unless it is built to expire.** Excluding a known-benign, high-volume source (a vulnerability scanner's IP range, a service account with a documented, unusual login pattern) from a detection is sometimes the correct fix — it is the one technique here that removes a specific, verified cause rather than adjusting a general parameter. The hazard is identical to the one this site's guide on secrets-scanner coverage describes for a scan allowlist entry: an exclusion added under time pressure, with no expiry and no owner, is a permanent way to stop looking at something. If the excluded source is later repurposed, compromised, or simply changes behavior, the allowlist keeps excluding it on the strength of a justification that no longer applies, and nothing in the exclusion itself prompts anyone to re-check.",
    "**A false negative and a false positive need different fixes, and no amount of retuning the same rule closes both.** Every technique above operates on the same underlying detection logic — it changes when that logic fires, not what it is capable of recognizing. If the actual problem is a genuine coverage gap (a rule that structurally cannot recognize a real attack shape, like a per-account threshold facing password-spray traffic), tuning the existing rule's parameters cannot fix it, because the rule was never evaluating the dimension that would catch it. Closing a coverage gap requires a structurally different detection — a separate rule evaluating a different dimension of the same event stream — not a better-tuned version of the same one.",
  ],
  validationEvidence: [
    "This guide describes a tuning process and technique-level failure modes, illustrated with a single fictional detection and organization; it does not reproduce a specific SIEM's configuration, a completed tuning exercise, or measured before/after results from a real environment. Its evidence state is UNVERIFIED — the recommendations are a starting checklist to adapt and verify against your own detection's actual behavior, not a validated outcome.",
  ],
  limitations: [
    "This guide covers adjusting the sensitivity of an existing detection. It does not cover authoring new detection logic, or the statistical methods (time-series anomaly baselining, dynamic thresholding) some platforms offer as an alternative to a fixed threshold — those deserve their own treatment.",
    "It does not cover the mechanics of any specific SIEM or detection platform's tuning interface, query language, or built-in suppression/allowlist features, which vary by product and change over time.",
    "The measurement approach described below assumes a team already records an analyst-assigned disposition (true positive / false positive / benign-but-expected) on closed alerts. A team without that baseline needs to build disposition tracking before precision or true-positive catch rate can be measured at all — this guide does not cover setting up that tracking from scratch.",
  ],
  defensiveRecommendations: [
    "Before tuning any detection, establish what specifically is producing the noise — a single misconfigured or unusually noisy source, a threshold set without reference to the technique's known low-and-slow variant, or a genuinely low-value detection — rather than applying a familiar technique by habit.",
    "Treat a coverage gap (a real attack shape the rule cannot recognize) and a precision problem (too many benign events matching a rule that works) as different failure modes; only the second is fixed by adjusting the existing rule's parameters.",
    "When a technique used to catch a specific real variant (a fast, high-volume attack) also creates a plausible blind spot for a related, quieter variant (a slow, low-volume attack using the same technique), add a second, structurally distinct detection for the quieter variant rather than assuming the tuned rule now covers both.",
    "Give every allowlist or suppression exception an owner and an explicit review or expiry date at creation time; an exception with neither is a standing exclusion nobody is accountable for revisiting.",
    "Run a proposed tuning change in a non-alerting, audit-only mode alongside the existing logic for a bake-in period before cutting over, so a widened net is discovered in review, not after an incident.",
    "Measure a tuning change's effect on both false positives and true-positive catch rate, not on alert volume alone — track disposition-labeled precision, and separately confirm known-bad test patterns for the detection's covered techniques still fire through the new logic.",
    "Review standing allowlist and suppression exceptions on a recurring cadence, and treat an exception whose original justification can no longer be independently verified as expired, not as grandfathered in.",
  ],
  keyTakeaways: [
    "Alert fatigue is a real risk to genuine detection, not just an analyst-comfort issue — but a quieter queue and a hidden coverage gap look identical on a dashboard that only counts alerts per day.",
    "Thresholding, suppression windows, and aggregation each risk removing detection of a real attack that shares a shape with the noise being removed — most concretely, a volume-based threshold tuned against fast brute force can leave a slower, spread-out variant of the same technique (MITRE ATT&CK T1110.003, password spraying) with no coverage at all.",
    "Allowlisting is the technique most likely to become a permanent blind spot; giving every exception an owner and an expiry date is what keeps it a temporary, reviewed exclusion instead.",
    "A coverage gap and a false-positive problem need different fixes — retuning the same rule's parameters cannot close a gap the rule was never evaluating the right dimension to catch, and measuring success requires checking true-positive catch rate directly, not inferring it from a quieter queue.",
  ],
  references: [
    "MITRE ATT&CK, T1110 Brute Force: https://attack.mitre.org/techniques/T1110/",
    "MITRE ATT&CK, T1110.003 Password Spraying: https://attack.mitre.org/techniques/T1110/003/",
    "NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile: https://csrc.nist.gov/pubs/sp/800/61/r3/final",
    "NIST SP 800-92, Guide to Computer Security Log Management: https://csrc.nist.gov/pubs/sp/800/92/final",
    "NIST SP 800-94, Guide to Intrusion Detection and Prevention Systems (IDPS): https://csrc.nist.gov/pubs/sp/800/94/final",
    "CIS Critical Security Control 8, Audit Log Management: https://www.cisecurity.org/controls/audit-log-management",
    "CIS Critical Security Control 13, Network Monitoring and Defense: https://www.cisecurity.org/controls/network-monitoring-and-defense",
  ],
};

// PlaybookModule (kind: "playbook") maps naturally to an incident's
// trigger/severity/triage/escalation/containment/recovery shape. This
// article is about the change-management process of tuning a detection
// rather than a live incident, so each field is written for that process:
// "trigger" is what starts a tuning review, "severity" is the review rigor
// a proposed change warrants (not an incident severity), "containment" is
// the guardrails that limit the tuning change's own blast radius, and
// "recovery" is what to do if a tuning change is later found to have
// suppressed a genuine attack.
const module_: PlaybookModule = {
  kind: "playbook",
  trigger:
    "A detection is generating enough analyst load — by alert volume, time-to-triage, or documented alert fatigue — that a team proposes narrowing, suppressing, or otherwise reducing its noise. This playbook applies from that proposal through deployment of the tuning change, before the change reaches production.",
  severity:
    "Not an incident severity — this rates how much review a proposed tuning change needs. Treat any change to a detection that has ever produced a verified true positive as at least a routine change requiring a second reviewer. Treat a change to a detection covering a high-impact technique (credential theft, lateral movement, data staging or exfiltration, ransomware precursors) as requiring documented sign-off from a second reviewer and a written rollback plan before deployment, regardless of how routine the specific noise looks.",
  triage: [
    "Pull a sample of recent alerts from the noisy detection and label each with its actual disposition (true positive, false positive, benign-but-expected) rather than assuming the whole volume is noise.",
    "For the false-positive and benign-but-expected alerts, identify the specific recurring cause — a single noisy source, a threshold set without reference to a known quieter attack variant, a rule that doesn't distinguish an expected pattern from an unexpected one.",
    "Check whether the detection's underlying technique (per MITRE ATT&CK, where applicable) has a documented lower-volume or otherwise structurally different sub-technique or variant that the current rule logic does not evaluate for — this determines whether tuning the existing rule can address the noise at all, or whether a second, distinct detection is also needed.",
  ],
  decisionPoints: [
    "If the noise has one clearly identified, verifiable cause (a specific source, account, or pattern): prefer a time-boxed allowlist entry with a named owner and an expiry date over a general threshold or suppression change that also affects everything else the rule covers.",
    "If the noise is broadly distributed and a volume-based threshold is the actual lever: raise the threshold only after checking it does not also exceed the volume a known quieter variant of the same technique would produce; if it does, add a second, structurally different detection for that variant rather than relying on the same rule to cover both.",
    "If the noise comes from bundling many low-context events together: prefer enrichment (adding context that helps a human recognize a real positive faster) over aggregation (rolling events together in a way that can average out a localized spike), unless the aggregation preserves per-entity drill-down.",
  ],
  escalation: [
    "Escalate to a second reviewer (a detection engineer if the proposer is an analyst, or a peer detection engineer otherwise) before deploying any change to a detection that has ever produced a verified true positive.",
    "Escalate to the team lead, and require a documented rollback plan, before deploying a change to a detection covering a high-impact technique, regardless of how narrow or reasonable the specific change looks in isolation.",
    "Escalate immediately, independent of this playbook's normal cadence, if reviewing a noisy detection's history surfaces an alert that was dispositioned as benign but, on closer look, cannot actually be confirmed benign — treat that as a potential live finding, not a tuning input.",
  ],
  containment: [
    "Deploy a proposed tuning change in a non-alerting, audit-only (shadow) mode alongside the existing detection logic for a defined bake-in period before cutting over, so its effect on real traffic is visible in review rather than discovered after an incident.",
    "Scope every allowlist or suppression exception as narrowly as the verified cause allows (a specific source or account, not a broad range or category), and require an expiry date and a named owner at creation time — no exception is created without both.",
    "Keep the prior detection logic available in a non-alerting or comparison mode for a defined period after cutover, so a widened-net effect can still be identified retroactively rather than only prospectively.",
  ],
  recovery: [
    "If a tuning change is later found to have suppressed, delayed, or missed a genuine attack, treat the incident response to that attack as the priority; the tuning-change review runs afterward, as its own item, not folded into incident cleanup under time pressure.",
    "Roll back the specific tuning change, not the whole detection, where the two can be separated — reverting an entire detection to its prior noisy state discards the parts of the change that were not the cause of the gap.",
    "Backfill-review alerts and events that were suppressed, allowlisted, or aggregated away during the period the flawed tuning change was active, to identify whether the same gap allowed anything else through.",
    "Record what the tuning change actually removed (which dimension of the attack it stopped evaluating), not only that it was reverted, so the same gap is not reintroduced by a future, differently-worded tuning proposal.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "soc-alert-tuning-diagram",
  title: "A per-account threshold tuned for one attack shape misses another",
  desc: "A brute-force burst against a single account flows through an authentication-failure detection rule, a tuning layer, and into the analyst triage queue. Interactive: switch between the normal path, where a fast single-account burst correctly triggers an alert, and the failure path, where a password-spray attempt — the same technique's low-volume, many-account variant — never crosses the rule's per-account threshold and produces no alert at all, never even reaching the tuning layer. Explore each node for details.",
  viewBox: "0 0 940 340",
  failureLabel: "Coverage gap, not a suppressed alert",
  caption:
    "Fictional Cobalt Ridge Utilities SOC: a single-account brute-force burst (MITRE ATT&CK T1110) crosses the detection rule's per-account volume threshold, passes through the tuning layer, and reaches the analyst queue as intended. A password-spray attempt (T1110.003) — few attempts per account, spread across many accounts — never crosses that same per-account threshold, so no alert is generated at all; the tuning layer and analyst queue are never reached, because the rule was never evaluating the dimension that would have caught it.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M200,150 H230 M450,150 H480 M700,150 H730", length: 90 },
  edges: [
    { id: "burst-rule", from: "burst", to: "rule", d: "M200,150 H230", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "rule-tuning", from: "rule", to: "tuning", d: "M450,150 H480", length: 30, kind: "main", activeIn: ["normal"] },
    { id: "tuning-queue", from: "tuning", to: "queue", d: "M700,150 H730", length: 30, kind: "main", activeIn: ["normal"] },
    { id: "spray-rule", from: "spray", to: "rule", d: "M340,260 V185", length: 75, kind: "failure", activeIn: ["failure"] },
    { id: "rule-noalert", from: "rule", to: "noalert", d: "M340,185 V220 H590 V260", length: 150, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "burst",
      label: "Single-account brute-force burst",
      x: 10,
      y: 120,
      w: 190,
      h: 60,
      activeIn: ["normal"],
      description:
        "A fast, high-volume attempt against one account — the classic shape of MITRE ATT&CK T1110, Brute Force. Its volume is exactly what a per-account threshold is designed to catch.",
    },
    {
      id: "spray",
      label: "Password-spray attempt (many accounts)",
      x: 10,
      y: 260,
      w: 220,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Password-spray attempt — MITRE ATT&CK T1110.003, few attempts per account spread across many accounts",
      description:
        "MITRE ATT&CK's T1110.003 sub-technique: a small number of attempts per account, spread across many accounts, rather than many attempts against one account. It is real credential-guessing activity, not noise — but its per-account volume never approaches a threshold tuned against the burst pattern above.",
    },
    {
      id: "rule",
      label: "Detection rule: failed logins per account per window",
      x: 230,
      y: 115,
      w: 220,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Detection rule — evaluates failed-login volume per account per time window; structurally blind to volume spread across many accounts",
      description:
        "Fires when a single account's failed-login count exceeds a configured threshold within a time window. This is the rule tuning changes here, and it evaluates one dimension only: volume against one account. A password-spray attempt's volume, measured per account, stays under that threshold no matter how the threshold is set — the rule was never built to evaluate volume across accounts.",
    },
    {
      id: "tuning",
      label: "Tuning layer: threshold, suppression, allowlist",
      x: 480,
      y: 115,
      w: 220,
      h: 70,
      role: "boundary",
      activeIn: ["normal"],
      focusableLabel: "Tuning layer — threshold, suppression window, and allowlist checks applied only to alerts the rule already generated",
      description:
        "Where thresholding, suppression windows, and time-boxed allowlist exceptions are applied to reduce noise from alerts the rule already fired. This layer can only act on an alert that reaches it — it has no effect on, and no visibility into, an attack shape the rule upstream never recognized in the first place.",
    },
    {
      id: "queue",
      label: "Analyst triage queue",
      x: 730,
      y: 120,
      w: 200,
      h: 60,
      role: "safe",
      activeIn: ["normal"],
      description:
        "Where a correctly-tuned alert reaches a human for review. The normal path shows the intended outcome: a real, fast brute-force burst is detected, passes through tuning, and is triaged.",
    },
    {
      id: "noalert",
      label: "No alert generated",
      x: 480,
      y: 260,
      w: 220,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "No alert generated — the coverage gap, not a suppressed or allowlisted alert",
      description:
        "The failure path's actual endpoint: nothing. Because the rule's threshold is defined per account, password-spray traffic never crosses it, so no alert is ever generated for the tuning layer to act on. This is a coverage gap, not a suppression outcome — no threshold change, suppression window, or allowlist entry inside the tuning layer caused it, because the tuning layer was never reached. Closing it requires a second, structurally different detection that evaluates volume across accounts, not a better-tuned version of this rule.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Tuning SOC Alerts Without Hiding Real Attacks",
    slug: "tuning-soc-alerts-without-hiding-real-attacks",
    summary:
      "A playbook for reducing SOC alert fatigue — thresholding, suppression windows, aggregation, enrichment, and time-boxed allowlisting — without quietly disabling detection of the genuine attack variant each technique is most likely to hide.",
    pillar: "detect-respond",
    primaryCategory: "soc-operations",
    contentType: "playbook",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["soc-operations", "alert-tuning", "detection-engineering"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
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
