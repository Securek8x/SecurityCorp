// Knowledge-base article draft (Bead securitycorp-source-4zl.54.2.8).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. All examples describe a fictional
// pipeline and fictional change-review process; no real pipeline name,
// repository identifier, credential, account name, or production release
// detail appears anywhere in this file.
//
// Scope note: this article is about human approval gates for production
// changes generally — deploys, configuration changes, infrastructure
// changes — authored and executed by people. It deliberately does not cover
// approval gates for actions an AI agent proposes or takes; that is the
// separate, not-yet-drafted topic tracked at Bead securitycorp-source-4zl.33
// ("Designing Human Approval Gates for AI Agents"). This article should not
// be read as covering that ground, and a future author of that article
// should not need to repeat this one's general change-management content.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// `mcp__ruflo__workflow_run` invocation was attempted before drafting
// (workflow id workflow-1788201382492-8tr6wj, template "research", task
// describing this article's research brief needs). A bounded
// `mcp__ruflo__workflow_status` check afterward showed it reproduced the
// documented issue in CLAUDE.md: 0% progress, a pending "Execute" stage, no
// retrievable editorial output. This draft was therefore produced with the
// disclosed native fallback instead — separate research, drafting,
// technical-verification, publication-safety, and editorial passes — not
// credited to Ruflo. See the calling agent's final report for full
// editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "A human approval gate in front of a production change — a deploy, a configuration change, an infrastructure change — is only as good as two things: what the approver actually sees before they click approve, and whether the approver is genuinely someone other than the person who wrote and will run the change. A gate that satisfies neither is not a weaker version of review; it is a latency cost with no review attached, dressed up as a control.",
    "This guide covers what an approver actually needs to make an informed decision, why a gate that is always approved within seconds is itself evidence that it isn't providing real scrutiny, how to enforce separation of duties technically rather than by policy alone, and how to decide which changes genuinely need a human gate versus which can rely on strong automated verification instead. The example pipeline, approvers, and every identifier in it are fictional; no real pipeline, repository, credential, or production system is described.",
  ],
  whatYouWillLearn: [
    "What information an approver actually needs to make an informed decision — an actual diff or plan, a blast-radius summary, and a rollback plan, not a written description composed by the person proposing the change.",
    "Why a gate that is approved within seconds nearly every time, with no rejections, is a signal that it has stopped providing real review — not a sign the process is efficient.",
    "How to enforce separation of duties as a pipeline-level check, not an unenforced expectation that the approver happens to be someone else.",
    "How to decide, deliberately, which changes may skip a human gate because they're backed by strong automated verification, and which — high-blast-radius or hard-to-reverse changes — should never skip it.",
  ],
  intendedAudience: [
    "Developers who submit production changes and want to understand what a meaningful approval step should actually require of them and of their reviewer.",
    "DevOps practitioners responsible for designing or configuring the approval step in a deploy, configuration, or infrastructure pipeline.",
    "Security engineers assessing whether an existing approval gate provides real scrutiny or has quietly become a rubber stamp.",
  ],
  prerequisites: [
    "Basic familiarity with how a production change — a deploy, a configuration change, or an infrastructure change — moves through a pipeline from proposal to execution.",
    "No specific approval-tool or ticketing-system expertise is assumed; this guide describes the pattern generically and uses a fictional example for illustration.",
    "Awareness that 'a human clicked approve' and 'a qualified independent person made an informed decision' are two different claims is useful background, though this guide explains the distinction in depth.",
  ],
  problem: [
    "Approval steps tend to get added to a change process reflexively — 'a human should sign off on this' — without a matching decision about what that human is supposed to be checking, whether they have what they need to check it, and whether they are even a different person from whoever proposed the change. Once the step exists and the pipeline shows a green checkmark next to 'approved,' the step looks like it's working regardless of whether any of that is true.",
    "The gap shows up in a few recognizable, mundane ways: an approver who sees a one-line description ('routine config update') instead of the actual diff or plan; an approver who is, in practice, the same person who wrote the change, wearing an approver hat for a moment because nobody else was available; a rollback plan that exists only in someone's head, discovered for the first time when the change actually needs to be rolled back; and an approval that arrives in under a minute, every time, because clicking approve has become a reflex rather than a decision. None of these produce an error. They produce a pipeline that looks exactly as governed as one with real review, while providing none of it.",
  ],
  threatModel: [
    "Assets: the production environment the change targets, the correctness of the specific change under review, and — distinct from both — the evidentiary value of the approval decision itself: what a recorded 'approved' actually means about whether someone qualified and independent assessed the risk and accepted it.",
    "The central trust decision: everything downstream of an approval gate treats a recorded approval as evidence that a qualified, independent reviewer examined the actual change, understood its blast radius, and accepted the risk. Unless the gate is deliberately built to guarantee that, a recorded approval can be true in form (a click happened, an identity is attached to it) while being false in substance (no one who wasn't already committed to shipping the change ever actually looked at what would change).",
    "Representative threats: self-approval, where the person approving is — through a shared account, a delegated permission, or simply being the only available reviewer — the same identity that authored or will execute the change, removing the independence the gate exists to provide. A rubber-stamp approval, where the approver has the technical ability to approve without ever opening the diff, plan, or blast-radius summary, so the click carries no information about whether the change was actually examined. An approver working from a description instead of the artifact, reviewing the author's account of what the change does rather than the change itself — a description can omit, simplify, or misstate exactly the detail that mattered. A missing or after-the-fact rollback plan, so that even a caught problem has no fast, pre-agreed path back to a known-good state. And an approval-latency pattern that goes unmeasured, so a gate that has quietly become a formality — approved in seconds, every time, with no rejections ever recorded — looks identical, from the outside, to a gate genuinely providing scrutiny on every change.",
    "The interactive diagram accompanying this article shows the difference concretely: in the normal path, an independent approver reviews the actual diff or plan, blast radius, and rollback plan before the change executes. In the failure mode, the same pipeline lets a change execute anyway — either because the 'approver' was the same identity as the author or executor, or because approval was granted without the approver ever opening the actual diff or plan. From outside the pipeline, both cases look identical: a change was proposed, a gate fired, and the change executed. The difference is entirely in what happened — or didn't — at the review step in between.",
  ],
  mainContent: [
    "**Give the approver the actual change, not a description of it.** A written summary of a change is composed by the person proposing it, which means it reflects what that person believes is important, not necessarily what is. An approver reviewing 'routine config update — see ticket' is being asked to trust the author's characterization of their own change, which is precisely the judgment the gate exists to provide a second, independent opinion on. The artifact the approver needs is the actual diff (the specific lines that will change) or the actual plan (for infrastructure-as-code, the specific resources to be created, modified, or destroyed) — generated by the system, not narrated by the author.",
    "**Blast radius and rollback plan are not optional context — they're the two questions an informed 'yes' actually answers.** Blast radius means: which services, environments, and users are affected if this change behaves as intended, and, separately, if it doesn't? Rollback plan means: if this change needs to be undone, what is the specific, already-agreed path back to a known-good state, and how long does it take? An approver who can see the diff but not the blast radius can tell you what changed without being able to tell you what changing it puts at risk. An approver who approves a change with no rollback plan is accepting a risk that, if it materializes, has no pre-agreed answer — the plan gets improvised during the incident instead of reviewed before it.",
    "**An approval gate that is always approved within seconds is a diagnostic finding, not a sign of efficiency.** Genuine review takes variable time: a trivial, well-understood change might reasonably be approved quickly, but a gate where every change — trivial or not, small or sprawling — is approved in roughly the same few seconds, with a rejection rate at or near zero over a long period, is describing a pattern that doesn't look like judgment. It looks like a reflex. This is measurable: track approval latency and approval/rejection rate per gate over time. A gate with no variance and no rejections is worth investigating before it's worth trusting, regardless of how long it's been in place or how confident everyone is that it's 'basically fine.'",
    "**Separation of duties has to be enforced by the pipeline, not merely expected by policy.** 'The approver shouldn't be the same person as the author' is easy to state and easy to quietly violate under time pressure — a small team, an urgent fix, someone with broad access approving their own change because waiting for someone else felt like it would slow things down more than it was worth. A gate that only works when everyone remembers and follows the expectation isn't a control; it's a norm, and norms erode exactly when the pressure to ship is highest, which is also when independent review matters most. The pipeline itself should reject an approval attempt where the approver identity matches the author identity or the identity that will execute the change, the same way an access-control check rejects an unauthorized request — as a structural fact, not a reminder.",
    "**Decide deliberately what genuinely needs a human, instead of defaulting every change to the same gate.** Not every production change carries the same risk, and treating a one-line documentation fix the same as a schema migration touching a payment path either slows the low-risk change for no benefit or, more likely, trains everyone to click through the gate fast regardless of what's actually in front of them — which is exactly how a gate degrades into a rubber stamp. Routine, well-tested, low-blast-radius changes can reasonably skip a human gate when backed by strong automated verification: a comprehensive, passing test suite; a canary or progressive rollout that limits exposure before full release; an automated rollback trigger that reverts on a defined failure signal without waiting for a person to notice. High-blast-radius or hard-to-reverse changes — anything touching authentication, payment processing, data deletion, or infrastructure that many other systems depend on — should not skip a human gate no matter how strong the automated verification looks, because the cost of being wrong is categorically different, not just statistically less likely.",
    "**Classify changes before building the gate, not while reviewing an individual one.** Deciding, in the moment, whether 'this particular change' needs a human is a decision made under exactly the time pressure that erodes good judgment. A better approach classifies change types in advance — by blast radius, reversibility, and the strength of available automated verification — and applies the same rule consistently to every change in that category. This also makes the automated-versus-human boundary auditable: a reviewer can check whether a change was correctly classified, rather than relitigating whether it should have gone through a gate at all.",
    "**Instrument the gate to record what actually happened, not just that approval occurred.** A pipeline that logs 'approved by X at timestamp Y' has recorded that a click occurred; it has not recorded whether X opened the diff, how long they spent, or whether the blast-radius and rollback-plan artifacts even existed at the time of approval. Where the platform supports it, record whether the required artifacts were generated before the approval action was available, and treat 'approved before the diff existed' as a configuration bug to fix, not an edge case to shrug off.",
  ],
  validationEvidence: [
    "This guide describes a design pattern and a fictional illustrative pipeline; it does not reproduce a specific approval-tool configuration, a completed gate-hardening exercise, or captured approval-latency data from a real system. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and then verify against your own change process, not as a validated result.",
  ],
  limitations: [
    "This guide addresses approval gates for production changes proposed and executed by people — deploys, configuration changes, infrastructure changes. It deliberately does not cover approval gates for actions an AI agent proposes or takes, which raise additional questions (what the agent can attempt before approval, how to present an agent-generated diff or plan trustworthily) that a separate, dedicated article should address rather than this one repeating or preempting it.",
    "Exact mechanisms for enforcing separation of duties, generating a diff or plan artifact, and instrumenting approval metadata vary by pipeline platform, ticketing system, and infrastructure-as-code tooling. This guide describes the pattern generically; verify the specific mechanisms your platform supports before relying on any one of them.",
    "This guide does not specify how to design the automated verification (test coverage, canary analysis, rollback triggers) that lets a routine, low-blast-radius change skip a human gate — see 'Designing Security Tests for Failure Conditions' for guidance on building tests that actually exercise failure paths, which is a prerequisite for trusting automated verification to substitute for human review.",
  ],
  defensiveRecommendations: [
    "Give the approver the actual diff or plan the pipeline will apply, not a written description composed by the person proposing the change.",
    "Surface a blast-radius summary and a rollback plan alongside the diff, as required artifacts the approver sees before approving, not documentation produced after the fact.",
    "Enforce separation of duties at the pipeline level — reject an approval attempt where the approver identity matches the author's or the executor's — rather than relying on an unenforced policy expectation.",
    "Track approval latency and rejection rate per gate over time; a gate approved in seconds nearly every time, with no rejections, is a finding to investigate, not evidence of an efficient process.",
    "Classify change types by blast radius and reversibility in advance, and decide deliberately which categories may skip a human gate when backed by strong automated verification, and which must never skip it.",
    "Instrument the gate to record whether the required diff, blast-radius, and rollback artifacts existed and were available before the approval action was taken — not just that an approval event occurred.",
    "Record any control that could not be directly verified as UNVERIFIED rather than assuming a gate behaves as intended because it was configured that way.",
  ],
  keyTakeaways: [
    "A recorded approval and a genuinely independent review are different claims — a click event provides no evidence on its own that the approver saw the actual change or was a different person from its author.",
    "A gate that is always approved within seconds, with no rejections, is a measurable signal that it has stopped providing real scrutiny — not a sign the process is working well.",
    "Separation of duties has to be a pipeline-enforced check, not a norm that depends on everyone remembering to follow it under time pressure.",
    "Not every change needs a human gate — routine, well-tested, low-blast-radius changes can rely on strong automated verification instead, but high-blast-radius or hard-to-reverse changes should never skip independent human review.",
  ],
  references: [
    "NIST SP 800-53 Rev. 5, control CM-3, Configuration Change Control: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "NIST SP 800-53 Rev. 5, control AC-5, Separation of Duties: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "CISA and NSA, Defending Continuous Integration/Continuous Delivery (CI/CD) Environments: https://www.cisa.gov/resources-tools/resources/defending-continuous-integrationcontinuous-delivery-cicd-environments",
    "DORA (DevOps Research and Assessment), change failure rate and lead-time-for-changes research: https://dora.dev/",
  ],
  relatedSlugs: [
    "protecting-main-branch-beyond-pr-approval",
    "least-privilege-for-pipeline-identities",
    "verifying-build-artifacts-before-deployment",
    "designing-security-tests-for-failure-conditions",
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Visibility into what information currently reaches an approver before they click approve on a production change — an actual diff or plan, a blast-radius summary, a rollback plan, or only a written description.",
    "Authority, or a documented path to someone with authority, to change how the approval step is technically implemented: who may be selected as approver, and what must exist or be viewed before the approve action becomes available.",
    "Access to historical approval records (or the ability to start logging them going forward) — approver identity, timestamps, and whether required artifacts existed at approval time — to establish a baseline before changing anything.",
  ],
  procedure: [
    "Identify every point in the deploy, configuration, or infrastructure change pipeline that currently requires a human approval, and for each, list exactly what the approver sees today: the actual diff or plan, a written description, both, or neither.",
    "For each gate, determine whether the approver identity is technically prevented from matching the author's or the executor's identity, or whether that separation is only an unenforced expectation.",
    "Where a gate shows only a written description, wire in the actual diff or plan (the specific lines changing, or the specific resources an infrastructure plan will create, modify, or destroy) as a required artifact the approver must have access to before approving.",
    "Add or surface a blast-radius summary next to the diff: which services, environments, and users are affected, and how reversible the change is.",
    "Require a documented rollback plan as part of the change request, visible to the approver at review time — not written for the first time after a failed change needs to be undone.",
    "Instrument the gate to record what actually happened: whether the diff, plan, blast-radius, and rollback artifacts existed and were available before the approval action, the approver's identity, and how long the review took — not just that an 'approved' event occurred.",
    "Classify change types by blast radius and reversibility, and decide deliberately which categories may skip the human gate when backed by strong automated verification (passing tests, a canary or progressive rollout, an automated rollback trigger), and which — high-blast-radius or hard-to-reverse changes — must never skip it.",
    "Establish a recurring review of approval-latency and rejection-rate metrics per gate; a gate approved in seconds nearly every time, with a near-zero rejection rate, is a signal to investigate rather than a metric to be reassured by.",
  ],
  validation: [
    "Confirm, in a non-production or lab context, that an approval attempt where the approver identity matches the author's or the executor's is technically rejected by the pipeline, not merely discouraged by policy or documentation.",
    "Confirm the approve action is unavailable, or fails, until the required diff or plan artifact exists and has actually been generated — attempt to approve before the artifact is produced and confirm it is blocked.",
    "Review a sample of historical approvals, or newly logged ones, for latency and rejection-rate variance; confirm approval time is not uniformly near-zero across every change regardless of blast radius, which would suggest the gate is not providing differentiated review.",
    "Confirm changes classified as safe to automate through the gate are actually backed by the specific automated verification claimed (passing test results, canary metrics, a configured rollback trigger) at the time they bypass human review, not merely in the classification's original intent.",
    "Where a control could not be tested directly — no safe way to force a rejected self-approval attempt, no historical approval-log access — record that explicitly as UNVERIFIED rather than assuming the gate behaves as intended because it was configured that way.",
  ],
  rollback: [
    "If enforcing separation of duties blocks a legitimate small team where the same people currently author and approve out of necessity, do not quietly disable the check — add a documented, narrow exception process, such as a designated backup approver or a required second reviewer from an adjacent team, rather than reverting to unenforced self-approval.",
    "If requiring a diff or plan artifact before approval blocks a change type where no such artifact is currently generated, add the missing generation step for that change type rather than allowing approval to proceed without it.",
    "Stage the rollout: apply the new gate requirements — enforced separation of duties, a required diff or plan, a blast-radius summary — to a lower-stakes change category first, run it through a full normal cycle, and only then apply the same requirements to the change category where a mistake is most costly.",
    "Keep a record of when each requirement (enforced separation of duties, required diff visibility, blast-radius summary, rollback-plan requirement) became enforced versus when it was merely encouraged, so a later reviewer can tell when the gate actually started providing real scrutiny.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "production-change-approval-gate-diagram",
  title: "Reviewing a fictional production-change approval gate",
  desc: "A proposed production change feeds a stage that generates its actual diff or plan and blast radius, which feeds an independent approver review, which feeds execution. Interactive: switch between the normal flow, where an approver distinct from the author reviews the actual diff or plan, blast radius, and rollback plan before the change executes, and a failure mode showing what happens when the approver is actually the same identity as the author or executor (self-approval), or approves without ever seeing the actual diff or plan (a rubber stamp). Explore each node for details.",
  viewBox: "0 0 900 400",
  failureLabel: "Self-approved / rubber-stamped change",
  caption:
    "Fictional production-change pipeline: change proposed → diff/plan and blast radius generated → independent approver reviews → change executes. In the failure mode, the same pipeline lets a change execute without real scrutiny — because the approver was the same identity as the author or executor, or because approval was granted without the approver ever opening the actual diff or plan. A gate that is always approved within seconds is a sign this step has degenerated into exactly that.",
  motionDuration: 2700,
  mainPacketRoute: {
    d: "M160,190 H190 M390,190 H430 M660,190 H700",
    length: 110,
  },
  edges: [
    { id: "proposed-diff", from: "change-proposed", to: "diff-generated", d: "M160,190 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "diff-approver", from: "diff-generated", to: "approver-reviews", d: "M390,190 H430", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "approver-executes", from: "approver-reviews", to: "change-executes", d: "M660,190 H700", length: 40, kind: "main", activeIn: ["normal"] },
    {
      id: "approver-unreviewed",
      from: "approver-reviews",
      to: "unreviewed-execution",
      d: "M545,240 V300",
      length: 60,
      kind: "failure",
      activeIn: ["failure"],
    },
  ],
  nodes: [
    {
      id: "change-proposed",
      label: "Change proposed",
      x: 10,
      y: 155,
      w: 150,
      h: 70,
      activeIn: ["normal", "failure"],
      description:
        "A developer, DevOps practitioner, or automated system proposes a production change: a deploy, a configuration change, or an infrastructure change. What happens between this proposal and the change actually executing is what decides whether the approval gate ahead provides real scrutiny or just adds latency.",
    },
    {
      id: "diff-generated",
      label: "Diff/plan and blast radius generated",
      x: 190,
      y: 145,
      w: 200,
      h: 90,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel:
        "Diff and plan generated — produces the actual artifact the approver needs, not a description written by the person proposing the change",
      description:
        "Generates the actual diff or plan the approver will see — the specific lines or resources that will change — together with a blast-radius summary (what services, environments, and users are affected) and a rollback plan. An approver who reviews a summary written by the change's own author instead of this artifact is reviewing the author's account of the change, not the change itself.",
    },
    {
      id: "approver-reviews",
      label: "Independent approver reviews",
      x: 430,
      y: 140,
      w: 230,
      h: 100,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel:
        "Independent approver reviews — the highest-value node in this diagram: whether the approver is a genuinely separate identity, and whether they actually open the diff or plan, decides which path the change takes",
      description:
        "The approver examines the diff or plan, the blast radius, and the rollback plan, and decides whether the change may proceed. This step only provides real scrutiny when two things are both true: the approver is a different identity from whoever authored and will execute the change, and the approver actually opens and reads the diff or plan rather than approving a notification. A gate that is always approved within seconds, every time, is itself a sign that this step isn't providing meaningful review — either every change really is trivial, which is unlikely, or nobody is reading them.",
    },
    {
      id: "change-executes",
      label: "Change executes",
      x: 700,
      y: 155,
      w: 160,
      h: 70,
      role: "safe",
      activeIn: ["normal"],
      description:
        "The change proceeds because an independent approver reviewed the actual diff or plan, blast radius, and rollback plan, and explicitly accepted the risk. Approval here reflects a real decision, not a formality the pipeline happened to require.",
    },
    {
      id: "unreviewed-execution",
      label: "Unreviewed change executes",
      x: 430,
      y: 300,
      w: 280,
      h: 70,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel:
        "Unreviewed change executes — reachable only when the approver was the same identity as the author or executor, or approved without seeing the actual diff or plan; visible only in failure mode",
      description:
        "Failure-mode only: the change executes without having received real scrutiny — either because the 'approver' was the same identity as the author or the one who will execute the change (self-approval), or because approval was granted without ever opening the actual diff or plan (a rubber stamp). From outside the pipeline, this looks identical to a properly approved change — a gate fired, a click was recorded — but no independent judgment was actually applied before the change went out.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Designing Human Approval Gates for Production Changes",
    slug: "designing-human-approval-gates-for-production-changes",
    summary:
      "How to design a human-approval gate for a production change — a deploy, a configuration change, an infrastructure change — that provides a meaningful check instead of a rubber-stamp click: what an approver actually needs to see, why instant unanimous approval is a red flag, separation of duties, and what can safely skip a human gate.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["ci-cd-pipelines", "governance-risk-compliance", "access-control"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-08-31",
    lastReviewedAt: "2026-08-31",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-31" },
  },
  sections,
  module: module_,
  diagram,
};
