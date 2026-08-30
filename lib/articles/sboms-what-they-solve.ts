// Knowledge-base article draft (Bead securitycorp-source-4zl.54.2.6).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// `mcp__ruflo__workflow_run` invocation was attempted before drafting
// (workflow id workflow-1788087097100-jmomnq, template "research"). It
// reproduced the documented issue in CLAUDE.md: it remained at 0% progress
// with a pending "Execute" stage across two bounded status checks, roughly
// 20 seconds apart, and returned no retrievable editorial output. This
// draft was therefore produced with the disclosed native fallback instead
// — separate research/fact-grounding, drafting, technical-verification,
// publication-safety, and editorial passes — not credited to Ruflo. See the
// calling agent's final report for full editorial-routing evidence.
//
// Differentiation from the other two CI/CD-adjacent articles already
// drafted in this category: lib/articles/dependency-confusion-package-trust.ts
// is about registry-resolution trust — which source a package manager picks
// when more than one registry could answer for the same name. lib/articles/
// build-runners-untrusted.ts is about the build runner's own blast radius —
// what a compromised runner could reach. Neither covers what an SBOM
// actually is or what it does and does not prove once an artifact ships.
// This article is specifically about that: an SBOM's real, narrow value
// (fast vulnerability-impact assessment against a known component
// inventory) versus four things it structurally cannot do — prove the
// software is safe, verify build integrity, stop a malicious dependency
// from being included in the first place, or be more accurate than its own
// generation process allows.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const diagram: FlowDiagramSpec = {
  titleId: "sbom-coverage-diagram",
  title: "What an SBOM captures versus what it can miss",
  desc: "Declared source dependencies feed a build process, which feeds SBOM generation, which produces a shipped artifact together with its SBOM. Interactive: switch between the normal path, where SBOM generation accurately records everything the build process actually used, and a failure mode showing a dependency fetched dynamically at runtime — after the build finished — that never passes through SBOM generation at all, producing a coverage gap between what the SBOM says is present and what is actually running. Explore each node for details.",
  viewBox: "0 0 900 320",
  failureLabel: "Coverage gap",
  caption:
    "Fictional build: declared source dependencies → build process → SBOM generation → shipped artifact. In the failure mode, a dependency fetched dynamically at runtime bypasses the build process and SBOM generation entirely, so it ends up running inside the shipped artifact without ever appearing in that artifact's own SBOM.",
  motionDuration: 2600,
  mainPacketRoute: { d: "M160,90 H190 M360,90 H390 M560,90 H590", length: 90 },
  edges: [
    { id: "deps-build", from: "sourceDeps", to: "buildProcess", d: "M160,90 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "build-sbom", from: "buildProcess", to: "sbomGeneration", d: "M360,90 H390", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "sbom-artifact", from: "sbomGeneration", to: "shippedArtifact", d: "M560,90 H590", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "sbom-gap", from: "sbomGeneration", to: "coverageGap", d: "M475,125 V210", length: 85, kind: "failure", activeIn: ["failure"] },
    { id: "runtime-artifact", from: "runtimeFetch", to: "shippedArtifact", d: "M675,210 V120", length: 90, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "sourceDeps",
      label: "Declared source dependencies",
      x: 10,
      y: 60,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "The dependencies a project explicitly declares — package manifest entries, lockfile pins — that a build process is expected to resolve and install. This is the starting inventory most SBOM generation tools are built to walk.",
    },
    {
      id: "buildProcess",
      label: "Build process",
      x: 190,
      y: 55,
      w: 170,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Build process — resolves and installs declared dependencies; only what passes through here is visible to a build-time SBOM generator",
      description:
        "Resolves, installs, and compiles the declared dependency set. A build-time SBOM generator can only ever describe what actually passed through this step — anything a running application later fetches on its own, after the build has already finished, never touches this process and is invisible to it by construction.",
    },
    {
      id: "sbomGeneration",
      label: "SBOM generation",
      x: 390,
      y: 55,
      w: 170,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "SBOM generation — records what the build process actually used; its accuracy is bounded entirely by what this step is able to observe",
      description:
        "Produces a structured, machine-readable inventory of what the build process used — typically in a standard format such as SPDX or CycloneDX. This step records; it does not decide what was allowed to be installed and it does not evaluate whether any listed component is actually safe. Its output is only as complete as whatever it was able to observe.",
    },
    {
      id: "shippedArtifact",
      label: "Shipped artifact + SBOM",
      x: 590,
      y: 60,
      w: 190,
      h: 60,
      role: "safe",
      activeIn: ["normal", "failure"],
      description:
        "The artifact that actually ships, packaged with its SBOM. In the normal path, the SBOM's inventory and the artifact's real contents match. In the failure path, this node is where the mismatch becomes concrete: the artifact ends up running a component its own accompanying SBOM never mentions.",
    },
    {
      id: "coverageGap",
      label: "Coverage gap: absent from SBOM",
      x: 390,
      y: 210,
      w: 170,
      h: 70,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Coverage gap — the SBOM generation step had no way to observe a dependency the build process never touched",
      description:
        "Failure-mode only: SBOM generation can only record what passed through the build process it observed. It has no mechanism to notice a dependency that was never part of that build — the gap isn't a bug in the generator, it's the direct consequence of generating an SBOM from build-time observation while a component enters the system through a different path entirely.",
    },
    {
      id: "runtimeFetch",
      label: "Runtime-fetched dependency",
      x: 590,
      y: 210,
      w: 190,
      h: 70,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Runtime-fetched dependency — a component pulled in by the running application after the build finished, outside the SBOM's field of view",
      description:
        "Failure-mode only: a fictional example of a component the deployed application fetches on its own after startup — a plugin pulled from a registry on demand, a module loaded dynamically based on runtime configuration — rather than one installed during the build. It runs inside the shipped artifact exactly like a build-time dependency would, but it was never present for SBOM generation to record.",
    },
  ],
};

const sections: UniversalSections = {
  executiveSummary: [
    "A Software Bill of Materials (SBOM) is a structured, machine-readable inventory of the components that went into building a piece of software — typically expressed in a standard format such as SPDX or CycloneDX, listing components alongside identifying metadata like name, version, supplier, and how components relate to one another. Its proven, concrete value is speed: when a new vulnerability is disclosed in a widely used library, an organization with accurate SBOMs across its shipped software can answer 'which of our artifacts include this component' in minutes by querying existing data, instead of manually tracing dependency trees across every repository and pipeline it owns.",
    "This guide is about the gap between that real value and the much broader assurance an SBOM is often assumed to provide. An SBOM is an inventory, not a verdict. It does not prove the software is safe, does not verify that the artifact was actually built the way its records claim, does not stop a malicious dependency from being included in the first place, and is only ever as accurate as the process that generated it. None of that makes an SBOM useless — it makes it a specific, bounded tool that answers one class of question well and several adjacent questions not at all.",
  ],
  whatYouWillLearn: [
    "What an SBOM actually is — a structured component inventory in a standard format — and the specific operational problem it solves well: fast, accurate vulnerability-impact assessment when a new CVE is disclosed.",
    "Why an SBOM is fundamentally a list, not a verdict: it says nothing on its own about whether a listed component is well-written, correctly configured, or free of undisclosed vulnerabilities.",
    "Why an SBOM does not verify build integrity, and how that question is a separate concern from component inventory — addressed by build-provenance practices, not by the SBOM itself.",
    "Why an SBOM cannot stop a malicious or dependency-confused package from being included in the first place — it is a downstream record of what happened, not an upstream gate deciding what is allowed to happen.",
    "Why an SBOM's accuracy is entirely bounded by its generation method, and where the common coverage gaps actually come from — dynamically fetched or runtime-loaded components chief among them.",
    "A repeatable way to evaluate whether an SBOM practice is producing something a team can actually rely on during an incident, versus producing paperwork that looks complete without being tested.",
  ],
  intendedAudience: [
    "Developers who ship software and are being asked to produce an SBOM, without necessarily having a clear model of what question it does and doesn't answer.",
    "DevOps practitioners standing up SBOM generation inside a build pipeline and deciding how it should actually work.",
    "Security engineers who receive SBOMs — from an internal team or a vendor — and need to know how much evidentiary weight that document actually carries.",
  ],
  prerequisites: [
    "Basic familiarity with how a project declares dependencies (a package manifest, a lockfile) and how a build process installs them.",
    "No lab environment is required — every example in this guide is fictional and descriptive, not a runnable exercise.",
    "No prior exposure to SPDX, CycloneDX, or SLSA is assumed; this guide introduces each one at the level needed to understand the distinctions it draws.",
  ],
  problem: [
    "SBOM adoption has often been driven from the outside in — a customer questionnaire, a contract clause, a procurement requirement — rather than from a team's own decision about what problem it needed solved. That ordering matters, because it creates pressure to treat 'we can produce an SBOM' as equivalent to 'we manage our software supply-chain risk,' when those are different claims with very different levels of assurance behind them. A team can generate a technically well-formed SBOM for every release and still have no better answer than before to questions like 'was this artifact built the way we think it was' or 'did anything malicious slip into this dependency tree before the SBOM was generated.'",
    "The actual, well-supported value of an SBOM shows up at a specific moment: the day a serious vulnerability is disclosed in a component used somewhere across an organization's software. Without an SBOM, answering 'are we affected, and where' means manually inspecting manifests, lockfiles, or installed packages across every repository and build pipeline the organization maintains — slow, error-prone, and easy to get wrong under the time pressure a live disclosure creates. An accurate SBOM turns that into a query. That is a real, specific, and valuable capability. It is also a narrower capability than 'supply-chain security,' and confusing the two is where an SBOM's assurance tends to get overstated.",
  ],
  threatModel: [
    "Frame this less as attacker-versus-defender and more as: what does having an SBOM actually change, and what stays exactly as risky as before. What it changes is response time and completeness during vulnerability-impact assessment — the specific scenario above. What it does not change, on its own: whether a component already included in the dependency tree is malicious or compromised (the SBOM will simply, correctly, list it); whether the build process that produced the artifact was itself trustworthy and free of tampering (a separate question — see 'validation, not observation' in the main content below); and whether every component that ends up running inside the shipped artifact was actually captured by the generation process in the first place.",
    "That last point is the specific failure mode this guide's diagram illustrates: a component that a deployed application fetches on its own, at startup or during operation, rather than one installed during the build. Because SBOM generation commonly works by observing what a build process resolved and installed, a component that enters the system through a different path — a plugin pulled at runtime, a module loaded dynamically based on configuration — was never present for the generator to see. The resulting SBOM isn't wrong about what it lists; it is silently incomplete about what actually ships and runs.",
    "A second, related gap runs in the opposite direction: build-time-only tooling — a compiler plugin, a code generator, a test-only library — that never ships as part of the running artifact but does execute during the build with whatever access the build process has. Whether that tooling belongs in a 'what we ship' SBOM is a scope question the generation process has to answer deliberately; treated carelessly, it produces either an SBOM that omits a real execution-time risk (the tool itself has a vulnerability, but nobody tracks it because it 'isn't shipped') or one so broad it buries the components that actually matter to a downstream consumer.",
  ],
  mainContent: [
    "**An SBOM is a format-level answer to 'what's in here,' not a security judgment.** The two dominant machine-readable SBOM formats are SPDX, an open standard maintained by the Linux Foundation and published as ISO/IEC 5962:2021, and CycloneDX, an OWASP project now also published as the Ecma International standard ECMA-424. Both represent a software artifact as a structured list of components together with identifying metadata — name, version, supplier, and the relationships between components — and both are designed to be produced and consumed by tooling rather than read as prose. Neither format, by itself, expresses a judgment about whether any listed component is safe to use. That distinction matters more than it sounds: a perfectly well-formed, standards-compliant SBOM can faithfully describe a dependency tree that includes a component with a known, unpatched, critical vulnerability, and the SBOM will have done exactly what it's for by listing it accurately.",
    "**The real, provable value is speed during vulnerability-impact assessment.** When a widely used library discloses a new vulnerability, the operational question every affected organization faces is the same: which of our shipped artifacts include this component, at which version, and where. Without SBOM data, answering that requires manually inspecting manifests, lockfiles, or installed packages across however many repositories and pipelines the organization maintains — a process that scales badly and is easy to get wrong under time pressure. With accurate SBOM data collected across an organization's software, that same question becomes a lookup against existing records. This is the concrete, well-supported capability an SBOM provides — not a general promise about supply-chain risk being 'handled.'",
    "**What an SBOM does not do: prove the software is safe.** Presence of a component in a well-formed SBOM is a statement of fact about inventory, not a statement about quality or trustworthiness. The NTIA's 2021 baseline guidance on SBOM minimum elements — since built on by more recent guidance from CISA — describes the data fields a usable SBOM should carry: things like component name, version, supplier, dependency relationships, and who generated the data and when. Those are identification and provenance fields. None of them assert that the identified component is well-written, correctly configured for its use, or free of vulnerabilities that simply haven't been disclosed yet. An SBOM answers 'what is present,' not 'is what's present okay.'",
    "**What an SBOM does not do: verify build integrity.** Knowing what components a build used and knowing that the resulting artifact was actually produced the way records claim are two separate questions, addressed by two separate kinds of control. The SBOM answers the first. Build-provenance frameworks — SLSA (Supply-chain Levels for Software Artifacts, slsa.dev) is the widely referenced example — address the second, through practices like generating signed, verifiable provenance about how and where a build ran, and hardening the build environment itself against tampering. An artifact can ship with a completely accurate SBOM while the build process that produced it was compromised in a way the SBOM has no mechanism to detect — the SBOM describes intended inputs, not a guarantee about what actually happened to them during the build. The build environment's own trustworthiness is a distinct concern from component inventory; see 'Why Build Runners Should Be Treated as Untrusted' for that question specifically, which this guide deliberately does not repeat.",
    "**What an SBOM does not do: stop a malicious dependency from being included.** An SBOM is generated downstream of the decision to include a component, not upstream of it as a gate. If a malicious or dependency-confused package gets installed during a build — see 'Dependency Confusion and Package-Name Trust' for how that specific failure happens — a working SBOM generator will typically do exactly what it's designed to do: record that the package is present, correctly, alongside everything else. The SBOM has no way to distinguish 'this component was deliberately and safely chosen' from 'this component snuck in through a resolution failure,' because that distinction depends on intent and trust decisions the generator was never given visibility into. Catching that kind of inclusion is a job for registry-resolution and namespace controls applied before or during the build, not for the inventory produced afterward.",
    "**Accuracy is entirely bounded by generation method — and this is where most real-world coverage gaps come from.** A static, manifest-based generator that walks a package manifest or lockfile can only describe what that manifest declares; it will miss anything installed or fetched outside that declared set. A build-observed generator that watches what an actual build process resolves and installs is more accurate about that specific build, but still cannot see anything a deployed application later fetches on its own — a plugin pulled at runtime, a module loaded dynamically based on configuration — because that activity happens after the build the generator was watching has already finished. The diagram accompanying this article shows exactly this case: a runtime-fetched dependency bypasses both the build process and SBOM generation entirely, ending up inside the shipped artifact without ever appearing in that artifact's own SBOM. The opposite scope problem also exists: an overly broad generator that captures build-only tooling (compilers, code generators, test-only libraries) alongside genuinely shipped runtime components can make an SBOM look inflated with things a consumer will never actually run, obscuring the components that matter.",
    "**Treat an SBOM's evidentiary weight as bounded by its documented scope, not by its formatting.** A well-formatted, standards-compliant SBOM produced by a generator with an undocumented or poorly understood scope is not more trustworthy than a rougher one whose limitations are written down plainly. The useful question to ask of any SBOM is not 'is this valid SPDX or CycloneDX' — that's a necessary, mechanical property — but 'what could this generation process actually see, and what could it structurally never have seen.' Answering that honestly is what turns an SBOM from a compliance artifact into something a team can actually use during an incident.",
  ],
  validationEvidence: [
    "This guide describes SBOM formats, standards, and generation-method distinctions grounded in the cited standards documentation; it does not include a reproduced generation exercise, a specific tool benchmark, or a completed assessment of a real pipeline's SBOM output. Its evidence state remains UNVERIFIED — the technical claims are grounded in the cited standards and guidance, not in an exercise performed for this article.",
  ],
  limitations: [
    "This guide covers what an SBOM is, what it proves, and what it structurally cannot prove. It does not compare or evaluate specific commercial or open-source SBOM generation tools, and it does not provide regulatory or contractual compliance guidance — SBOM-related requirements vary by jurisdiction, industry, and counterparty, and change over time; consult current authoritative guidance for compliance-specific questions rather than this guide.",
    "It does not repeat 'Dependency Confusion and Package-Name Trust' (registry-resolution trust — how a malicious package gets included) or 'Why Build Runners Should Be Treated as Untrusted' (the build environment's own blast radius) — both are related, distinct concerns this guide deliberately leaves to those articles.",
    "It does not detail every field in the SPDX or CycloneDX specifications, or walk through the full SLSA build-track requirements; it describes each at the level needed to support the distinctions this guide draws, and points to the primary sources for anyone implementing against them directly.",
  ],
  defensiveRecommendations: [
    "Generate SBOMs from the actual build process where feasible — recording what a specific build resolved and installed — rather than solely parsing a manifest in isolation, to reduce the gap between declared and actual dependencies.",
    "Document the generation method and scope for every SBOM you produce or consume: what it includes, what it deliberately excludes (dev dependencies, build-only tooling), and what it structurally cannot see (runtime-fetched or dynamically loaded components), so anyone relying on it knows how much confidence to place in it.",
    "Treat SBOM data as one input to vulnerability-impact assessment, not a substitute for build-provenance verification, dependency-trust controls, or code review — pair it with the controls those other concerns actually require.",
    "Separately inventory and monitor any components your architecture fetches dynamically at runtime, since a build-time SBOM generator cannot see them by construction; this needs a different detection approach entirely, not a more thorough SBOM generator.",
    "Regenerate SBOMs on every build or release rather than relying on a single point-in-time snapshot, since dependency trees change between releases even when source code doesn't.",
    "Prefer a standard, widely supported format — SPDX or CycloneDX — over a bespoke listing, so SBOM data remains machine-comparable across your own tooling and any consumer's tooling.",
  ],
  keyTakeaways: [
    "An SBOM's proven value is fast, accurate vulnerability-impact assessment when a new CVE is disclosed — not a general supply-chain-security guarantee.",
    "An SBOM is a downstream inventory, not an upstream gate: it cannot stop a malicious or dependency-confused package from being included, and it cannot verify that the build producing the artifact was itself trustworthy.",
    "An SBOM's accuracy is entirely bounded by its generation method; static, manifest-based generation systematically misses dependencies fetched dynamically at runtime, after the build has already finished.",
    "Pair SBOM inventory with build-provenance controls (SLSA) and dependency-trust controls (registry and namespace configuration) — none of these three concerns substitutes for the other two.",
  ],
  references: [
    "NTIA, \"The Minimum Elements For a Software Bill of Materials (SBOM)\" (2021): https://www.ntia.gov/report/2021/minimum-elements-software-bill-materials-sbom",
    "CISA, updated minimum-elements guidance for a Software Bill of Materials: https://www.cisa.gov/resources-tools/resources/2026-minimum-elements-software-bill-materials-sbom",
    "SPDX Specification (ISO/IEC 5962:2021), Linux Foundation: https://spdx.dev/",
    "OWASP CycloneDX (Ecma International ECMA-424): https://cyclonedx.org/",
    "SLSA — Supply-chain Levels for Software Artifacts: https://slsa.dev/",
  ],
  relatedSlugs: ["dependency-confusion-package-trust", "build-runners-untrusted", "practical-secure-code-review-checklist"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Access to, or the ability to run, an SBOM generation tool integrated with your actual build process — not only a manifest file inspected in isolation.",
    "A documented understanding of what your current generation tool's scope actually covers: static manifest parsing, build-observed resolution, or some hybrid, and whether it includes or excludes build-only tooling.",
    "Authority, or a path to someone with authority, to change build tooling if generation needs to move from manifest-based to build-observed.",
  ],
  procedure: [
    "Inventory what SBOM, if any, your build currently produces, and identify which generation method created it: static manifest parsing, build-observed resolution, or a hybrid of the two.",
    "Identify categories of dependency your current generation method might not be capturing: components fetched dynamically at runtime, build-only tooling that executes during the build but isn't part of the shipped runtime footprint, and anything installed through a mechanism your SBOM tool doesn't understand.",
    "For a representative sample of shipped artifacts, test whether existing SBOM data alone is sufficient to answer 'are we affected' for a disclosed vulnerability in a widely used component — treat any manual digging required beyond the SBOM as a documented gap, not a one-off inconvenience.",
    "Cross-check SBOM output against an independent method for at least one artifact — for example, inspecting a running instance's actually loaded modules in a lab or non-production environment — to confirm the SBOM's declared scope matches what is genuinely present.",
    "Document the generation method, its scope, and any known gaps alongside the SBOM itself, so a consumer of the SBOM — internal or external — knows what confidence to place in it rather than assuming completeness from formatting alone.",
    "Establish a cadence for regenerating SBOMs on every build or release, rather than treating a single snapshot as permanently accurate.",
  ],
  validation: [
    "Confirm that a newly disclosed vulnerability in a component listed in the SBOM can be traced to every affected artifact using SBOM data alone, within a reasonable time, without manual dependency-tree archaeology.",
    "Confirm that any component known to be fetched dynamically at runtime is explicitly documented as out of SBOM scope, rather than silently absent with no accompanying note.",
    "Confirm the SBOM's declared generation method matches how it was actually produced, by spot-checking the SBOM against the lockfile or manifest actually used for a specific build.",
    "Record any generation gap discovered during this process as UNVERIFIED coverage rather than assuming completeness because the generation tool reported success.",
  ],
  rollback: [
    "If moving to build-observed generation surfaces performance or tooling problems, keep manifest-based generation as a documented, explicitly-labeled fallback while investigating, rather than reverting silently without recording the gap it reintroduces.",
    "If cross-checking reveals your SBOM's real scope is narrower than assumed — for example, missing runtime-loaded components — do not continue treating the existing SBOM as complete; update its documented scope statement immediately, even before the underlying tooling gap can be fixed.",
    "If a generation-process change breaks a downstream consumer expecting a specific SBOM format or schema version, coordinate the change with them directly rather than silently altering structure they depend on.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "SBOMs: What They Solve and What They Do Not",
    slug: "sboms-what-they-solve",
    summary:
      "A Software Bill of Materials gives fast, accurate vulnerability-impact assessment against a known component inventory — and nothing more. What it does not do: prove the software is safe, verify build integrity, stop a malicious dependency from being included, or exceed the accuracy of its own generation process.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["supply-chain-security", "ci-cd-pipelines", "vulnerability-management"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-08-30",
    lastReviewedAt: "2026-08-30",
    updatedAt: "2026-08-30",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Codex", reviewedAt: "2026-08-30" },
    technicalReview: { status: "approved", reviewer: "Codex", reviewedAt: "2026-08-30" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-30" },
  },
  sections,
  module: module_,
  diagram,
};
