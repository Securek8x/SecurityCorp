// Knowledge-base article draft (Bead securitycorp-source-4zl.54.2.7).
// Status is intentionally "drafting" — see docs/publication-safety-policy.md.
// This file is NOT wired into lib/knowledge-content.ts; it becomes part of
// the published catalog only after human privacy/technical/publication
// review, per docs/knowledge-base.md. All examples describe a fictional
// pipeline; no real pipeline name, repository identifier, credential,
// account name, or production release detail appears anywhere in this file.
// No real, working, or plausible-looking secret value appears anywhere —
// every example uses clearly placeholder text (`<redacted>`, `${API_TOKEN}`)
// per the publication-safety policy's own examples.
//
// Differentiation from the adjacent CI/CD-security article in this category:
// lib/articles/secrets-detection-scanner-limits.ts covers why automated
// secrets scanning can't catch everything after a secret is already
// committed or exposed (a detection-coverage-gap problem). This article is
// upstream of that one: it is about the mechanisms that put a secret into a
// build log in the first place, and how to prevent that at the source,
// rather than detect it afterward. Reference the scanner-limits article for
// readers who land here after a scan already found something; don't repeat
// its content here.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// `mcp__ruflo__workflow_run` invocation was attempted before drafting
// (workflow id workflow-1788196561223-1h1she, template "research"). A
// bounded `workflow_status` check showed it remained at 0% progress with a
// pending "Execute" stage and returned no retrievable editorial output —
// reproducing the documented Ruflo executor limitation in this repo's
// CLAUDE.md. This draft was therefore produced with the disclosed native
// fallback instead — separate research, drafting, technical-verification,
// publication-safety, and editorial passes — not credited to Ruflo. See the
// calling agent's final report for full editorial-routing evidence.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const sections: UniversalSections = {
  executiveSummary: [
    "A build log's job is to show what happened. That job doesn't stop at 'the deploy succeeded' — it also faithfully repeats whatever the pipeline printed along the way, including a secret that a command echoed, dumped, or included in an error message. A log is not a secure channel by default; treating it as one is how a token that never should have been readable ends up sitting somewhere developers, auditors, and — depending on retention and access controls — anyone with log access can read it indefinitely.",
    "This guide covers the concrete mechanisms by which a secret actually reaches a build log (verbose/debug command output, an environment-variable dump, an error or stack trace that includes a value, and a tool echoing its own invocation), the controls that prevent it (CI-platform masking, avoiding verbose modes around secret-handling commands, structured secret injection instead of shell-visible environment variables), and what to do when prevention fails anyway: treat the secret as compromised and rotate it — redacting the log after the fact does not undo the exposure. The example pipeline and every identifier in it are fictional; no real pipeline, repository, credential, or production system is described, and no example contains a real or plausible-looking secret value.",
  ],
  whatYouWillLearn: [
    "The specific mechanisms by which a secret ends up printed in a build log — verbose/debug command output, an environment-variable dump, an error or stack trace that includes a value, and a tool echoing its own invocation.",
    "What CI-platform masking/redaction actually does and does not catch, so it gets used as a safety net rather than the primary control.",
    "Why passing a secret through a shell-visible environment variable or a command-line argument is riskier than structured secret injection, and what that distinction looks like in practice.",
    "Why a secret found in a log must be treated as compromised and rotated immediately — and why deleting or redacting the log afterward does not close the exposure.",
  ],
  intendedAudience: [
    "Developers who write pipeline scripts and want to know which habits — a stray verbose flag, an environment dump left in from debugging — actually put a secret at risk.",
    "DevOps practitioners configuring CI/CD platforms, secret stores, and the masking/redaction features those platforms provide.",
    "Security engineers assessing whether a pipeline's secret handling relies on masking as a backstop, or treats masking as the only line of defense.",
  ],
  prerequisites: [
    "Basic familiarity with how a CI/CD pipeline injects a credential into a job — an environment variable, a mounted file, or a platform-native secrets integration.",
    "No lab environment is required; every example in this guide is fictional and descriptive, not a runnable exercise.",
    "Awareness that a build log is generally readable by more people, for longer, than the job that produced it ran for is useful background, though this guide explains why that distinction matters.",
  ],
  problem: [
    "A build log exists to answer 'what did this pipeline actually do,' and the more detail it captures, the more useful it is for debugging. That same property is what makes it dangerous around secrets: any command that prints its own arguments, dumps its environment, or surfaces a value in an error message will print a credential exactly as faithfully as it prints everything else. Nothing about a debug flag or a verbose mode distinguishes a secret from ordinary diagnostic text — the tool doesn't know the difference, so it doesn't protect it.",
    "The consequence is asymmetric with where the mistake was made. The command that leaked the secret ran once; the log it wrote to typically persists for a defined retention window, is often exported to a log-aggregation or SIEM platform, may be cached in a support ticket or a screenshot, and is readable by everyone with access to the pipeline's logs — a broader and longer-lived audience than the job's own runtime access ever was. A secret that leaks into a log is not a momentary mistake; it's a durable exposure with a much wider blast radius than the single line of output that caused it.",
  ],
  threatModel: [
    "Assets: the secret value itself (a token, credential, or key a job needs to authenticate with), the log stream a pipeline step writes to, and the decision points — a command's verbosity, whether the environment gets dumped, how an error is handled — that determine whether the secret ends up in that stream.",
    "The central trust decision: a pipeline step that receives a secret assumes that secret will only ever be used, not displayed. Unless something specifically prevents display — masking, careful command construction, avoiding verbose modes around that step — that assumption doesn't hold, because most tools have no concept of 'this particular argument is sensitive'; they print what they're given.",
    "Representative mechanisms: (1) verbose or debug output — a shell step running with a trace flag, or a CLI invoked with a verbose option, echoes the full command it's about to run, including any secret passed as an inline argument or interpolated into the command line; (2) an environment-variable dump — a diagnostic step, or a tool's own crash handler, prints the full process environment for troubleshooting, and any secret sitting in an environment variable is included indiscriminately along with everything else; (3) an error or stack trace that includes a value — a client library's exception message includes the request it was making (headers, a connection string, a full URL with an embedded token) because that's genuinely useful for debugging a failure, and the library has no way to know one of those fields is secret; (4) a tool echoing its own invocation — a deploy CLI or build tool logs the exact command it ran as part of its own normal output, for traceability, and if a secret was passed as a command-line flag it appears in that self-logged invocation exactly as typed.",
    "The interactive diagram accompanying this article shows the difference concretely: a fictional deploy step authenticating with a token, where the normal path injects that token through a structured mechanism and the platform masks it in output, versus a failure mode where a debug flag or an unmasked echo on that same step causes the token to appear in plaintext in the log. A successful deploy looks identical from the outside in both cases — the difference is entirely in what the step printed along the way.",
  ],
  mainContent: [
    "**Verbose and debug output is the most common source, and the easiest to prevent deliberately.** A shell script run with a trace option, or a CLI tool invoked with `--verbose`/`-v`/a debug flag, prints every command it executes before running it — arguments included. If a secret was interpolated directly into that command line (`some-tool --token <redacted>` rather than reading the token from a file or an SDK call), tracing that command prints the secret in plain text, once per invocation, for as long as that trace mode stays enabled. The fix isn't 'never use verbose mode' — verbose output is genuinely useful for debugging everything else in a pipeline — it's scoping trace/debug modes away from the specific steps that handle a secret, and never interpolating a secret directly into a traced command line.",
    "**An environment-variable dump exposes every secret in scope at once, not just one.** A diagnostic step added during troubleshooting (`printenv`, `env`, an equivalent language-runtime call) or a tool's own crash handler that logs its environment for support purposes doesn't distinguish a secret from an ordinary configuration value — it prints the whole environment indiscriminately. This is a worse failure mode than a single leaked argument, because a job commonly holds more than one credential in its environment (a deploy token, a package-registry credential, a notification webhook secret), and one dump exposes all of them in a single log entry.",
    "**Error and stack trace inclusion is harder to control, because it originates inside a dependency, not your own script.** A library authenticating to an external service will often include the failed request's details in its exception message — the URL, the headers, a connection string — specifically because that's useful for diagnosing why the request failed. The library has no way to know that one of those fields happens to be a secret; from its perspective, it's just reporting what it sent. This is why unhandled exceptions around a secret-handling call are a distinct risk from a script's own verbose output: the leak doesn't require anyone to have turned on a debug flag, only for the request to fail in a way that surfaces its own inputs.",
    "**A tool echoing its own arguments is a variant of the same problem with one specific, avoidable trigger: passing a secret as a command-line argument at all.** Many CLIs log their own invocation as part of normal, non-verbose output — for traceability, so a later reader can see exactly what ran. If the secret was passed as `--token <redacted>` rather than read from a file, an environment variable the tool reads directly, or a secrets-manager reference, that self-logged invocation reproduces the secret regardless of any debug setting. The safest fix is structural: never pass a secret as a bare command-line argument to anything that might log its own invocation, which is most tools.",
    "**CI-platform masking and redaction are a real, useful safety net — and they have specific, well-documented limits that make them insufficient as a sole control.** Most CI platforms will scan output for an exact match against a registered secret value and replace it with a placeholder before the log is stored. That's valuable, but it only catches the exact registered string: a secret that's been base64-encoded, split across multiple log lines, concatenated with other text, or transformed in any way (a common side effect of some verbose or debug output formats) commonly evades masking entirely, because the platform is comparing against the literal registered value, not reasoning about what the value became. Masking is a backstop for the cases prevention missed, not a substitute for preventing the print in the first place.",
    "**Structured secret injection narrows what a dump or an echo can expose, by never putting the secret somewhere broadly visible to begin with.** Instead of exporting a secret as a shell-visible environment variable for the entire job, or passing it as a command-line argument, prefer whatever structured mechanism the CI platform and identity provider support: a secrets-manager reference resolved at the point of use, a short-lived credential minted through federation and scoped to one step, or a file mounted with restricted permissions that only the specific process reading it can access. None of these eliminates the four mechanisms above on their own — a structured secret can still be printed if the step that reads it turns around and echoes it — but they shrink the surface a broad environment dump or an unrelated step's debug output could expose, because the secret is no longer sitting in every process's inherited environment for the whole job.",
    "**When a secret does reach a log, the response is rotation — not redaction of the log.** The moment a secret is confirmed (or reasonably suspected) to have appeared in a log, treat it as compromised regardless of whether anyone is believed to have actually read it. Redacting or deleting the log entry is a reasonable hygiene step, but it does not undo the exposure: the log may already have been exported to a log-aggregation platform, cached by a browser or a support tool, included in a backup, or simply viewed before the redaction happened. The only control that actually closes a log-based exposure is invalidating the leaked credential and issuing a new one — redaction narrows who can see the leak going forward; rotation is what removes the leaked value's ability to do anything at all.",
  ],
  validationEvidence: [
    "This guide describes prevention and response patterns and a fictional illustrative pipeline; it does not reproduce a specific CI platform's masking configuration, a captured log-exposure incident, or a completed rotation exercise. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and then verify against your own pipeline's tooling, not as a validated result.",
  ],
  limitations: [
    "This guide addresses preventing a secret from reaching a build log in the first place, and the required response when it does anyway. It does not cover the limits of automated secrets scanning after a secret is already exposed in source or history — see 'Automated Secrets Detection: What Scanners Catch and Miss' for that adjacent, distinct topic — and it deliberately does not repeat that article's content here.",
    "Exact masking behavior, secrets-manager integration, and federated short-lived credential support vary by CI platform and identity provider. This guide describes the pattern generically; verify the specific mechanisms your platform offers, including exactly what its masking feature does and does not match, before relying on any one of them.",
    "This guide does not cover the operational mechanics of a full incident response once a leaked credential's actual usage needs to be investigated (audit-log review, blast-radius assessment, downstream notification) — treat rotation as the first, non-negotiable step, and scope any deeper investigation separately based on what the credential could reach.",
  ],
  defensiveRecommendations: [
    "Never interpolate a secret directly into a command line that could be traced, echoed, or logged by the tool running it — read it from a file, an SDK call, or a structured injection mechanism instead.",
    "Scope verbose or debug modes away from the specific steps that handle a secret; don't disable them pipeline-wide, and don't leave a diagnostic env dump in a step after troubleshooting is done.",
    "Prefer structured secret injection (a secrets-manager reference resolved at point of use, a short-lived federated credential, a restricted-permission mounted file) over a shell-visible environment variable exported for the whole job.",
    "Register every secret value with the CI platform's masking feature as a baseline safety net, while treating masking as a backstop for what prevention missed, not a primary control — it reliably catches only an exact match against the registered value.",
    "Wrap calls that handle a secret with error handling that avoids surfacing the raw request or response in an exception message, where the library or framework allows it.",
    "Treat any secret confirmed or reasonably suspected to have appeared in a log as compromised immediately, and rotate it before doing anything else — including before finishing an investigation into how it got there.",
    "Do not treat log redaction or deletion as remediation on its own; it reduces future visibility, it does not undo a value that already left the pipeline's control.",
    "Record any control that could not be directly verified as UNVERIFIED rather than assuming a masking or injection mechanism behaves as intended because it was configured that way.",
  ],
  keyTakeaways: [
    "A secret reaches a build log through a small set of concrete mechanisms — verbose/debug output, an environment dump, an error message, or a tool echoing its own arguments — and each one is preventable at the source.",
    "CI-platform masking is a useful safety net that catches an exact match against a registered value; it is not a substitute for preventing the secret from being printed in the first place, and it commonly misses transformed or split values.",
    "Structured secret injection narrows what a broad environment dump or an unrelated step's debug output can expose, by not putting the secret somewhere broadly visible to begin with.",
    "A secret found in a log must be rotated immediately and treated as compromised — redacting or deleting the log reduces future visibility, but it does not undo an exposure that already happened.",
  ],
  references: [
    "OWASP Top 10 CI/CD Security Risks (CICD-SEC-6: Insufficient Credential Hygiene): https://owasp.org/www-project-top-10-ci-cd-security-risks/",
    "OWASP Secrets Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
    "NIST SP 800-53 Rev. 5, control IA-5, Authenticator Management: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    "CISA and NSA, Defending Continuous Integration/Continuous Delivery (CI/CD) Environments: https://www.cisa.gov/resources-tools/resources/defending-continuous-integrationcontinuous-delivery-cicd-environments",
    "GitHub Docs, Using secrets in GitHub Actions (masking behavior and limits): https://docs.github.com/actions/security-guides/using-secrets-in-github-actions",
  ],
  relatedSlugs: ["secrets-detection-scanner-limits", "least-privilege-for-pipeline-identities", "verifying-build-artifacts-before-deployment"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Visibility into every pipeline step that receives or handles a secret, and whether any of those steps run with a verbose or debug mode enabled.",
    "Access to the CI platform's secret-injection and masking/redaction configuration for the pipelines under review — the actual configuration, not a description of how it's assumed to work.",
    "Authority, or a documented path to someone with authority, to change how a secret is injected (structured injection versus a shell-visible environment variable or command-line argument) and to trigger rotation for a credential.",
    "A safe non-production path to test a masking, injection, or verbosity change before it is the only mechanism in place — a change that unexpectedly breaks a step's ability to authenticate, with no fallback, is how a legitimate deploy gets blocked.",
  ],
  procedure: [
    "Inventory every pipeline step that receives a secret: which credential, how it's currently injected (environment variable, command-line argument, structured mechanism), and which of the four leak mechanisms in this guide could plausibly apply to that step's own commands and dependencies.",
    "For each step, check whether it runs with a trace, verbose, or debug flag enabled — at the shell level, the CLI level, or both — and whether that flag is scoped to the whole job or to that specific step.",
    "Check whether any step, past or present, includes a diagnostic environment dump (added during troubleshooting and never removed) or logs the full output of a command that received a secret as an argument.",
    "Confirm every secret value that could appear in a step's output is registered with the CI platform's masking feature, and test what its matching behavior actually catches — an exact registered value — rather than assuming it also catches a transformed, encoded, or partial form of that value.",
    "Remove verbose/debug modes from steps that handle a secret, or scope them narrowly enough that they never wrap the specific command doing the authentication.",
    "Migrate secrets currently passed as command-line arguments or exported as job-wide environment variables to a structured injection mechanism where the platform supports it — a secrets-manager reference resolved at point of use, a short-lived federated credential, or a restricted-permission mounted file.",
    "Document and rehearse a rotation procedure to run immediately whenever a secret is confirmed or reasonably suspected to have appeared in a log, independent of whether the log entry itself has been redacted or deleted.",
  ],
  validation: [
    "Confirm, in a non-production or lab context, that a registered secret value does not appear in a completed job's log output under normal (non-verbose) operation.",
    "Confirm, in the same safe context, what happens when the same step runs with its verbose/debug mode deliberately re-enabled — whether the secret becomes visible, and whether platform masking actually catches it in that specific output format.",
    "Confirm a structured injection change doesn't leave the previous shell-visible environment variable or command-line argument as an unused but still-populated fallback that a later change could accidentally reintroduce into visible output.",
    "Confirm the documented rotation procedure actually invalidates the old credential value — not just issues a new one alongside it — by testing (in a non-production context) that the old value is rejected after rotation.",
    "Where a control could not be tested directly (no safe way to force a verbose-mode leak, no non-production environment available), record that explicitly as UNVERIFIED rather than assuming masking or injection behaves as intended because it was configured that way.",
  ],
  rollback: [
    "If scoping down a verbose/debug mode breaks a legitimate diagnostic use the inventory missed, do not restore the broad verbose mode as the fix — identify the specific diagnostic need and provide it a narrower way to get that information without wrapping the secret-handling command.",
    "If migrating a secret to structured injection breaks a step that depended on reading it from a shell-visible environment variable, add the specific narrow access that step needs through the new mechanism, rather than reverting to the previous broad environment-variable export.",
    "Keep a record of when each secret's injection mechanism and masking coverage changed, so a later reviewer can tell 'this was hardened deliberately, on this date' apart from 'this has always worked this way' — that distinction matters if a later incident needs to establish what was actually protected at a given point in time.",
  ],
};

const diagram: FlowDiagramSpec = {
  titleId: "secrets-build-log-diagram",
  title: "Keeping a fictional deploy step's secret out of the build log",
  desc: "A pipeline job requests a credential from a structured secret source, which feeds a deploy step authenticating with a token, which writes to a build log. Interactive: switch between the normal flow, where the token is injected through a structured mechanism and masked in output, and a failure mode showing what happens when a debug flag or an unmasked echo on that same deploy step causes the token to appear in plaintext in the log. Explore each node for details.",
  viewBox: "0 0 1040 340",
  failureLabel: "Secret printed in plaintext",
  caption:
    "Fictional pipeline: job trigger → structured secret source → deploy step (authenticating with a token) → build log. In the normal path, the deploy step reads the token through structured injection and the platform masks it in output. In the failure mode, the same deploy step runs with a debug flag enabled or echoes its own arguments unmasked, so the token reaches the log in plaintext. A successful deploy looks identical from the outside in both cases — the difference is entirely in what the step printed along the way.",
  motionDuration: 2700,
  mainPacketRoute: {
    d: "M160,100 H200 M390,100 H420 M630,100 H670",
    length: 130,
  },
  edges: [
    { id: "trigger-source", from: "job-trigger", to: "secret-source", d: "M160,100 H200", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "source-deploy", from: "secret-source", to: "deploy-step", d: "M390,100 H420", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "deploy-log", from: "deploy-step", to: "build-log", d: "M630,100 H670", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "deploy-exposed", from: "deploy-step", to: "exposed-log", d: "M525,150 V230", length: 80, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "job-trigger",
      label: "Pipeline job",
      x: 10,
      y: 70,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "A pipeline job starts and reaches the point where it needs to authenticate to a target as part of a deploy step. Whether the credential it uses ever becomes visible in the job's own output is decided by choices made in the step ahead, not by anything about the trigger itself.",
    },
    {
      id: "secret-source",
      label: "Structured secret source",
      x: 200,
      y: 55,
      w: 190,
      h: 90,
      activeIn: ["normal", "failure"],
      description:
        "A secrets-manager reference, a short-lived federated credential, or a restricted-permission mounted file — a structured mechanism that hands the deploy step exactly the credential it needs, resolved at the point of use, rather than sitting broadly in the job's inherited environment for every step to potentially expose.",
    },
    {
      id: "deploy-step",
      label: "Deploy step (authenticates with token)",
      x: 420,
      y: 50,
      w: 210,
      h: 100,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Deploy step — the highest-value node in this diagram: whether it runs verbosely, and whether it echoes its own arguments unmasked, decides which path the token takes",
      description:
        "Authenticates to a target using the injected token. This is the node this whole diagram is about: in the normal path, it reads the token through the structured source and the platform's masking replaces it in any output. In the failure path, the same step runs with a debug flag enabled, or echoes its own invocation without masking, and the token reaches the log unmasked.",
    },
    {
      id: "build-log",
      label: "Build log (masked)",
      x: 670,
      y: 65,
      w: 190,
      h: 70,
      role: "safe",
      activeIn: ["normal"],
      description:
        "The job's normal log output. In the normal path, the token never appears in it — either because the step never printed it, or because the CI platform's masking replaced the exact registered value with a placeholder before the log was stored.",
    },
    {
      id: "exposed-log",
      label: "Token printed in plaintext",
      x: 420,
      y: 230,
      w: 230,
      h: 70,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Token printed in plaintext — reachable only when the deploy step runs verbosely or echoes unmasked, visible only in failure mode",
      description:
        "Failure-mode only: the token appears in plaintext in the build log because the deploy step ran with a debug or trace flag enabled, or echoed its own invocation in a way the platform's masking didn't catch. From this point forward the token must be treated as compromised and rotated — redacting this log entry afterward does not undo the exposure, because the log may already be exported, cached, or viewed.",
    },
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Preventing Secrets from Entering Build Logs",
    slug: "preventing-secrets-from-entering-build-logs",
    summary:
      "The concrete mechanisms by which a secret ends up printed in a CI/CD build log — verbose output, environment dumps, error messages, a tool echoing its own arguments — how to prevent each one, and why a secret found in a log must be rotated, not just redacted.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["secrets-management", "ci-cd-pipelines", "security-control-validation"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
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
