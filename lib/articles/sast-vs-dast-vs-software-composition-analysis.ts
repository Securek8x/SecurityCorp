// Knowledge-base article draft (Bead securitycorp-source-4zl.54.1.3).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. All examples describe a fictional
// organization; no real code, repository, credential, system, employer
// detail, or unresolved real vulnerability appears anywhere in this file.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// `mcp__ruflo__workflow_run` invocation was attempted before drafting
// (workflow id workflow-1788143796077-j3hnc9, template "research"). Two
// bounded `workflow_status` checks both showed the documented issue in
// CLAUDE.md: the workflow remained at 0% progress with a pending "Execute"
// stage and returned no retrievable editorial output. This draft was
// therefore produced with the disclosed native fallback instead — separate
// sequential research, drafting, technical-verification, publication-safety,
// and final-editorial passes — not credited to Ruflo. See the calling
// agent's final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, DeepDiveModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "Static Application Security Testing (SAST), Dynamic Application Security Testing (DAST), and Software Composition Analysis (SCA) are frequently discussed as if they were competing options — pick the best one and you're covered. They aren't competing; they're structurally different. Each one is built to observe a different artifact at a different point in the software delivery lifecycle, and each one is correspondingly blind to whatever it wasn't built to observe. SAST reads source code without running it. DAST exercises a running application without reading its code. SCA inventories third-party dependencies against known-vulnerability data without doing either.",
    "This deep-dive explains the actual mechanism behind each approach, maps exactly what it can and structurally cannot see given that mechanism, and lays out how the three combine into a layered testing program — not because layering three tools is inherently virtuous, but because each tool's blind spot is largely covered by a different tool's coverage, and none of the three, even combined, replaces architectural review or authorized manual testing for the class of flaw none of them can see at all.",
  ],
  whatYouWillLearn: [
    "The actual analysis mechanism behind SAST, DAST, and SCA — not just a marketing definition of each — and why that mechanism determines what each one can see.",
    "Where in the software delivery lifecycle (source code, build, dependencies, running application) each approach operates, and why that placement is not an implementation detail but the reason its coverage has the shape it does.",
    "Concrete categories of flaw each approach structurally cannot detect, regardless of how well it is tuned or how expensive the tooling is.",
    "Why 'the scan passed' is a claim about where the tool looked, not a claim that the application is secure — and how to avoid treating one tool's clean result as coverage for a gap only a different tool (or no tool) could have caught.",
    "How to combine the three into a layered, repeatable pipeline, and what category of security flaw sits outside all three regardless of how well they are combined.",
  ],
  intendedAudience: [
    "Developers who run one or more of these tools in CI and want to understand what a passing result actually certifies.",
    "Security practitioners designing or reviewing an application security testing program who need to reason about structural coverage, not just tool selection or scan frequency.",
    "Technical leads deciding where to invest next — a second SAST rule set, a DAST scan against staging, deeper SCA reachability analysis, or something none of the three provides.",
  ],
  prerequisites: [
    "Basic familiarity with a typical software delivery pipeline: source control, a build step, a deployed running application, and third-party dependencies pulled in at build time.",
    "No lab environment is required — every example in this guide is fictional and descriptive, not a runnable exercise.",
    "Some prior exposure to the idea of a known-vulnerability database (a CVE-style feed) is helpful but not assumed.",
  ],
  problem: [
    "It's easy to conclude that once one of these three scan types is running in a pipeline, 'application security testing' is handled. That conclusion mistakes a tool for a category. SAST, DAST, and SCA don't overlap much in what they check, which means running only one of them doesn't give partial coverage of the same risk surface the other two would also check — it gives complete coverage of one narrow slice and none at all of the other two.",
    "The gap matters because each tool's blind spot is invisible from inside that tool. A SAST scan that finds zero issues in a code path is not evidence the running deployment of that code is configured safely — SAST never looked at the deployment. A DAST scan that finds zero exploitable endpoints is not evidence the dependency tree behind those endpoints is free of a disclosed vulnerability — DAST never inspected the dependency manifest. Each clean result is a true statement about a narrow question, and a false comfort about every question the tool didn't ask.",
  ],
  threatModel: [
    "Consider a fictional software team we'll call Cinderpath Systems, building a web application with a typical structure: first-party source code, a set of open-source dependencies pulled in via a package manager, a build step that compiles and packages the result, and a deployed running instance behind a load balancer.",
    "Relevant coverage-gap scenarios, not adversary actions: (1) Cinderpath runs SAST on every pull request and treats a clean result as sufficient security testing before merge — but the application's authentication flow has a logic flaw only observable by actually calling the deployed endpoints in a specific sequence, which no static reading of the source code would reveal on its own; (2) Cinderpath runs SCA against its dependency manifest and gets a clean result because none of its direct or transitive dependencies has a disclosed CVE at scan time — three weeks later a CVE is published against a transitive dependency Cinderpath never re-scanned, because SCA was treated as a one-time build-gate check rather than a continuously re-run one; (3) Cinderpath runs DAST against a staging environment and finds no exploitable issues, but staging is missing a production-only reverse-proxy header rewrite that happens to reintroduce a request-smuggling condition — a runtime configuration difference no DAST run against the wrong environment could have caught; (4) Cinderpath's SAST tool flags a data-flow path from user input to a database call as a potential injection risk, and a reviewer marks it a false positive because a sanitization function sits between the two — a function the SAST tool couldn't verify does what its name suggests without executing it.",
    "Out of scope for this deep-dive: Interactive Application Security Testing (IAST) and Runtime Application Self-Protection (RASP), which combine instrumentation with runtime observation and sit architecturally between DAST and SAST — mentioned briefly as related approaches, not evaluated in depth; fuzz testing and manual penetration testing, which are complementary but distinct testing disciplines; and any evaluation or comparison of specific commercial SAST, DAST, or SCA products.",
  ],
  mainContent: [
    "**SAST reads code without running it — and inherits both the strength and the blindness of that choice.** A SAST tool parses source code (or, in some implementations, bytecode) into an abstract syntax tree or similar intermediate representation, then traces data flow through it: does a value that originates from an untrusted source — user input, a network response, a file read — reach a sensitive sink, such as a database query or a shell command, without passing through a recognized sanitization step along the way? Because this analysis never executes the code, it can examine every code path in the codebase, including ones that are hard to reach at runtime, and it can do so early — on a developer's machine, in a pre-commit hook, or on every pull request, long before a build even exists. That same choice — never executing anything — is exactly what limits it. A SAST tool has no way to confirm that a function named `sanitizeInput` actually sanitizes anything; it can only recognize the pattern of a call to something with that name, or trace whether the value's shape changes in ways its ruleset understands. It cannot see how the application behaves once deployed, cannot detect a flaw that depends on runtime configuration, and cannot verify that a flagged data-flow path is actually reachable by an attacker in the deployed system — it can only report that the path exists in the code as written.",
    "**DAST tests a running application from the outside, the way an external caller would — and can only see what it can reach.** A DAST tool has no access to source code. It works by crawling or otherwise discovering the application's exposed interface (pages, forms, API endpoints), then sending crafted requests to that interface and inspecting the responses for signs of a vulnerability — an injection point, a reflected value that indicates missing output encoding, an authentication bypass, a misconfigured security header, a TLS weakness. Because it interacts with the actual deployed system, its findings are close to directly exploitable: a DAST tool that successfully triggers a response indicating a SQL error has demonstrated something closer to real-world reachability than a SAST tool's static data-flow guess. The same externality that makes this possible is what limits it. DAST can only test what it can discover and reach — a code path behind a login it cannot authenticate through, an internal API never exposed to the interface it crawled, or a client-heavy single-page application whose routes a generic crawler never finds, are effectively invisible to it. It cannot point to a line of source code responsible for a finding, only to the request and response that revealed it, which makes remediation slower even when the finding itself is accurate. And because it requires a running instance, it necessarily runs later in the lifecycle than SAST or SCA can — a flaw it finds is a flaw that already exists in a deployed environment, not one caught before deployment.",
    "**SCA doesn't analyze your code at all — it inventories what you depend on and checks that inventory against what's already known.** A Software Composition Analysis tool parses a project's dependency manifest and lockfile, builds a tree of direct and transitive dependencies, and cross-references each package and version against a known-vulnerability database. Its value is almost entirely in that cross-reference: most modern applications are assembled from far more third-party code than first-party code, and neither SAST nor DAST is designed to reason about a dependency's internals — SAST typically doesn't analyze code outside the first-party source tree it's configured for, and DAST only sees whatever externally observable behavior a vulnerable dependency happens to produce, if any. SCA's blind spot follows directly from what it checks: a known-vulnerability database only contains vulnerabilities that have already been disclosed and cataloged, so SCA structurally cannot flag a vulnerability that hasn't been publicly reported yet, no matter how real it already is. It also, in its simplest form, flags a dependency by presence and version alone — not by whether the specific vulnerable function is ever actually called by the application — which is why naive SCA output is often dominated by findings that are technically present but never reachable in practice, a different failure mode than SAST's or DAST's false positives, but a coverage-noise problem all the same.",
    "**Each approach operates at a different point in the lifecycle, and that placement is the actual reason its coverage has the shape it does — not an arbitrary tooling choice.** SAST operates on source code, before a build exists, which is why it can run fast and early but can't see anything that only manifests once the application is compiled, packaged, and deployed with a specific runtime configuration. SCA operates on the dependency manifest, which exists as soon as dependencies are declared and remains meaningful for as long as the application is running with those dependencies — which is exactly why it needs to be re-run continuously against an unchanged manifest, not just once at build time, since the set of known vulnerabilities against a fixed set of dependency versions keeps growing after the build is complete. DAST operates on the running, deployed application, which is why it's the only one of the three that can observe an actual runtime configuration flaw, and also why it's structurally the last of the three to run and the least able to point back at the specific line of source code responsible for what it found.",
    "**A clean result from one of the three is not evidence about the other two's territory.** This is the core reasoning failure this deep-dive is written to prevent: a SAST scan with zero findings says nothing about the deployed runtime configuration, because SAST never examined it. A DAST scan with zero findings says nothing about a disclosed vulnerability three transitive dependencies deep, because DAST tests the exposed interface, not the dependency tree behind it. An SCA scan with zero findings says nothing about a business-logic flaw in first-party code, because SCA never reads first-party code at all. Treating any one tool's pass as coverage for the others' territory is exactly the assumption dependency confusion, scanner blind spots, and most other single-control failure modes in this catalog share: a control that reliably does its own narrow job gets mistaken for a control that does a broader one.",
    "**Even combined, all three leave a real category of flaw uncovered.** Business logic flaws — a discount code that can be applied twice through a legitimate but unintended sequence of otherwise-valid requests, an authorization check that's technically present but evaluates the wrong scope — typically require a human (or a more expensive, targeted automated technique) to reason about intended behavior versus actual behavior across multiple steps. SAST has no model of intended business behavior; it recognizes code patterns. DAST can stumble onto a business-logic flaw only if its crawler happens to exercise the specific multi-step sequence that exposes it, which generic crawling rarely does deliberately. SCA doesn't examine first-party logic at all. This is why a layered SAST/DAST/SCA pipeline, however well-run, is a floor for a testing program, not a ceiling — architectural threat modeling and authorized manual assessment remain the controls for the flaw class none of the three automated approaches are built to reach.",
  ],
  validationEvidence: [
    "This deep-dive describes the mechanism, lifecycle placement, and structural coverage boundaries of SAST, DAST, and SCA, and a fictional illustrative scenario; it does not include a reproduced scan, a captured tool run, or a completed assessment of a real pipeline. Its evidence state remains UNVERIFIED — the technical claims are grounded in the cited standards and documentation references, not in an exercise performed for this article.",
  ],
  limitations: [
    "This deep-dive covers SAST, DAST, and SCA as categories of technique; it does not evaluate or compare specific commercial or open-source products, and it does not detail any single tool's configuration syntax.",
    "IAST and RASP are mentioned only as related, architecturally distinct approaches and are not evaluated in depth here; treat this deep-dive as covering the three most commonly deployed automated application-security testing categories, not the complete field.",
    "The fictional Cinderpath Systems scenario is illustrative, not a reference architecture. A real organization's testing program must be derived from its own lifecycle, risk tolerance, and threat model, not copied from this guide.",
    "This deep-dive does not cover fuzz testing, manual penetration testing, or architectural threat modeling in depth — each is referenced as a control for the flaw class SAST, DAST, and SCA structurally cannot reach, not described procedurally here.",
  ],
  defensiveRecommendations: [
    "Run SAST early and often — on developer machines or in pre-commit hooks where feasible, and again on every pull request — since its lifecycle placement (before a build exists) is exactly what makes fast, cheap, frequent feedback possible.",
    "Re-run SCA continuously against an unchanged dependency manifest, not only at build time, since new vulnerabilities are disclosed against already-shipped dependency versions on an ongoing basis — a scan result's usefulness decays the moment a new CVE is published against something already in the tree.",
    "Run DAST against an environment that matches production configuration as closely as possible, not merely 'a running instance' — a staging environment missing a production-only configuration detail can produce a false clean result for exactly the class of flaw DAST exists to catch.",
    "Treat SCA findings by reachability where tooling supports it, not presence alone — a disclosed vulnerability in a function your application never calls is a different priority than one on a path actual requests traverse, and conflating the two burns review capacity on noise.",
    "Do not treat a clean result from any one of the three as evidence about the others' territory — document which lifecycle stage and artifact each control actually examined, so a gap is visible as an absence of evidence rather than assumed away as 'already covered.'",
    "Pair layered SAST/DAST/SCA coverage with periodic architectural threat modeling and authorized manual assessment for business-logic and multi-step flaws none of the three automated categories are built to reach.",
  ],
  keyTakeaways: [
    "SAST, DAST, and SCA are not competing options for the same job — each analyzes a different artifact (source code, a running application, a dependency manifest) at a different lifecycle stage, and each is structurally blind to what the other two examine.",
    "A clean result from one tool is a true statement about a narrow question and says nothing about the other two tools' territory — treating it as broader coverage is the actual failure mode, not a defect in any one tool.",
    "SCA results decay over time even against an unchanged codebase, because the known-vulnerability database it checks against keeps growing — it must be re-run continuously, not only at build time.",
    "Even fully combined, SAST, DAST, and SCA leave business-logic and multi-step authorization flaws uncovered — a layered automated pipeline is a floor for a testing program, not a substitute for architectural review and authorized manual assessment.",
  ],
  references: [
    "OWASP — Static Application Security Testing: https://owasp.org/www-community/Source_Code_Analysis_Tools",
    "OWASP DevSecOps Guideline — Dynamic Application Security Testing: https://owasp.org/www-project-devsecops-guideline/latest/02b-Dynamic-Application-Security-Testing",
    "OWASP Top 10:2021 — A06: Vulnerable and Outdated Components: https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/",
    "NIST SP 800-218 (Secure Software Development Framework): https://csrc.nist.gov/pubs/sp/800/218/final",
    "CWE — Common Weakness Enumeration: https://cwe.mitre.org/",
  ],
  relatedSlugs: ["secrets-detection-scanner-limits", "sboms-what-they-solve", "practical-secure-code-review-checklist"],
};

const module_: DeepDiveModule = {
  kind: "deep-dive",
  architecture: [
    "SAST sits earliest in the pipeline, operating directly on source code (or bytecode) before any build artifact exists. It requires no running environment and no dependency resolution — only the code itself and a ruleset or data-flow model to trace it against.",
    "SCA sits alongside the build step, operating on the dependency manifest and lockfile rather than on any code, first-party or third-party. It requires network or database access to a known-vulnerability feed, and its output is only as current as that feed's last update — which is why it needs to be re-run on a schedule, not just at each build.",
    "DAST sits latest, operating on a deployed, running instance of the application. It requires an environment that behaves like production closely enough for findings to be meaningful, and it interacts with the application purely through its exposed interface — it has no access to source code, build configuration, or the dependency tree behind what it observes.",
    "None of the three shares an artifact with either of the others: SAST's input is code that hasn't been built, SCA's input is a manifest describing what will be included, and DAST's input is a system that has already been built, deployed, and configured. This is why their coverage doesn't overlap much, and also why combining them requires deliberate pipeline design rather than assuming three green checks add up to complete coverage.",
  ],
  trustBoundaries: [
    "SAST's boundary is the edge of the first-party source tree it's configured to analyze — code outside that tree (most notably, the internals of third-party dependencies) is generally outside its scope, which is exactly the gap SCA is positioned to cover instead.",
    "SCA's boundary is the known-vulnerability database it checks against — a vulnerability that exists but hasn't been publicly disclosed and cataloged yet sits outside that boundary by definition, not because of a configuration gap but because the database itself doesn't contain it yet.",
    "DAST's boundary is the application's exposed interface — anything not reachable through that interface (an internal-only API, a code path behind authentication the scanner can't complete, a route a generic crawler never discovers) sits outside what DAST can observe, regardless of how thoroughly the scan runs.",
    "The trust boundary each control actually enforces is not 'this application is secure' — it's 'this specific artifact, examined this specific way, showed no findings against this specific ruleset or database.' Conflating that narrow boundary with a broader security claim is the structural risk this deep-dive is written to prevent.",
  ],
  alternatives: [
    "Interactive Application Security Testing (IAST) instruments a running application (often via an agent) to observe actual data flow during real or automated use — architecturally a hybrid that gets closer to SAST's code-level precision with DAST's runtime realism, at the cost of requiring instrumented deployment and typically higher operational overhead.",
    "Runtime Application Self-Protection (RASP) also instruments the running application, but for in-line blocking of malicious behavior at runtime rather than for pre-release testing — a defensive control operating in a different part of the lifecycle than the three testing categories this deep-dive covers.",
    "Fuzz testing generates malformed or unexpected input to find crashes and unexpected behavior, complementary to but distinct from all three approaches covered here — it's a technique for finding a different class of flaw (input-handling robustness) than injection patterns, runtime configuration, or known-vulnerable dependencies.",
    "Manual penetration testing and architectural threat modeling remain the primary controls for business-logic and multi-step authorization flaws — the category this deep-dive's main content section identifies as outside all three automated approaches, combined or not.",
  ],
  tradeoffs: [
    "SAST trades depth of runtime realism for speed and lifecycle placement — it can run on every commit because it never has to build or deploy anything, but a flagged finding is a pattern match against code as written, not a confirmed exploit against a running system.",
    "DAST trades early feedback for exploit realism — a finding is close to directly demonstrable against the real deployed system, but by the time DAST can run at all, the flaw it finds has already survived source review and a build.",
    "SCA trades code-level precision for breadth of third-party coverage — it can flag a known-vulnerable dependency in seconds across an entire dependency tree neither SAST nor DAST is built to analyze, but its simplest form can't distinguish a vulnerability your application actually exercises from one buried in a code path never called.",
    "Layering all three increases total pipeline time and review burden — three sets of findings to triage instead of one — in exchange for coverage across source code, dependencies, and runtime configuration that no single approach provides alone; the tradeoff is worth making deliberately, not by default, and still leaves business-logic flaws for a separate control.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "sast-dast-sca-diagram",
  title: "Where SAST, DAST, and SCA operate across the software delivery lifecycle",
  desc: "Source code and a dependency manifest each feed toward a build, which produces a deployed running application. SAST scans the source code before the build; SCA scans the dependency manifest before the build; DAST scans the running application after deployment. Interactive: switch between the normal path, where all three checkpoints run and a runtime-configuration flaw is caught by DAST before release, and the failure path, where testing stops after the build — SAST and SCA both pass, but with no DAST run against the deployed system, a runtime-only flaw neither static tool could see reaches production undetected. Explore each node for details.",
  viewBox: "0 0 980 420",
  failureLabel: "Runtime-only flaw uncaught",
  caption: "Source code → SAST and Dependency manifest → SCA both feed the build; the build's running application is then scanned by DAST before a verified release (normal path). In the failure path, DAST is skipped after the build, so a flaw that exists only in runtime configuration — invisible to both static checks — reaches production undetected.",
  motionDuration: 2900,
  mainPacketRoute: { d: "M160,180 H210 M380,180 H430 M580,180 H630 M810,180 H850", length: 130 },
  edges: [
    { id: "source-sast", from: "sourceCode", to: "sast", d: "M160,180 H210", length: 50, kind: "main", activeIn: ["normal", "failure"] },
    { id: "sast-build", from: "sast", to: "build", d: "M380,180 H430", length: 50, kind: "main", activeIn: ["normal", "failure"] },
    { id: "deps-sca", from: "dependencies", to: "sca", d: "M160,330 H210", length: 50, kind: "main", activeIn: ["normal", "failure"] },
    { id: "sca-build", from: "sca", to: "build", d: "M380,330 H410 V210", length: 150, kind: "main", activeIn: ["normal", "failure"] },
    { id: "build-runningApp", from: "build", to: "runningApp", d: "M580,180 H630", length: 50, kind: "main", activeIn: ["normal"] },
    { id: "runningApp-release", from: "runningApp", to: "verifiedRelease", d: "M810,180 H850", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "build-gap", from: "build", to: "productionGap", d: "M505,210 V335 H630", length: 250, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "sourceCode",
      label: "Source code",
      x: 10,
      y: 150,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description: "First-party application code, before any build exists. This is the only artifact SAST is designed to read — it never sees a compiled artifact, a dependency's internals, or a running system.",
    },
    {
      id: "sast",
      label: "SAST (static scan)",
      x: 210,
      y: 145,
      w: 170,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "SAST — static scan of first-party source code, tracing data flow without executing anything",
      description: "Parses source code and traces data flow from untrusted inputs toward sensitive sinks, without executing any of it. Fast and early, but structurally unable to see runtime configuration, third-party dependency internals, or whether a flagged path is actually reachable in the deployed system.",
    },
    {
      id: "dependencies",
      label: "Dependency manifest",
      x: 10,
      y: 300,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description: "The lockfile or manifest declaring every direct and transitive third-party package the build will include. This — not any application code — is the only artifact SCA examines.",
    },
    {
      id: "sca",
      label: "SCA (composition scan)",
      x: 210,
      y: 295,
      w: 170,
      h: 70,
      activeIn: ["normal", "failure"],
      role: "boundary",
      focusableLabel: "SCA — cross-references the dependency manifest against a known-vulnerability database",
      description: "Cross-references every declared dependency and version against a known-vulnerability database. Structurally can't flag a vulnerability that hasn't been publicly disclosed yet, and in its simplest form flags a dependency by presence rather than by whether the application actually reaches the vulnerable function.",
    },
    {
      id: "build",
      label: "Build & package",
      x: 430,
      y: 150,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description: "Source code and resolved dependencies are compiled and packaged into a deployable artifact. Neither SAST nor SCA examines anything past this point — what happens after deployment is outside both of their artifacts.",
    },
    {
      id: "runningApp",
      label: "Running application (DAST)",
      x: 630,
      y: 145,
      w: 180,
      h: 70,
      activeIn: ["normal"],
      role: "boundary",
      focusableLabel: "Running application scanned by DAST — the only one of the three that observes actual runtime configuration",
      description: "The deployed, running instance of the application, exercised from the outside through its exposed interface — the only artifact DAST examines. It's also the only one of the three checkpoints that can observe an actual runtime configuration flaw, since neither SAST nor SCA ever runs the application. Dimmed in the failure path because this checkpoint was skipped.",
    },
    {
      id: "verifiedRelease",
      label: "Verified release",
      x: 850,
      y: 150,
      w: 120,
      h: 60,
      activeIn: ["normal"],
      role: "safe",
      description: "Release proceeds only after all three lifecycle stages — source, dependencies, and the running deployment — have each been checked by the tool built to examine that specific artifact.",
    },
    {
      id: "productionGap",
      label: "Runtime flaw reaches production undetected",
      x: 630,
      y: 300,
      w: 250,
      h: 70,
      activeIn: ["failure"],
      role: "blocked",
      focusableLabel: "Runtime flaw reaches production undetected — DAST was skipped, so the only checkpoint able to see this flaw never ran",
      description: "SAST passed on the source code and SCA passed on the dependency manifest — both true, narrow results. Because DAST never ran against the deployed system, a flaw that exists only in runtime configuration, invisible to both static checks by construction, ships to production with two clean scans and zero coverage of the artifact where the flaw actually lives.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "SAST vs DAST vs Software Composition Analysis",
    slug: "sast-vs-dast-vs-software-composition-analysis",
    summary:
      "What Static Application Security Testing, Dynamic Application Security Testing, and Software Composition Analysis each actually catch, what each structurally cannot catch given how it works, and how to combine them into a defensible layered testing approach instead of assuming one tool is sufficient.",
    pillar: "build-securely",
    primaryCategory: "application-code-security",
    contentType: "deep-dive",
    difficulty: "intermediate",
    status: "published",
    tags: ["application-security", "security-control-validation", "supply-chain-security", "vulnerability-management"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 14,
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
  sections,
  module: module_,
  diagram,
};
