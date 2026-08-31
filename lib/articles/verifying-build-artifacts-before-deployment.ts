// Knowledge-base article draft (Bead securitycorp-source-4zl.54.2.5).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. All examples describe a fictional
// pipeline; no real pipeline name, repository identifier, credential,
// account name, or production release detail appears anywhere in this file.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// `mcp__ruflo__workflow_run` invocation was attempted before drafting
// (workflow id workflow-1788172682542-cenqio, template "research"). It
// reproduced the documented issue in CLAUDE.md: it remained at 0% progress
// with a pending "Execute" stage on a bounded status check and returned no
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
    "A pipeline that finishes a deploy step without error tells you the deploy mechanism worked — it tells you nothing about whether the bytes it just shipped are the bytes the build stage produced from reviewed source. Those are different claims, and most pipelines only ever demonstrate the first one. Assuming the second because the first held is exactly the gap that lets a tampered or substituted artifact reach production unnoticed.",
    "This guide covers the three complementary signals that close that gap — checksums, cryptographic signatures, and build provenance/attestation — what each one can and cannot prove on its own, and how to wire a verification gate into a pipeline so that a deploy step refuses to run against an artifact that doesn't pass. The example pipeline and every identifier in it are fictional; no real pipeline, repository, credential, or production system is described.",
  ],
  whatYouWillLearn: [
    "Why a successful deploy is not evidence of artifact integrity, and what specific claim each verification signal actually supports.",
    "The difference between a checksum, a cryptographic signature, and build provenance/attestation — and why relying on only one leaves a specific, exploitable gap.",
    "How to wire an artifact-verification gate into a pipeline so a deploy step fails closed against an artifact that doesn't pass, instead of deploying first and discovering a mismatch later.",
    "Common failure patterns: a checksum published by the same process that could be compromised, a signature that is present but never actually checked, and provenance that describes a build without binding it to the specific artifact being deployed.",
  ],
  intendedAudience: [
    "Developers who want to understand what happens — and what doesn't get checked — between a build finishing and a deploy step running against its output.",
    "DevOps practitioners responsible for configuring deploy steps, artifact stores, and the gates that sit between them.",
    "Security engineers assessing whether a pipeline's deploy step actually verifies the artifact it's about to ship, or merely assumes it because the deploy mechanism works.",
  ],
  prerequisites: [
    "Basic familiarity with how a CI/CD pipeline moves an artifact from a build stage to a target environment.",
    "No specific signing-tool or artifact-registry expertise is assumed; this guide describes the pattern generically and uses a fictional example for illustration.",
    "Awareness that 'the pipeline succeeded' and 'the artifact is trustworthy' are two separate claims is useful background, though this guide explains the distinction in depth.",
  ],
  problem: [
    "Once a pipeline is working, the deploy step's exit code becomes the de facto signal that everything upstream of it was fine. That's a comfortable assumption, because a failed deploy is loud and a successful one is quiet — but the deploy mechanism only checks that it could push bytes to a target and that the target accepted them. It has no opinion about whether those bytes are the ones the build stage produced from the exact source commit that was reviewed and approved.",
    "The gap between those two claims is where a tampered or substituted artifact lives. An artifact store that anyone with write access can overwrite, a deploy step that pulls 'latest' without checking what 'latest' actually is, or a build that gets triggered a second time from an unreviewed branch and silently replaces the approved output — none of these produce an error. They produce a deploy that looks exactly like every other deploy, shipping something that was never actually reviewed.",
  ],
  threatModel: [
    "Assets: the build artifact itself, the metadata that is supposed to bind it to a specific reviewed source commit and build run, and the deploy step's decision about whether to trust that binding before it acts on it.",
    "The central trust decision: a deploy step is about to apply an artifact to a target environment, and — unless it deliberately verifies otherwise — it assumes the artifact sitting in the expected location is the one the build stage produced from the reviewed change, rather than confirming that assumption against independent evidence.",
    "Representative threats: an artifact store with broad write access lets anyone who can reach it overwrite a build's output after the fact, with no record that a substitution occurred. A checksum published alongside the artifact by the same build process an attacker has already compromised verifies nothing — it will happily match whatever the attacker also placed there. A signature that exists but that the deploy step never actually checks provides no more protection than no signature at all; its presence in a file next to the artifact is not the same as its verification being a required, enforced step. Provenance or attestation data that describes how something was built, without being cryptographically bound to the specific artifact hash being deployed, can be satisfied by attaching a legitimate-looking build record to an illegitimate artifact.",
    "The interactive diagram accompanying this article shows the difference concretely: an artifact that passes a verification gate checking all three signals — checksum, signature, and provenance — together reaches its target environment, while the same gate checking only one of the three, or configured to pass through when a check is unavailable, lets a tampered artifact reach production. What decides which case is true is not the deploy step's success — it's whether verification was complete and enforced before that step ran.",
  ],
  mainContent: [
    "**A checksum proves the bytes weren't altered in transit or at rest since the checksum was computed — nothing more.** A cryptographic hash (SHA-256 or stronger) computed over an artifact and compared against a recorded value confirms that the artifact matches that recorded value bit-for-bit. What it cannot tell you is whether the recorded value itself is trustworthy. A checksum file sitting next to the artifact in the same storage location, generated by the same build process that produced the artifact, protects against accidental corruption — it does nothing against an attacker who can replace both the artifact and its checksum file together, because there is no independent source the two are checked against.",
    "**A signature proves who (or what identity) vouches for the artifact, if the signature is actually checked and the signing key is itself trustworthy.** Signing an artifact with a private key, and verifying that signature against the corresponding public key before deploy, answers a different question than a checksum does: not 'did the bytes change' but 'did an identity I've decided to trust vouch for these specific bytes.' This only holds if two things are both true: the signing key is protected well enough that only the legitimate build process can use it, and the deploy step actually performs verification and fails closed when it doesn't pass — a signature that exists in storage but that nothing in the pipeline is configured to check is a signature that provides no protection in practice, whatever protection it might provide in theory.",
    "**Provenance and attestation answer a third, different question: not 'is this artifact intact' or 'who vouches for it,' but 'what process, from what source, actually produced it.'** A provenance record (in the SLSA sense — a structured, ideally signed statement about a build) can capture the source repository and commit, the build system that ran, the build parameters, and the resulting artifact's hash, all bound together. This is the signal that most directly answers the question this guide opens with: is the artifact about to be deployed actually the one the pipeline built from the reviewed source, not a separately built copy that happens to have the same name or even the same checksum as a legitimate build's output through coincidence or manipulation.",
    "**Each signal alone leaves a specific, exploitable gap; together they cover each other's blind spots.** A checksum alone can't distinguish a legitimate rebuild from a malicious substitution if the attacker controls both the artifact and its checksum record. A signature alone protects the identity claim but says nothing about which source commit was actually built, unless the signed data includes that binding. Provenance alone, without a signature over it, is just a claim anyone could attach to any artifact — it needs cryptographic binding to be evidence rather than metadata. Verifying all three closes each individual gap: the checksum confirms bit-for-bit integrity of a specific artifact, the signature confirms a trusted identity produced that exact artifact, and the provenance confirms which source and build process that identity used to produce it.",
    "**A verification gate has to run before the deploy step acts, and it has to fail closed.** The practical difference between a control that helps and a control that only looks like it helps is enforcement: a checksum comparison, signature check, and provenance check that a pipeline can skip, that a deploy step doesn't wait on, or that only logs a warning on mismatch instead of stopping the deploy, provides audit trail at best and no actual protection. The gate needs to be a required step the deploy step depends on, configured to halt the pipeline — not merely flag an issue — when any one of the three checks fails or cannot be completed.",
    "**Where the deploy target is, matters as much as what gets checked.** Verifying an artifact once, early in the pipeline, and then trusting the artifact store unconditionally for every later stage reintroduces the same gap the verification was meant to close — anything with write access to that store between the check and the actual deploy can still substitute what gets shipped. Either verify immediately before the deploy action itself, or make the artifact store append-only and cryptographically reference the exact verified artifact (by hash, not by a mutable name like 'latest') through every stage between verification and deploy.",
    "**Watch for verification that exists on paper but isn't actually enforced.** A pipeline can accumulate all three mechanisms — a checksum step, a signing step, a provenance-generation step — and still ship a tampered artifact, if the deploy step doesn't structurally depend on all three passing. A verification step that runs in parallel with the deploy step, rather than as a hard prerequisite to it, is a documentation exercise, not a control; the same is true of a verification step whose failure is logged but doesn't stop the pipeline from continuing.",
  ],
  validationEvidence: [
    "This guide describes a verification pattern and a fictional illustrative pipeline; it does not reproduce a specific signing-tool configuration, a completed provenance-verification exercise, or a captured incident. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and then verify against your own pipeline's artifact and deploy configuration, not as a validated result.",
  ],
  limitations: [
    "This guide addresses verifying that the artifact reaching deployment matches what the pipeline built from reviewed source. It does not cover source-code review practices, dependency trust (see 'Dependency Confusion and Package-Name Trust'), the build runner's own execution-environment risk (see 'Why Build Runners Should Be Treated as Untrusted'), or the pipeline identity's own permission scope (see 'Least Privilege for Pipeline Identities') — those are related, adjacent controls this guide deliberately does not repeat.",
    "Exact mechanisms for computing and verifying checksums, generating and checking signatures, and producing and verifying provenance/attestation data vary by ecosystem, artifact type, and whether infrastructure is hosted or self-managed. This guide describes the pattern generically; verify the specific mechanisms your platform and artifact type support before relying on any one of them.",
    "Verification protects the deploy step's decision about what it ships. It does not protect against a compromise upstream of verification — a build stage that is itself compromised will produce an artifact, checksum, signature, and provenance record that all correctly describe a malicious build, because everything was generated by the compromised process working as designed. Verification confirms consistency and origin; it is not a substitute for securing the build stage itself.",
  ],
  defensiveRecommendations: [
    "Require all three signals — checksum, signature, and provenance/attestation — before a deploy step acts on an artifact; each one closes a gap the others leave open.",
    "Generate and check signatures and checksums independently of the artifact's own storage location, so an attacker who can overwrite the artifact cannot also overwrite the record used to verify it.",
    "Bind provenance data to the specific artifact hash being deployed, not just to a build run in general, so a legitimate-looking build record can't be attached to a different, illegitimate artifact.",
    "Make the verification gate a hard prerequisite the deploy step structurally depends on, configured to halt the pipeline on any failed or incomplete check — not a parallel step whose failure is only logged.",
    "Reference artifacts by hash, not by a mutable name, through every stage between verification and the actual deploy action, so nothing between the check and the deploy can substitute what gets shipped.",
    "Protect signing keys with access scoped to the legitimate build process only, and treat a compromised signing key as a build-stage compromise, not an artifact-verification failure.",
    "Record any control that could not be directly verified as UNVERIFIED rather than assuming a checksum, signature, or provenance check behaves as intended because it exists somewhere in the pipeline definition.",
  ],
  keyTakeaways: [
    "A successful deploy step and a trustworthy artifact are different claims — a working deploy provides no evidence that the artifact it shipped is the one the pipeline built from reviewed source.",
    "Checksums, signatures, and provenance/attestation each answer a different question — bit-for-bit integrity, trusted identity, and build origin — and each leaves a gap the others close.",
    "A verification signal that exists but isn't a required, enforced prerequisite to the deploy step provides an audit trail at best, not protection.",
    "Verification confirms consistency and origin; it cannot detect a compromise that occurred inside the build stage itself, before the artifact, checksum, signature, and provenance were generated.",
  ],
  references: [
    "NIST SP 800-218, Secure Software Development Framework (SSDF): https://csrc.nist.gov/pubs/sp/800/218/final",
    "SLSA (Supply-chain Levels for Software Artifacts) specification, build provenance requirements: https://slsa.dev/spec/v1.0/provenance",
    "in-toto framework, for cryptographically linking build steps and attestations to a supply chain: https://in-toto.io/",
    "CISA and NSA, Defending Continuous Integration/Continuous Delivery (CI/CD) Environments: https://www.cisa.gov/resources-tools/resources/defending-continuous-integrationcontinuous-delivery-cicd-environments",
    "NIST SP 800-53 Rev. 5, control SI-7, Software, Firmware, and Information Integrity: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
  ],
  relatedSlugs: ["least-privilege-for-pipeline-identities", "build-runners-untrusted", "sboms-what-they-solve", "dependency-confusion-package-trust"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Visibility into the exact steps between a build finishing and a deploy step acting on its output — what generates the artifact, what (if anything) generates a checksum, signature, or provenance record, and what the deploy step actually checks before it runs.",
    "Access to configure a signing mechanism and the corresponding verification step for the artifact type in use, and authority to make that verification a required prerequisite in the pipeline definition.",
    "A staged environment or a safe rollout path to test a new or hardened verification gate before it is the only gate in place — a gate that incorrectly rejects a legitimate artifact in production, with no fallback, is how a legitimate deploy gets broken.",
  ],
  procedure: [
    "Map the current path from build output to deploy target for the pipeline under review: where the artifact is stored, what (if anything) currently checks it before the deploy step runs, and whether that check is a required prerequisite or an optional, unenforced step.",
    "For each of the three signals — checksum, signature, provenance/attestation — determine whether it is currently generated at all, and if so, whether it is generated and stored independently of the artifact's own location (so an attacker who can overwrite the artifact can't also overwrite what verifies it).",
    "Where a signal is missing, add it: compute and record a checksum at build time, sign the artifact (or its checksum) with a key scoped to the legitimate build process, and generate a provenance/attestation record binding the source commit, build system, and resulting artifact hash together.",
    "Wire a verification gate into the pipeline that checks all three signals and runs as a required prerequisite the deploy step depends on — not a parallel or advisory step — configured to halt the pipeline rather than merely log a warning when any check fails or cannot be completed.",
    "Reference the artifact by its verified hash, not a mutable name, from the point of verification through the actual deploy action, so nothing between the two steps can substitute what gets shipped.",
    "Protect the signing key and provenance-generation process with access scoped to the legitimate build stage only, and document that a compromise of either is a build-stage security incident, not merely an artifact-verification gap.",
    "Record which of the three signals are enforced versus which remain aspirational or partially wired, rather than treating 'a checksum step exists somewhere in the pipeline' as evidence the deploy step is actually protected.",
  ],
  validation: [
    "Confirm that deploying a deliberately altered artifact (in a non-production or lab context) — one whose bytes, signature, or provenance record has been changed — causes the pipeline to halt before the deploy step runs, rather than deploying anyway with a logged warning.",
    "Confirm the verification gate fails closed when a required signal is unavailable (the signature can't be checked, the provenance record is missing) rather than passing through and allowing the deploy to proceed.",
    "Confirm the artifact reference used by the deploy step is the exact hash that passed verification, not a mutable name that could resolve to a different artifact by the time the deploy step actually runs.",
    "Confirm signing keys and provenance-generation credentials are not reachable by anything outside the legitimate build stage, using the same access-review approach as any other pipeline credential.",
    "Where a control could not be tested directly (no safe way to force a verification failure, no non-production environment available), record that explicitly as UNVERIFIED rather than assuming the gate behaves as intended because it was configured that way.",
  ],
  rollback: [
    "If a new verification gate blocks a legitimate deploy the mapping step missed, do not disable the gate as the fix — diagnose which signal failed and why (a missing provenance step for one artifact type, a signing key not yet provisioned for one build path) and add the specific missing piece, so the fix closes the actual gap rather than reopening the whole control.",
    "Stage the rollout: enable the verification gate in a non-production environment first, run a full normal deploy cycle including any less common paths (a rollback deploy, a hotfix build), and only then make the gate a hard prerequisite for the environment a mistake would actually be costly in.",
    "Keep a record of when each signal (checksum, signature, provenance) became enforced versus when it merely started being generated, so a later reviewer can tell 'this was verified from this date forward' apart from 'a checksum has always existed here but nothing checked it until now.'",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "artifact-verification-diagram",
  title: "Verifying a fictional pipeline's artifact before deploy",
  desc: "A reviewed source change feeds a build stage, which produces an artifact, which passes through a verification gate before reaching a target environment. Interactive: switch between the normal flow, where the gate checks all three signals — checksum, signature, and provenance — before the deploy proceeds, and a failure mode showing what happens when the gate only checks one signal or is configured to pass through on an incomplete check, letting a tampered artifact reach the target environment. Explore each node for details.",
  viewBox: "0 0 1060 400",
  failureLabel: "Unverified deploy",
  caption:
    "Fictional pipeline: reviewed source → build stage → build artifact → verification gate → target environment. In the normal path, the gate confirms checksum, signature, and provenance together before the deploy proceeds. In the failure mode, the same gate checks only one of the three signals (or is configured to pass through when a check is unavailable), so a tampered or substituted artifact still reaches the target environment. A successful deploy in either case looks the same from the outside — the difference is entirely in what the gate verified beforehand.",
  motionDuration: 2800,
  mainPacketRoute: {
    d: "M150,190 H180 M340,190 H380 M550,190 H590 M810,190 H860",
    length: 160,
  },
  edges: [
    { id: "source-build", from: "source", to: "build-stage", d: "M150,190 H180", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "build-artifact", from: "build-stage", to: "artifact-store", d: "M340,190 H380", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "artifact-gate", from: "artifact-store", to: "verification-gate", d: "M550,190 H590", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "gate-target", from: "verification-gate", to: "target-environment", d: "M810,190 H860", length: 50, kind: "main", activeIn: ["normal"] },
    { id: "gate-tampered", from: "verification-gate", to: "tampered-deploy", d: "M700,240 V300", length: 60, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "source",
      label: "Reviewed source change",
      x: 10,
      y: 160,
      w: 140,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "A change that has gone through review and is approved to become a deploy. What eventually gets deployed should be traceable back to this exact commit — that traceability is what the rest of this diagram either preserves or loses.",
    },
    {
      id: "build-stage",
      label: "Build stage",
      x: 180,
      y: 150,
      w: 160,
      h: 80,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Build stage — produces the artifact and, where configured, its checksum, signature, and provenance record",
      description:
        "Compiles the reviewed change into a deployable artifact. This is also where the checksum, signature, and provenance record should be generated — as close to the moment of build as possible, so there's no window between 'artifact exists' and 'artifact is documented' for a substitution to occur unnoticed.",
    },
    {
      id: "artifact-store",
      label: "Build artifact",
      x: 380,
      y: 150,
      w: 170,
      h: 80,
      activeIn: ["normal", "failure"],
      description:
        "The build's output, held wherever the pipeline stores artifacts pending deploy. Anything with write access to this location between build and deploy can potentially substitute what's here — which is exactly why verification has to check the artifact itself immediately before deploy, not rely on whatever was true when it was first produced.",
    },
    {
      id: "verification-gate",
      label: "Verification gate",
      x: 590,
      y: 140,
      w: 220,
      h: 100,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Verification gate — the highest-value node in this diagram: what it actually checks, and whether the deploy step depends on it, decides which path the artifact takes",
      description:
        "Checks the artifact against its checksum, signature, and provenance record before the deploy step is allowed to run. In the normal path, all three checks pass and the gate is a hard prerequisite the deploy step depends on. In the failure path, the same gate checks only one of the three signals — or is configured to log a failure instead of halting the pipeline — so a tampered artifact still passes through to deploy.",
    },
    {
      id: "target-environment",
      label: "Target environment",
      x: 860,
      y: 155,
      w: 150,
      h: 70,
      role: "safe",
      activeIn: ["normal"],
      description:
        "Receives the artifact only after it passed every check the verification gate enforces. In the normal path, what reaches this environment is provably the artifact the build stage produced from the reviewed source commit — not merely something that happened to deploy successfully.",
    },
    {
      id: "tampered-deploy",
      label: "Tampered artifact deployed",
      x: 590,
      y: 300,
      w: 220,
      h: 70,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Tampered artifact deployed — reachable only when the gate's checks are incomplete or unenforced, visible only in failure mode",
      description:
        "Failure-mode only: a tampered or substituted artifact reaches the target environment because the gate it passed through didn't actually verify all three signals, or because a failed check was logged rather than treated as a hard stop. From outside the pipeline, this deploy looks identical to a legitimate one — the deploy mechanism itself has no way to tell the difference; only complete, enforced verification beforehand does.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Verifying Build Artifacts Before Deployment",
    slug: "verifying-build-artifacts-before-deployment",
    summary:
      "Why a successful deploy step is not evidence that the artifact it shipped is the one your pipeline built from reviewed source, and how to verify that with checksums, cryptographic signatures, and build provenance/attestation before a deploy step is allowed to run.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["supply-chain-security", "ci-cd-pipelines", "security-control-validation"],
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
