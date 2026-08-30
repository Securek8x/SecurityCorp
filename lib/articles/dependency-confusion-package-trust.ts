// Knowledge-base article draft (Bead securitycorp-source-4zl.54.1.7).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// `mcp__ruflo__workflow_run` invocation was attempted before drafting
// (workflow id workflow-1788086321601-gbqt2e, template "research"). It
// reproduced the documented issue in CLAUDE.md: it remained at 0% progress
// with a pending "Execute" stage across two bounded status checks and
// returned no retrievable editorial output. This draft was therefore
// produced with the disclosed native fallback instead — separate research,
// drafting, technical-verification, publication-safety, and editorial
// passes — not credited to Ruflo. See the calling agent's final report for
// full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";

const sections: UniversalSections = {
  executiveSummary: [
    "Dependency confusion is not a flaw in any one package — it's a flaw in how a package manager decides which registry to trust when more than one registry could plausibly answer for the same name. When a build environment is configured to check an internal registry and a public registry for the same package namespace, and nothing forces the internal one to win unambiguously, an attacker who simply publishes a same-named package to the public registry can get their code installed — and executed — inside a target's own build process.",
    "This guide explains the resolution failure that makes dependency confusion possible, why it is a namespace-trust problem rather than a code-quality or secrets-handling problem, and a repeatable set of configuration and namespace-reservation controls that remove the ambiguity a package manager would otherwise have to guess through.",
  ],
  whatYouWillLearn: [
    "Why dependency confusion is a registry-resolution problem, not a vulnerability in the internal package itself.",
    "How an attacker turns a guessed or leaked internal package name into working code execution inside someone else's build or CI environment, using nothing more than a public registry account.",
    "The specific configuration pattern — multiple registries checked for the same unscoped name, with no explicit authoritative source — that makes the attack possible in the first place.",
    "How namespace scoping (reserving an organization's package namespace on the public registry) and single-source registry configuration close the ambiguity that dependency confusion depends on.",
    "A repeatable review procedure for auditing a build environment's package-resolution configuration before an attacker has to demonstrate the gap for you.",
  ],
  intendedAudience: [
    "Developers who maintain internal-only packages consumed by an organization's own build or CI pipeline.",
    "Security practitioners reviewing build and dependency configuration for supply-chain risk, not just scanning installed packages for known vulnerabilities.",
    "Technical leads deciding how to configure package-manager registries across mixed internal/public environments.",
  ],
  prerequisites: [
    "Basic familiarity with a package manager (npm, pip, or similar) and how it resolves a dependency name to a specific registry and version.",
    "No lab environment is required — every example in this guide is fictional and descriptive, not a runnable exercise.",
    "Some prior exposure to the idea of a private or internal package registry is helpful but not assumed.",
  ],
  problem: [
    "It's easy to assume an internal package name is safe by default because it was never intentionally published anywhere public. That assumption is exactly what dependency confusion exploits. A name never being deliberately published publicly is not the same as that name being unavailable for someone else to claim — on most public registries, an unclaimed name is simply open, and nothing about it looking 'internal' stops a stranger from publishing to it.",
    "The failure isn't that the internal package is insecure — it's that the environment installing it can't reliably tell an attacker's same-named public package apart from the real one, and in a common misconfiguration, doesn't have to be tricked so much as it defaults to the wrong answer on its own.",
  ],
  threatModel: [
    "Consider a fictional retail-software company we'll call Solandra Systems. Solandra's internal build tooling depends on a private package, `solandra-build-utils`, hosted on an internal registry at `registry.lab.example.com`. Solandra's build pipeline is also configured with the public registry as a secondary source — a common setup left over from before the internal registry existed, kept so that ordinary open-source dependencies still resolve normally.",
    "Relevant failure modes, not a single adversary action: (1) `solandra-build-utils` is an unscoped, guessable name — a bare string, not reserved under an organization-owned namespace on the public registry; (2) the build pipeline's registry configuration doesn't declare the internal registry as the sole authoritative source for that name — it checks both, and resolution logic (commonly: highest available version wins) can select whichever registry answers with the higher version number; (3) an attacker who learns or guesses the name `solandra-build-utils` — from a leaked build log, a public job posting mentioning internal tooling, or simple pattern-guessing off the company name — publishes a package with that exact name to the public registry, at a version number higher than the internal one, with a malicious install script attached.",
    "Out of scope for this guide: typosquatting attacks against names deliberately chosen to be public (a different, related problem this guide doesn't cover in depth), compromise of a legitimate maintainer's account on a public registry, and vulnerabilities inside a dependency's own code once it has been correctly and intentionally installed.",
  ],
  mainContent: [
    "**The core failure is ambiguous authority, not a missing scan.** A vulnerability scanner checks the code inside a package you already decided to install. Dependency confusion happens one step earlier — during the decision of which package, from which registry, actually gets installed for a given name. No scan of the installed code can catch a resolution decision that was already wrong before installation happened; this is a configuration problem, not a code-quality problem.",
    "**Package managers commonly default to 'highest version wins,' not 'internal source wins.'** Many package-manager configurations that check more than one registry for the same name resolve by comparing version numbers across whichever sources respond, rather than treating one registry as authoritative and the other as a fallback only for names it doesn't recognize. An attacker who knows this only needs to publish a higher version number under the same name on the registry they control — the public one — to win that comparison.",
    "**An internal-sounding name is not a protected namespace.** Registering `solandra-build-utils` on Solandra's own internal registry reserves that name there, and nowhere else. On the public registry, the same string is just an ordinary, unclaimed package name available to whoever publishes it first — unless the organization has taken a separate, deliberate step to claim or scope it there too.",
    "**Install scripts are what turn a wrong package into code execution.** Most modern package managers support a script that runs automatically at install time (a `preinstall` or `postinstall` hook in npm's case, and equivalent build-time execution hooks in other ecosystems). This is the step that converts 'the wrong package got installed' into 'attacker-supplied code just ran inside this environment' — often with whatever filesystem access, network reach, and credentials the installing job already holds, including CI secrets the legitimate internal package was never meant to touch.",
    "**Namespace scoping removes the ambiguity at its source.** Where the ecosystem supports it — npm's `@scope/name` convention is the clearest example — reserving an organization's scope on the public registry and configuring every consuming environment to map that scope explicitly to the internal registry turns 'which of two sources answers for this name' into a question with only one possible answer. A scoped name isn't guessed into collision the way a bare name is; the scope itself has to be claimed, and claiming it is exactly the fix.",
    "**Where native scoping doesn't exist, claim the name anyway.** Ecosystems without a first-class namespace-reservation feature (a plain, unscoped package name on many registries) still generally let anyone publish under an unclaimed name. Publishing a placeholder package under every internally used name — even an empty one that does nothing — denies that name to an attacker on the same terms the internal registry already assumed it had. This is a defense-in-depth compensating step, not a substitute for fixing the resolution configuration itself, and it adds an ongoing maintenance obligation (someone now owns a placeholder that must not silently become an unmaintained real dependency).",
    "**'Check multiple registries, prefer whichever answers' is the actual vulnerability — not any one registry.** The safer pattern is configuring each consuming environment with one explicitly authoritative index for internal names, so a request for an internal package either resolves from the internal registry or fails outright — it does not silently fall through to a public source that happens to have a same-named answer. A hard failure is recoverable and visible; a silent wrong-source substitution usually isn't noticed until the install script has already run.",
    "**Pinning and lockfiles help, but only if they record source, not just version.** A lockfile that pins an exact version number doesn't by itself prevent an attacker from publishing that exact version number to the public registry too. What closes the gap is a lockfile or install configuration that also records — and verifies — which registry a package is expected to come from, so a same-named, same-versioned package from an unexpected source is rejected rather than silently accepted.",
  ],
  validationEvidence: [
    "This guide describes a resolution-configuration pattern and a review procedure; it does not include a reproduced attack, a captured build log, or a completed assessment of a real pipeline. Its evidence state remains UNVERIFIED — the technical claims are grounded in the cited research and package-manager documentation, not in an exercise performed for this article.",
  ],
  limitations: [
    "This guide covers dependency confusion specifically — namespace/registry-resolution trust across mixed internal and public sources. It does not cover typosquatting against deliberately public package names, compromised maintainer accounts, or vulnerabilities inside a package that was correctly and intentionally installed; those are related but distinct supply-chain risks.",
    "The fictional Solandra Systems example is illustrative, not a reference architecture. A real organization's registry configuration and namespace-reservation approach must be derived from its own package manager, registry tooling, and threat model, not copied from this guide.",
    "This guide does not evaluate or compare specific commercial or hosted private-registry products, and it does not detail every ecosystem's individual namespace-scoping syntax — apply the general principle (single authoritative source, reserved namespace) to whichever package manager is actually in use.",
  ],
  defensiveRecommendations: [
    "Configure every consuming environment with one explicitly authoritative registry per internal package namespace — resolution should fail outright, not silently fall through to a public source, when the internal registry can't answer.",
    "Where the ecosystem supports namespace scoping, reserve the organization's scope on the public registry and map it explicitly to the internal registry in every build and CI environment's configuration, not just on developer workstations.",
    "Where native scoping doesn't exist, publish placeholder packages under every internally used name on the public registry, and assign clear, ongoing ownership so a placeholder doesn't quietly rot into an unmaintained real dependency.",
    "Record and verify expected package source, not only version, in lockfiles or install configuration, so a same-named, same-versioned package from an unexpected registry is rejected rather than silently accepted.",
    "Review install-time script execution policy for every environment that resolves dependencies, and scope CI credentials available during install to the minimum the build actually needs — install scripts run with that access.",
    "Periodically audit registry configuration for drift, since a fallback-to-public setting added for one legitimate reason (an open-source dependency that briefly failed to resolve internally) can silently reopen the ambiguity for every internal package name afterward.",
  ],
  keyTakeaways: [
    "Dependency confusion exploits ambiguous registry resolution, not a flaw in the internal package's own code — no amount of scanning the installed package catches a resolution decision that was already wrong.",
    "An internal-sounding package name is only protected where it's been deliberately reserved; on any registry that wasn't told to protect it, the name is available to whoever publishes it first.",
    "Install-time scripts are what convert a wrong-source resolution into code execution, often inheriting the installing job's own filesystem access, network reach, and credentials.",
    "Namespace scoping plus a single authoritative registry per name — not just noticing the attack after the fact — is what removes the ambiguity dependency confusion depends on.",
  ],
  references: [
    "Alex Birsan, \"Dependency Confusion: How I Hacked Into Apple, Microsoft and Dozens of Other Companies\" (2021): https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610",
    "npm Docs — About scopes: https://docs.npmjs.com/cli/v10/using-npm/scope",
    "pip documentation — install command reference (multiple index URLs): https://pip.pypa.io/en/stable/cli/pip_install/#cmdoption-extra-index-url",
    "CWE-1357: Reliance on Insufficiently Trustworthy Component: https://cwe.mitre.org/data/definitions/1357.html",
    "OWASP Top 10:2021 — A06: Vulnerable and Outdated Components: https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/",
  ],
  relatedSlugs: ["secrets-detection-scanner-limits", "securing-api-authentication-authorization", "practical-secure-code-review-checklist"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "An inventory of every internal-only package name your build process installs, and whether each is published under a reserved, scoped namespace or a bare, guessable name.",
    "The exact registry-resolution configuration for every build and CI environment that installs dependencies — which registries are configured, in what order, and whether any setting allows a public fallback for the same name.",
    "Access to modify package-manager and registry configuration (scope mappings, authoritative-index settings) and, where applicable, the ability to publish placeholder packages on the public registry.",
  ],
  procedure: [
    "Enumerate every internally named package your build process installs and confirm whether its name is scoped/namespaced or a bare string that could be guessed from a company or project name.",
    "For each build and CI environment, record the exact registry-resolution configuration: is there a single trusted index for internal names, or does the configuration allow the public registry to answer for the same name.",
    "Where the package manager supports namespace scoping, reserve the organization's scope on the public registry and configure every environment to map that scope explicitly to the internal registry, rather than resolving it generically alongside other sources.",
    "For ecosystems without native namespace scoping, publish placeholder packages for internal names on the public registry, or configure the package manager to treat the internal registry as the sole authoritative source for those names.",
    "Pin exact versions and verify installs against a lockfile or install configuration that records expected package source, not just version, so a same-named substitute from a different registry can't silently satisfy the same dependency line.",
    "Review install-time script execution policy for every environment that resolves dependencies, since this is the step that turns a wrong-source resolution into code execution.",
    "Record which registry-resolution gaps are closed versus which remain open with a compensating control, rather than treating 'install succeeded' as evidence the correct package was used.",
  ],
  validation: [
    "Confirm that installing each internal package name in a clean environment resolves only from the internal registry, and that disabling or misconfiguring the internal registry causes a hard failure rather than a silent fallback to the public registry.",
    "Confirm that a same-named test package published to the public registry (or a local mock registry) is not installed when the properly scoped and pinned configuration is in place.",
    "Confirm build and CI logs record which registry actually served each installed package, not merely that the install step exited successfully.",
    "Confirm install-time script execution is disabled or requires explicit review wherever feasible, and that credentials available to the install step are scoped to the minimum the build actually needs.",
  ],
  rollback: [
    "If restricting registry resolution breaks a legitimate internal package pull, restore the specific scope or index mapping for that one package first rather than reopening public fallback broadly, then re-diagnose why resolution failed before relaxing anything further.",
    "If reserving a namespace or publishing a placeholder package collides with an existing public package your organization already owns under that name, coordinate with whoever maintains it before republishing, rather than overwriting it unreviewed.",
    "If a review finds an internal package name with no reserved namespace and no placeholder claim on the public registry, treat the finding as internal-source per the publication-safety policy — do not describe the exposed name publicly, and route reservation or scoping to the responsible team before any public write-up.",
  ],
};

const diagram: KnowledgeArticle["diagram"] = {
  titleId: "dependency-confusion-diagram",
  title: "Package-name resolution across internal and public registries",
  desc: "A developer or CI job asks the package manager to install an internal-sounding package name. The package manager is configured to check both an internal registry and the public registry for that name. Interactive: switch between the normal path, where a reserved, scoped namespace resolves the request unambiguously to the internal registry, and the failure path, where the same unscoped name resolves instead to an attacker-published package on the public registry, whose install script then executes. Explore each node for details.",
  viewBox: "0 0 900 400",
  failureLabel: "Dependency confusion",
  caption: "Developer/CI install request → package manager → internal registry (normal path, scoped namespace reserved) or public registry → attacker package (failure path, unscoped name with no reserved namespace), whose install script executes with the build job's own access.",
  motionDuration: 2800,
  mainPacketRoute: { d: "M160,180 H190 M380,180 H420 M610,180 H660", length: 120 },
  edges: [
    { id: "developer-pm", from: "developer", to: "packageManager", d: "M160,180 H190", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "pm-internal", from: "packageManager", to: "internalRegistry", d: "M380,180 H420", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "internal-build", from: "internalRegistry", to: "buildOutcome", d: "M610,180 H660", length: 50, kind: "main", activeIn: ["normal"] },
    { id: "pm-public", from: "packageManager", to: "publicRegistry", d: "M285,215 V290", length: 75, kind: "failure", activeIn: ["failure"] },
    { id: "public-attacker", from: "publicRegistry", to: "attackerPackage", d: "M380,320 H460", length: 80, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "developer",
      label: "Developer / CI install",
      x: 10,
      y: 150,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description: "A developer's workstation or a CI job requests an internal-sounding package name as part of a normal install step. The requester doesn't choose which registry answers — that decision belongs entirely to the package manager's configuration.",
    },
    {
      id: "packageManager",
      label: "Package manager",
      x: 190,
      y: 145,
      w: 190,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "Package manager — trust boundary that decides which configured registry is authoritative for the requested name",
      description: "Trust boundary: resolves the requested name against every registry it's configured to check. Whether that resolution is unambiguous depends entirely on configuration made before this moment — a reserved, scoped namespace mapped to one authoritative source (normal path), or an unscoped name left to whichever registry answers, commonly by highest version number (failure path).",
    },
    {
      id: "internalRegistry",
      label: "Internal registry",
      x: 420,
      y: 145,
      w: 190,
      h: 70,
      activeIn: ["normal"],
      role: "safe",
      description: "The organization's own registry at a fictional address such as registry.lab.example.com. In the normal path, the requested name is scoped and explicitly mapped here, so there is no other source the package manager could have chosen instead.",
    },
    {
      id: "buildOutcome",
      label: "Verified internal build",
      x: 660,
      y: 150,
      w: 190,
      h: 60,
      activeIn: ["normal"],
      role: "safe",
      description: "The build proceeds using the intended internal package. Because the namespace was reserved and the registry mapping was explicit, no version-comparison guess or public fallback was ever in play.",
    },
    {
      id: "publicRegistry",
      label: "Public registry (parallel lookup)",
      x: 190,
      y: 290,
      w: 190,
      h: 60,
      activeIn: ["failure"],
      description: "The public registry itself is ordinary, legitimate infrastructure — it isn't the failure. The failure is that the package manager was configured to accept an answer from here for a name that was never reserved or scoped to exclude it.",
    },
    {
      id: "attackerPackage",
      label: "Attacker package executes",
      x: 460,
      y: 290,
      w: 230,
      h: 60,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel: "Attacker package executes — a same-named, higher-version public package wins resolution and its install script runs with the build job's own access",
      description: "An attacker who guessed or learned the internal package name published a same-named package here, at a higher version number, with a malicious install script attached. Because the name was never reserved, this package legitimately wins an unscoped 'highest version' resolution — and its install script then runs with whatever filesystem access, network reach, and credentials the installing job already holds.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Dependency Confusion and Package-Name Trust",
    slug: "dependency-confusion-package-trust",
    summary: "How package managers resolving names across mixed internal and public registries can be tricked into installing an attacker-controlled package instead of your own — and the namespace-reservation and single-source resolution controls that close the gap.",
    pillar: "build-securely",
    primaryCategory: "application-code-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["supply-chain-security", "ci-cd-pipelines", "application-security"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    updatedAt: "2026-08-30",
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
