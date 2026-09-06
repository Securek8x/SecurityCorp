// Knowledge-base article draft (Bead securitycorp-source-4zl.57.1.2, "Rules
// of Engagement for an Isolated Lab"). Status is intentionally "drafting" —
// see docs/publication-safety-policy.md. This file is registered in
// lib/knowledge-content.ts as a drafting-status entry; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. This is the foundational article for
// the planned Authorized Offensive Security sub-series (parent epic
// securitycorp-source-4zl.57.1) — every later article in that series is
// expected to assume the reader already has a signed rules-of-engagement
// document and an isolated lab that meets this article's isolation bar.
// Every example describes a fictional internal lab program ("the Fenwick
// Range"), a fictional lab operator, and fictional systems using
// documentation-safe addresses (RFC 5737 ranges) and .example domains. No
// real host, credential, employer detail, exploit technique, or
// destructive/attack-recipe instruction appears anywhere in this file —
// techniques are described only at the conceptual/detection level (what
// class of activity a control needs to catch), never as a runnable
// procedure. See the "no exploitation content" confirmation in the
// orchestrating session's final task report.
//
// Differentiation from lib/articles/scoping-authorized-security-assessment.ts:
// that article scopes an engagement performed *against a client's own
// production-adjacent estate* (a fictional external company, Meridian
// Freight Co.) and covers third-party authorization, announced-vs-
// unannounced testing, and a client sign-off relationship. This article is
// narrower and sits one step earlier in the series: it is about the rules
// of engagement for *the lab itself* — an environment the tester or their
// organization owns and fully controls — including what makes a lab
// "isolated" in the first place, and how to handle whatever a lab exercise
// turns up (findings, technique notes, captured artifacts) once the
// exercise ends. A reader who has never scoped a client engagement should
// still be able to follow this article; the two are complementary, not
// overlapping.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788655446673-4ha9cy, template "research", task
// describing this article's exact objective, audience, and scope).
// workflow_template list returned zero registered templates. A bounded
// workflow_status check afterward showed the same documented issue recorded
// in CLAUDE.md ("Current Ruflo executor limitation"): the workflow stayed at
// 0% progress with a single pending "Execute" step and returned no
// retrievable editorial output. This draft was therefore produced with the
// disclosed native fallback instead — separate research (source
// verification via WebFetch against each primary source below, not recalled
// from memory), drafting, technical-verification, and publication-safety
// passes — not credited to Ruflo. Every citation below was independently
// confirmed live and its exact title checked before use.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "An offensive-security exercise is authorized only to the extent that written scope and rules of engagement exist before any technical activity starts, and it is safe only to the extent that it runs somewhere genuinely isolated from anything that matters. Neither of those is optional, and neither is satisfied by good intentions or a verbal understanding. This guide covers both halves together, because they fail together in practice: a lab that isn't really isolated turns a documentation exercise into an incident, and a lab with no written rules of engagement turns even a fully isolated exercise into activity nobody can later prove was authorized, bounded, or safe.",
    "This is the foundational article for a planned series on authorized offensive security. Every later article in that series assumes the reader already has two things this guide is about: a signed rules-of-engagement document, and a lab environment that actually meets the isolation bar such a document depends on. Every system, address, and identity described here is fictional — this guide is about the authorization, scoping, and post-exercise handling process, not about how to execute any specific offensive technique.",
  ],
  whatYouWillLearn: [
    "Why written authorization and a defined scope have to exist before any offensive activity starts — including in a lab you own — and what a plausible-sounding verbal agreement still fails to provide.",
    "What a rules-of-engagement document for a lab exercise needs to contain: scope boundaries, an explicit out-of-scope list, a defined time window, an emergency-stop and contact procedure, and data-handling rules for whatever the exercise produces.",
    "What actually makes a lab 'isolated' rather than merely 'separate' — the difference between a genuinely isolated environment and one that is shared or production-adjacent, and why that distinction is a network-architecture fact, not a policy statement.",
    "How to handle findings, notes, and captured artifacts safely once an exercise ends, without keeping live credentials, destructive payloads, or copy-pasteable attack steps anywhere they could leak.",
    "How to translate what a lab exercise actually demonstrated into detection coverage and remediation work, so the exercise produces defensive value instead of just a war story.",
  ],
  intendedAudience: [
    "Security practitioners and defenders about to run their first authorized lab-based offensive exercise, or setting up a lab environment for a team to use.",
    "Anyone using this site's planned authorized-offensive-security series, which assumes this article's rules-of-engagement and isolation baseline as a prerequisite for every later piece.",
    "Engineering or team leads asked to approve or host a lab environment, who need to know what to check before saying yes.",
  ],
  prerequisites: [
    "No prior offensive-security experience is assumed — this guide is about authorization, scoping, isolation, and post-exercise handling, not testing technique.",
    "Basic familiarity with the idea of a network boundary (what it means for one network segment to be reachable from another) is helpful for the isolation section but not required to follow the rest.",
    "Nothing here should be treated as legal advice. Where this guide touches legal exposure, it describes the general shape of the risk, not a jurisdiction-specific determination — get your own counsel's review before relying on any authorization document for a real exercise.",
  ],
  problem: [
    "It's easy to assume a lab is safe by default because it's 'just a lab' — a personal environment, a spun-up set of virtual machines, a training range nobody else uses. That assumption breaks in two independent ways. First, 'authorized' is not automatic just because you own the hardware: running offensive tooling against a system, even one you administer, without a written scope and rules of engagement leaves you unable to later demonstrate what you were actually authorized to do, to whom, and until when — a real gap if the lab turns out to share infrastructure, an account, or a network path with something you don't fully control. Second, 'isolated' is not automatic just because a system is labeled 'lab' — a lab that shares a network segment, a credential, or a storage volume with production or shared infrastructure is not isolated, regardless of what anyone calls it.",
    "Unauthorized-access statutes like the U.S. Computer Fraud and Abuse Act, and equivalent laws elsewhere, do not treat benign or educational intent as a blanket defense — the exact standard is more complicated than any single sentence here can responsibly summarize (different provisions carry different intent requirements, and courts have narrowed and clarified what counts as 'unauthorized' access over time), but the practical point that matters for a lab is simple: access without the infrastructure owner's authorization can create legal exposure regardless of why you did it. A lab hosted on infrastructure you don't solely control (a shared employer environment, a cloud account with other tenants, a network segment that also carries production traffic) can put you in exactly that gap even when your intent is entirely defensive. Getting the authorization and the isolation right, before any technical activity starts, is what closes both problems at once — and neither this paragraph nor anything else in this article is a substitute for your own counsel's review of your actual situation.",
  ],
  threatModel: [
    "The risk this guide addresses is not a single offensive technique — it is the risk of authorized activity behaving like unauthorized activity, because the scope was never written down, or because the 'isolated' lab wasn't. Three failure modes recur: running an exercise with no written scope or rules of engagement, so there is no record of what was authorized if a question ever comes up; running an exercise in an environment that looks isolated but has a live path back to a shared or production network, a real credential, or a real dataset; and mishandling whatever the exercise produces afterward — notes, screenshots, captured traffic, technique write-ups — in a way that turns a safe lab exercise into an unsafe artifact once it leaves the lab.",
    "Each failure mode maps to a specific piece of this guide: written scope and rules of engagement for the first, a concrete isolation architecture and a pre-exercise verification step for the second, and explicit data-handling and sanitization rules for the third. As with a client engagement, getting the paperwork and the boundary right before anything technical happens is most of the actual security work — the offensive techniques covered by later articles in this series only make sense to practice once these are in place.",
  ],
  mainContent: [
    "**A lab needs the same written authorization discipline as a client engagement — this article assumes that structure rather than re-deriving it.** See this site's \"How to Scope an Authorized Security Assessment\" (linked below, under Related content) for the general mechanics: a scope document naming exactly what's in and out of bounds, a rules-of-engagement document covering permitted techniques and an exact time window, and a signed authorization naming who approved the work, all fixed before any technical activity begins — NIST SP 800-115 treats this planning step as the foundation the rest of a security test depends on, whether the target is a client's production estate or your own lab. What's different for a self-owned lab is narrower than it might sound: who can sign off (a one-paragraph, dated self-authorization kept alongside the lab's own documentation is sufficient for a solo lab; a team or organizational lab still needs a named approver with actual authority over the environment, the same requirement client-engagement scoping depends on), and an explicit emergency-stop procedure sized for a lab's actual failure modes (a hypervisor host becoming unresponsive, a VM's network configuration turning out to bridge somewhere unexpected) — as simple as 'stop the exercise, disconnect the affected lab segment, and do not resume until the cause is understood,' following the same emergency-contact-and-stop discipline PTES's pre-engagement framework describes for client engagements.",
    "**The out-of-scope list needs lab-specific entries a client engagement's never has.** Beyond the usual exclusions, write down explicitly: your own workstation if it isn't part of the intentionally isolated environment, any account or service that also has a real-world purpose, any shared network segment the lab happens to sit near, and any system you don't have sole administrative control over. A lab environment that was assembled quickly often has more of these adjacent, unintentionally-reachable systems than its operator expects — which is exactly why the next section treats isolation as something to verify, not assume.",
    "**Data-handling rules cover what the exercise produces, not just what it targets.** Decide, before starting, what you will keep from the exercise (configuration notes, a written summary of what was demonstrated, sanitized screenshots) and what you will not (a full packet capture with no retention plan, a credential dump from an intentionally vulnerable lab target, a script containing a working exploit against a specific version). Anything captured during the exercise that resembles a real secret — even a lab-generated one — should be treated as sensitive until deliberately discarded or rotated out of the lab, not left sitting in a notes file. This rule exists independently of whether the lab is isolated, because a notes file with lab findings in it can leave the lab environment even when the lab itself never does.",
    "**An isolated lab is a network-architecture fact, not a label.** A lab is isolated when it has no route — direct or indirect — to a production network, a shared corporate network, the internet at large (beyond what's explicitly needed and controlled), or any account or credential with a real-world purpose. Concretely: dedicated virtual machines or physical hardware on a network segment with no bridge to anything else, its own separate credentials that are never reused anywhere real, and outbound access either fully blocked or limited to a narrow, deliberate allowlist rather than open by default. A lab is not isolated merely because it's labeled 'lab,' runs on a separate VLAN that still routes to the corporate network under some condition, or uses a cloud account that also holds production workloads — 'separate' and 'isolated' are different claims, and only the second one is the safety property this guide depends on.",
    "**Verify isolation before trusting it, the same way you'd verify any other control.** Before running anything against the fictional Fenwick Range — this guide's illustrative internal lab, hosted on its own dedicated segment with no bridge to any other network — its operator confirms, and re-confirms after any environment change, that the lab segment cannot reach the corporate network or the internet except through the specific narrow path the lab's own design calls for, that lab accounts are distinct from every real account, and that no lab host holds a copy of real data. Treat a lab's isolation as something that can regress silently — a hypervisor network setting changed for convenience, a VM temporarily bridged to fix an unrelated problem and never un-bridged — and re-verify it periodically rather than trusting the original setup indefinitely.",
    "**Handle findings, technique notes, and captured artifacts the same way you'd handle any sensitive material.** Once an exercise is done, write up what it demonstrated at the level of a defender who needs to build a detection or a fix — what class of behavior occurred, what it would look like in logs, what control would have stopped or caught it — rather than as a step-by-step reproduction. Sanitize anything you keep: redact real-looking values even though they're lab-generated, strip identifying metadata from screenshots, and never keep a working exploit, a credential, or a destructive payload lying around 'for reference.' If a write-up is ever intended to leave the lab environment for teaching purposes, it goes through the same sanitization and review this site applies to every other piece of published content — internal-source by default, never automatically publication-ready.",
    "**Detection and remediation are the actual point of running the exercise.** A lab exercise that produces a finding and nothing else has produced a story, not a security improvement. For each finding, work backward to two concrete outputs: a detection question (what telemetry would have shown this happening, and does a real monitoring pipeline actually collect it — see MITRE ATT&CK for the vocabulary to describe adversary behavior in a way a detection engineer can act on) and a remediation question (what specific configuration, control, or process change closes the gap the finding demonstrated, and how would you verify the fix actually holds rather than assuming it does). Treat every lab finding as unfinished until both questions have a written answer.",
  ],
  validationEvidence: [
    "This guide describes an authorization, isolation-verification, and post-exercise handling process, using a fictional illustrative lab; it does not reproduce a specific real exercise, a captured finding, or a completed assessment. Its evidence state is UNVERIFIED — the rules-of-engagement structure and isolation checklist here are a starting point to adapt to your own lab's actual architecture and your own organization's or jurisdiction's requirements, not a validated template to use unmodified.",
  ],
  limitations: [
    "This guide covers the authorization, scoping, isolation, and post-exercise handling around a lab exercise — it does not teach any specific offensive technique, tool, or attack path. Later articles in this planned series cover technique-level material, and each will assume this article's rules-of-engagement and isolation baseline as a starting condition.",
    "Legal requirements around authorized testing and self-authorization vary by jurisdiction, by employer policy, and by what infrastructure the lab actually runs on (personally owned hardware versus an employer's cloud account carries different obligations even for a 'personal' lab). This article describes the shape of the documentation and the isolation property, not legal advice — get your own counsel's or employer's review before relying on it for anything beyond a personal, fully self-owned lab.",
    "The fictional Fenwick Range described here is a deliberately simple single-operator lab. A team or organizational lab shared by multiple people raises additional questions this guide does not fully cover — who can change scope, how conflicting concurrent exercises are prevented, and how shared lab credentials are managed — that deserve their own review before scaling this guide's approach to a shared environment.",
  ],
  defensiveRecommendations: [
    "Write and date a scope and rules-of-engagement document before any technical activity starts, even for a solo lab exercise — a one-paragraph self-authorization is enough, but it has to exist and predate the exercise.",
    "Verify the lab's isolation directly (no route to production, shared, or internet-reachable infrastructure beyond an explicit narrow allowlist; no shared credentials; no real data) before trusting it, and re-verify after any environment change rather than assuming the original setup still holds.",
    "Define an explicit time window and an emergency-stop procedure as part of the rules of engagement, not as something improvised if something goes wrong.",
    "Set data-handling rules for exercise output before generating any: what gets kept (sanitized notes, a defensive write-up) and what gets discarded (working exploits, lab-generated secrets, unredacted captures).",
    "For every finding, produce a detection answer and a remediation answer before considering the exercise complete — a finding with neither is not yet a security improvement.",
    "Keep the signed scope and rules-of-engagement document retrievable for as long as the lab exists — it's what establishes that the activity was authorized if that's ever in question.",
  ],
  keyTakeaways: [
    "Written scope and rules of engagement have to exist before any offensive activity starts, even in a lab you fully own — verbal intent and good faith don't establish authorization on their own.",
    "'Isolated' is a network-architecture fact (no route to production, shared, or real-credential infrastructure), not a label — verify it directly and re-verify it after any change, rather than assuming a lab is safe because it's called one.",
    "Rules of engagement for a lab need the same core elements as a client engagement: explicit scope, an explicit out-of-scope list, a defined time window, an emergency-stop procedure, and data-handling rules for whatever the exercise produces.",
    "A finding isn't done until it has produced both a detection answer and a remediation answer — the point of an authorized exercise is the defensive improvement it produces, not the exercise itself.",
  ],
  references: [
    "NIST SP 800-115, Technical Guide to Information Security Testing and Assessment: https://csrc.nist.gov/pubs/sp/800/115/final",
    "CISA, Penetration Testing (service and rules-of-engagement overview): https://www.cisa.gov/resources-tools/services/penetration-testing-0",
    "Penetration Testing Execution Standard (PTES), Pre-Engagement Interactions: https://pentest-standard.readthedocs.io/en/latest/preengagement_interactions.html",
    "OWASP Web Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/",
    "MITRE ATT&CK: https://attack.mitre.org/",
  ],
  relatedSlugs: ["scoping-authorized-security-assessment", "network-trust-boundaries", "segmentation-vs-isolation"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A lab environment (dedicated hardware, or virtual machines on a segment with no bridge to any other network) that you or your organization fully administers — this guide describes what to verify about it, not how to provision one.",
    "The authority to authorize the exercise: for a solo lab, that's simply you, in writing; for a team or organizational lab, a named approver with actual control over the environment.",
    "A defined, achievable objective for the exercise (for example, practicing a specific defensive detection against an intentionally vulnerable lab target) — an exercise with no stated objective has no way to define its own scope.",
    "A place to keep the rules-of-engagement document and any post-exercise write-up that isn't the lab environment itself, so it survives a lab rebuild or teardown.",
  ],
  procedure: [
    "Write the scope: name the exact lab systems in scope, an explicit out-of-scope list (your own workstation if it's outside the isolated environment, any account or service with a real-world purpose, anything you don't have sole administrative control over), and a defined start and end date/time for the exercise.",
    "Write the rules of engagement as a separate document: the class of activity permitted (for example, non-destructive exploitation of intentionally vulnerable lab targets) versus anything requiring separate authorization, the emergency-stop procedure, and — even for a solo exercise — at least one way to reach yourself or a teammate if something needs to be paused.",
    "Verify the lab's isolation directly before starting: confirm the lab segment has no route to production, shared, or internet-reachable infrastructure beyond an explicit narrow allowlist; confirm lab accounts are distinct from every real account; confirm no lab host holds a copy of real data.",
    "Sign and date the authorization — a short, explicit statement of what you authorized and when, kept alongside the lab's own documentation — before any technical activity begins.",
    "Run the exercise within the stated time window, using only the permitted class of activity, and invoke the emergency-stop procedure immediately if the lab behaves unexpectedly (an unplanned network path appears, a host becomes unreachable, anything suggests the isolation boundary isn't holding).",
    "For each finding, write a defensive summary (what happened, what it would look like in monitoring, what control would close the gap) rather than a step-by-step reproduction, and sanitize anything kept afterward — no working exploits, no lab-generated secrets left in place, no unredacted captures.",
    "Translate each finding into a detection question and a remediation question, and don't consider the exercise complete until both have a written answer.",
  ],
  validation: [
    "Confirm the rules-of-engagement document is dated before the exercise's stated start time, not written up to match what happened afterward.",
    "Confirm the lab's isolation directly rather than by assumption: attempt to reach a known-external address or a known-real account from inside the lab segment and confirm it fails except through the explicit allowlisted path, if any.",
    "Confirm every finding produced during the exercise has both a recorded detection answer and a recorded remediation answer before marking the exercise closed.",
    "Confirm no working exploit, real-looking credential, or unredacted capture remains anywhere outside the lab's own controlled storage once write-ups are finalized.",
    "Where isolation or authorization could not be directly verified (for example, a lab hosted on infrastructure you don't fully control), record that limitation explicitly as UNVERIFIED rather than assuming the control holds.",
  ],
  rollback: [
    "If the lab's isolation appears to have failed during an exercise (an unexpected network path, a host reachable from somewhere it shouldn't be), invoke the emergency-stop procedure immediately: disconnect or power down the affected lab segment, stop all exercise activity, and do not resume until the cause is understood and the isolation boundary is re-verified.",
    "If an exercise reveals that a 'lab' system actually shares infrastructure, credentials, or data with something real, treat that as a scope failure, not a finding to write up — stop, do not continue testing that system, and correct the environment before running anything else against it.",
    "If a captured artifact or write-up turns out to contain something that shouldn't leave the lab (a real-looking secret, identifying detail, or a working exploit kept for convenience), treat it as internal-source per the publication-safety policy: sanitize or discard it before it goes anywhere outside the lab's own controlled storage, and do not treat 'it's just a lab' as a reason to skip that step.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Rules of Engagement for an Isolated Lab",
    slug: "rules-of-engagement-for-an-isolated-lab",
    summary:
      "The foundational rules-of-engagement and isolation baseline for authorized offensive-security lab exercises: what written authorization and scope need to cover, what actually makes a lab isolated rather than merely separate, and how to handle findings safely afterward.",
    pillar: "test-validate",
    primaryCategory: "offensive-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["authorized-offensive-testing", "network-isolation", "governance-risk-compliance"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    labRequired: true,
    authorizedLabOnly: true,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "pending" },
    technicalReview: { status: "pending" },
    publicationApproval: { status: "pending" },
  },
  sections,
  module: module_,
};
