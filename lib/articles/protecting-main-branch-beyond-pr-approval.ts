// Knowledge-base article: "Protecting the Main Branch Beyond Pull-Request
// Approval" (Bead securitycorp-source-4zl.54.2.4). Not added to
// lib/knowledge-content.ts yet — status stays "drafting" and every review
// record stays "pending" until the human owner (Ravi) runs privacy,
// technical, and publication review per docs/publication-safety-policy.md.
// Do not treat this file as published content.
//
// Differentiation from lib/articles/threat-modeling-cicd-pipeline.ts: that
// article teaches a general trust-boundary threat-modeling method across an
// entire pipeline (commit through deployment). This article is narrower and
// more concrete — it is about hardening one specific boundary, the merge
// gate into a protected main branch, and about why "one approval required"
// is not by itself a defensible version of that gate.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";
import type { ArticleVisual } from "../article-visuals.ts";

// Cover visual (Bead s41.9/s41.12 pilot) — real asset produced from the
// brief below via the OpenAI built-in image-generation tool in ChatGPT/
// Codex (external to this repo; the tool exposed no model identifier or
// seed), normalized with sharp@0.35.4 to exactly 1600x900 WebP. Specific
// to this article's actual thesis (layered gates, not one approval)
// rather than a generic "code review" or "git" image — the
// multi-layer-then-trunk composition is the one required idea,
// deliberately distinct from the existing diagram's precise technical
// layer labels. Still `reviewStatus: "pending"` — an agent must not
// self-approve; only a human reviewer (Ravi) promotes this to stage
// "reviewed"/"approved".
const coverImage: ArticleVisual = {
  stage: "asset",
  src: "/article-visuals/protecting-main-branch-beyond-pr-approval-cover.webp",
  visualType: "cover",
  alt: "Several converging paths passing through three sequential translucent gates before reaching a single cyan trunk line, with one shortcut path visibly stopped at the final gate",
  caption: "One approval is a layer. It is not the whole gate.",
  purpose: "Establish, before the prose, that this article is about a layered gate — not a single checkbox — so the 'required review is necessary but not sufficient' thesis lands with less friction.",
  width: 1600,
  height: 900,
  // Biased right, toward the final gate and the intercepted shortcut —
  // what the catalog-card thumbnail's object-fit:cover crop keeps
  // centered under the card's 16:9 aspect ratio; the full article-page
  // cover itself only ever scales (never crops), so focalPoint only
  // matters for the card. Set to (0.73, 0.5) rather than a rounder number
  // because the actual rendered artwork's final gate and interception
  // point sit slightly left of the brief's original target (independently
  // measured centroid ~0.71-0.75) — this describes the real asset, not
  // the brief's original aspirational framing. The current 1600x900
  // asset is itself exactly 16:9, matching .guide-card-thumb's own
  // aspect-ratio, so object-fit:cover currently has no crop to apply
  // regardless of this value — it exists as an accurate record for any
  // future alternate crop, not because it visibly changes today's card.
  focalPoint: { x: 0.73, y: 0.5 },
  brief: {
    articleSlug: "protecting-main-branch-beyond-pr-approval",
    readerTakeaway: "A defensible main-branch control is several layers working together, not any single one of them — including the review-approval layer alone.",
    whyThisHelps: "The article's own framing (\"required review is necessary but not sufficient\") is easy to nod along to in prose without feeling why — a visual showing a shortcut genuinely failing at a specific later layer makes the gap concrete.",
    visualType: "cover",
    placement: "After the lead paragraph, before the prerequisites box — the shared article-shell cover slot.",
    mustShow: [
      "Multiple (three or four) converging paths, representing different proposed changes",
      "A sequence of at least two distinct translucent/geometric gate structures the paths must pass through in order, before reaching one trunk line",
      "One path shown diverging toward a shortcut around the gates, visibly intercepted/stopped at the last gate rather than reaching the trunk",
      "Deep-navy field with restrained cyan for the successful trunk path and a muted violet or amber for the intercepted shortcut",
    ],
    mustNotShow: [
      "Any text, labels, GitHub/GitLab/platform logos, or literal UI chrome (buttons, checkmarks, PR numbers)",
      "A padlock, shield, or checkmark icon used as shorthand for \"security\"",
      "A hooded figure or any stock hacker imagery",
      "Any real repository name, username, or organization identifier",
    ],
    factualClaims: [
      {
        claim: "Required review alone does not prevent a later commit, a force-push history rewrite, or a privileged bypass — a layered combination (required review, required status checks bound to the exact commit, and ruleset enforcement with no bypass list) is what actually closes those gaps.",
        source: "This article's own keyTakeaways and mainContent (lib/articles/protecting-main-branch-beyond-pr-approval.ts), citing GitHub Docs on protected branches and rulesets.",
      },
    ],
    compositionNotes: "Wide 16:9 (matches ArticleFigure presentation=\"wide\"). Read left-to-right like the site's existing interactive diagrams, but purely atmospheric/geometric — no node labels, distinct from the article's own precise technical diagram further down the page.",
    mobileCropNotes:
      "The full article-page cover only ever scales down (app/globals.css's .article-figure img is width:100%;height:auto — never cropped), so the final gate and the trunk/intercepted-shortcut split must stay legible even scaled to a narrow phone width, not just at full size. The catalog-card thumbnail DOES crop (object-fit:cover); focalPoint above is set to (0.73, 0.5), biased toward the final gate, so the card's crop keeps that moment centered.",
    exportFormats: ["webp"],
    sizeBudgetKb: 200,
  },
  provenance: {
    source: "ai-generated",
    generatingModel: "OpenAI built-in image-generation tool in ChatGPT/Codex — the tool did not expose a narrower model identifier or version",
    prompt:
      'Use case: stylized-concept\nAsset type: SecurityCorp.net cybersecurity article cover, Pilot 2 of a coherent three-cover editorial series\nPrimary request: Create an original abstract cover for “Protecting Main Branch Beyond Pull-Request Approval” that communicates multiple sequential safeguards working together rather than one approval checkbox.\nScene/backdrop: Exact 16:9 wide landscape canvas, deep near-black navy gradient from #040609 to #070b12, subtle premium matte texture, spacious and calm.\nSubject: Three or four thin abstract paths enter from the left and converge while passing, in order, through three clearly distinct translucent geometric gate planes or angular thresholds. After the final gate, the permitted paths merge into one solid restrained cyan #00e5ff trunk continuing toward the right edge. One separate path diverges before the final gate and tries to arc around the sequence, but is visibly intercepted and terminated precisely at the final threshold; it never joins or reaches the cyan trunk. Render this stopped shortcut in muted/desaturated violet derived from #8b5cf6, optionally with the faintest restrained amber edge, without using any warning icon.\nStyle/medium: Refined geometric editorial concept art, restrained netrunner operations aesthetic, crisp translucent materials and subtle depth, atmospheric rather than a literal technical diagram.\nComposition/framing: Strong left-to-right flow on a wide 16:9 canvas; focal point near x=80%, y=50% at the final gate and stopped shortcut. Preserve a clean, readable silhouette so the last threshold, successful trunk, and intercepted shortcut remain distinguishable in a narrow mobile crop.\nLighting/mood: Controlled low-key illumination through translucent gate planes, restrained cyan and violet accents, no theatrical bloom.\nColor palette: #040609, #070b12, restrained #00e5ff cyan, muted/desaturated #8b5cf6 violet, rare #e8f1f8 neutral glints.\nConstraints: At least two and preferably three sequential gates. The shortcut must clearly stop at the last gate and never reach the trunk. No text, letters, words, numbers, labels, code, repository identifiers, logos, signatures, or watermark. No literal UI or security icons.\nAvoid: GitHub or GitLab styling, pull-request UI, merge buttons, checkmarks, padlocks, shields, magnifying glasses, hooded figures, terminals, keyboards, code screens, HUD frames, product branding, photorealism, excessive neon, lens flare, bloom, clutter.',
    // Seed: not exposed by the generating tool — not invented here.
    createdAt: "2026-09-04",
    license: "site-original-all-rights-reserved",
    editableSourceRef: "this coverImage.brief record",
    reviewStatus: "pending",
  },
};

const diagram: FlowDiagramSpec = {
  titleId: "main-branch-protection-diagram",
  title: "Layered protection for a protected main branch",
  desc: "A contributor's pull request passes through required review, required status checks, and branch ruleset enforcement before reaching the protected main branch. Interactive: switch between the normal path where every layer passes and a failure mode where a privileged bypass attempt skips required review and required status checks but is still rejected by branch ruleset enforcement, and explore each node's role.",
  viewBox: "0 0 1150 300",
  failureLabel: "Bypass attempt",
  caption:
    "Fictional repository: contributor → pull request → required review → required status checks → branch ruleset enforcement → main. In the failure mode, a bypass attempt skips required review and required status checks entirely; branch ruleset enforcement — which applies without exception to any actor and blocks force-pushes — is the layer that actually stops it from reaching main.",
  motionDuration: 2600,
  mainPacketRoute: {
    d: "M150,90 H170 M320,90 H340 M520,90 H540 M730,90 H750 M950,90 H970",
    length: 100,
  },
  edges: [
    { id: "contributor-pr", from: "contributor", to: "pull-request", d: "M150,90 H170", length: 20, kind: "main", activeIn: ["normal", "failure"] },
    { id: "pr-review", from: "pull-request", to: "required-review", d: "M320,90 H340", length: 20, kind: "main", activeIn: ["normal", "failure"] },
    { id: "review-checks", from: "required-review", to: "status-checks", d: "M520,90 H540", length: 20, kind: "main", activeIn: ["normal", "failure"] },
    { id: "checks-ruleset", from: "status-checks", to: "branch-ruleset", d: "M730,90 H750", length: 20, kind: "main", activeIn: ["normal", "failure"] },
    { id: "ruleset-main", from: "branch-ruleset", to: "main", d: "M950,90 H970", length: 20, kind: "main", activeIn: ["normal"] },
    { id: "bypass-ruleset", from: "bypass-attempt", to: "branch-ruleset", d: "M850,210 V125", length: 85, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "contributor",
      label: "Contributor",
      x: 10,
      y: 60,
      w: 140,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "Opens the pull request. Their access level matters beyond authorship: on many platforms, a contributor with elevated (administrator or maintainer) rights on the repository is, by default, exempt from at least one of the layers below unless that exemption is explicitly removed.",
    },
    {
      id: "pull-request",
      label: "Pull request",
      x: 170,
      y: 60,
      w: 150,
      h: 60,
      activeIn: ["normal", "failure"],
      description:
        "The record of a proposed change and the point every layer below evaluates. Its existence enforces nothing by itself — it is a proposal to merge, not a control on what may merge.",
    },
    {
      id: "required-review",
      label: "Required review",
      x: 340,
      y: 55,
      w: 180,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Required review — Layer 1: at least one approval is required, but an approval alone has known gaps",
      description:
        "Layer 1, and the layer most teams stop at. At least one approval is required before merge is offered. On its own this has real gaps: an approval can predate commits pushed to the branch afterward, and — unless explicitly configured otherwise — a repository administrator can be exempt from the requirement entirely.",
    },
    {
      id: "status-checks",
      label: "Required status checks",
      x: 540,
      y: 55,
      w: 190,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Required status checks — Layer 2: checks must pass against the exact commit being merged, not just the branch in general",
      description:
        "Layer 2. A defined set of checks — build, tests, and where configured, commit-signature verification — must report success against the exact commit being merged, and the branch is typically required to be up to date with its base first. This is what stops a commit pushed after approval from merging on the strength of an old, now-stale review.",
    },
    {
      id: "branch-ruleset",
      label: "Branch ruleset enforcement",
      x: 750,
      y: 55,
      w: 200,
      h: 70,
      role: "boundary",
      activeIn: ["normal", "failure"],
      focusableLabel: "Branch ruleset enforcement — Layer 3: applies to every actor with no bypass list, and blocks force-push and history rewrite",
      description:
        "Layer 3, and the decisive layer for this diagram's failure mode. Force-pushes and history rewrites on the protected branch are blocked, and the ruleset is configured with no bypass list, so it applies equally to a repository administrator and an ordinary contributor. This is what determines whether an attempted shortcut — a direct push, a forced history rewrite, or an administrator override — actually succeeds, regardless of what happened at the layers above.",
    },
    {
      id: "main",
      label: "Protected main",
      x: 970,
      y: 60,
      w: 150,
      h: 60,
      role: "safe",
      activeIn: ["normal"],
      description:
        "The protected branch. In the normal path, a change reaches it only after satisfying required review, required status checks tied to its exact commit, and branch ruleset enforcement — not after satisfying any single one of those layers alone.",
    },
    {
      id: "bypass-attempt",
      label: "Bypass attempt",
      x: 750,
      y: 210,
      w: 200,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Bypass attempt — a privileged or compromised identity tries to merge or force-push directly, skipping required review and required status checks",
      description:
        "Failure mode only: a privileged or compromised identity attempts to push directly or force-push rewritten history onto the protected branch, skipping required review and required status checks entirely rather than satisfying them. If required review were the only enforced layer — or if the ruleset exempted administrators — this would succeed. With force-push blocked and no bypass actors permitted, branch ruleset enforcement rejects the attempt regardless of the actor's privilege level.",
    },
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Administrative access (or a documented change request to whoever holds it) to the repository's branch protection or ruleset configuration — this guide describes what a defensible configuration contains, not how to request access to change it.",
    "A clear inventory of who currently holds elevated (administrator or maintainer) access to the target repository, since several of the gaps below matter specifically for privileged identities, not ordinary contributors.",
    "Team agreement on what 'required' actually means for status checks — a check that can be marked non-blocking, skipped, or is simply missing from the required list provides no more assurance than not having it at all.",
    "Willingness to test the configuration by attempting the exact bypasses it claims to prevent, in a lab or non-production repository, rather than assuming a configuration screen's label does what it says.",
  ],
  procedure: [
    "Start from the assumption that required review is necessary but not sufficient, and enumerate what it does not cover on its own: commits pushed to the branch after approval was granted, force-pushes that rewrite history the reviewer never saw, and any bypass path available to a privileged identity.",
    "Add required status checks and pin them to re-run against the exact commit being merged, not merely 'somewhere on this branch.' Require the branch to be up to date with its base before merge is offered, so a stale branch cannot merge on the strength of checks that ran against an earlier, different base.",
    "Where commit authorship needs to be verifiable, require signed commits and reject unsigned ones at the ruleset level rather than treating signature verification as informational metadata a reviewer might or might not notice.",
    "Block force-pushes and branch deletion on the protected branch, and require linear history if the team's workflow depends on merge commits or rebases behaving predictably. A branch that can be rewritten after review invalidates everything the review layer was supposed to guarantee.",
    "Remove bypass exemptions for privileged identities. A classic branch-protection rule that leaves administrators exempt from its own requirements, or a ruleset with a non-empty bypass list, quietly reintroduces the single-layer failure mode this guide is about — for exactly the accounts with the most reach if compromised.",
    "Where the CI configuration itself lives inside the repository, treat a change to the required-workflow definition as a change that needs the same scrutiny as any other protected-branch change — a contributor should not be able to weaken or remove a required check from within the same pull request that check is supposed to be gating. A required workflow enforced centrally, outside the reach of an individual repository's own contributors, closes this specific gap more reliably than a workflow file that branch's own contributors can edit.",
    "Document the resulting layered configuration — which checks are required, whether commit signing is required, whether the bypass list is empty, whether force-push is blocked — somewhere a reviewer can audit later without re-deriving it from the platform's configuration screens each time.",
  ],
  validation: [
    "Confirm required status checks are enforced against the exact commit being merged, not merely present in the repository: attempt, in a lab or non-production repository, to merge a pull request whose latest commit has not yet reported a passing check, and confirm the platform refuses.",
    "Confirm the branch rejects a force-push attempt, including from an account with elevated repository permissions, and confirm the rejection is an actual block rather than a warning that can be dismissed.",
    "Confirm no bypass actor, exemption, or blanket administrator opt-out is configured — enumerate the effective bypass list directly from the configuration rather than trusting a policy document that says bypass isn't allowed.",
    "Confirm that a new commit pushed to an already-approved pull request requires required status checks to pass again on that new commit before merge is offered, and confirm separately whether the platform also re-requires review on that push — this varies by configuration and is worth confirming explicitly rather than assumed.",
    "Where a control could not be exercised directly (no lab environment, no authorized change to attempt a real bypass), record that limitation explicitly as UNVERIFIED rather than treating a configuration screen's description as proof the control holds.",
  ],
  rollback: [
    "If tightened branch ruleset enforcement blocks a legitimate emergency-fix workflow — a genuine production incident that needs a fast, reviewed merge — have a documented, time-boxed emergency path defined in advance, such as a narrowly scoped and reviewed-after-the-fact exception, rather than disabling the ruleset or reintroducing a standing bypass actor under pressure.",
    "If a required status check turns out to be flaky rather than meaningfully protective, fix or replace the check; do not quietly drop it from the required list, since that silently returns the branch to a weaker layer without anyone deciding that on purpose.",
    "Keep a record of any period during which a layer was relaxed and why, so a later reviewer can distinguish 'this was never enforced' from 'this was temporarily relaxed for a documented reason and then restored.'",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Protecting the Main Branch Beyond Pull-Request Approval",
    slug: "protecting-main-branch-beyond-pr-approval",
    summary:
      "Why a single required approval is not by itself a defensible main-branch control, and how required status checks, force-push protection, and branch ruleset enforcement close the gap.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["ci-cd-pipelines", "supply-chain-security", "access-control"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-08-30",
    lastReviewedAt: "2026-08-30",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Codex", reviewedAt: "2026-08-30" },
    technicalReview: { status: "approved", reviewer: "Codex", reviewedAt: "2026-08-30" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-08-30" },
  },
  sections: {
    executiveSummary: [
      "Most teams treat 'require one approval before merge' as their main-branch control and stop there. It is a necessary layer, but it is not a sufficient one: it says nothing about whether the commits actually being merged are the ones that were reviewed, whether the branch's history can be rewritten after approval, or whether a privileged identity can skip the requirement entirely. This guide is about the merge gate specifically — the point where a change becomes part of the protected branch — and about what a defensible, layered version of that gate actually contains.",
      "This is a narrower and more concrete companion to 'Threat Modeling a CI/CD Pipeline,' which covers a general method for threat-modeling an entire pipeline's trust boundaries from commit to deployment. This guide does not repeat that method; it applies a layered-defense lens to one specific boundary — required review, required status checks tied to the exact commit, and branch ruleset enforcement — using a fictional repository throughout. No real repository, credential, or production configuration is described.",
    ],
    whatYouWillLearn: [
      "Why 'one approval required' has real, well-documented gaps even when it is correctly configured as far as it goes.",
      "How required status checks tied to an exact commit close the gap left by commits pushed after approval.",
      "Why force-push and history-rewrite protection matters even on a branch that already requires review.",
      "How administrator or maintainer bypass exemptions quietly undermine every other layer, and how to remove them.",
      "The practical difference between a platform's older, per-branch protection rules and a newer, layered ruleset model — and why the distinction affects what 'protected' actually means.",
    ],
    intendedAudience: [
      "Developers who want to understand what their repository's branch protection setting actually guarantees, and what it does not.",
      "DevOps practitioners responsible for configuring or auditing a repository's merge gate.",
      "Security engineers reviewing whether a team's main-branch control is defensible, not just present.",
    ],
    prerequisites: [
      "Basic familiarity with pull-request-based development (branches, review, merge).",
      "No specific platform expertise is assumed; the concepts here are described generically and apply across most modern Git hosting platforms, with concrete examples used only for illustration.",
      "Access, or the ability to request access, to a repository's protection settings is useful for applying this guide but not required to read it.",
    ],
    problem: [
      "'Require pull-request approval before merge' is the first main-branch control almost every team configures, and for many teams it is also the last one they configure. Treated as sufficient on its own, it leaves several gaps that do not show up until someone — or something — actually exercises them: a reviewer approves a pull request, and a further commit is pushed to the same branch afterward without triggering a fresh review; a branch is force-pushed, rewriting history the reviewer approved into history they never saw; or a repository administrator, exempted from the review requirement by default in some configurations, merges directly.",
      "None of these require a sophisticated attacker. A compromised contributor account, a misconfigured automation identity with write access, or simply a rushed human under deadline pressure can exercise any of them against a branch whose only enforced layer is 'someone clicked approve at some point.' The fix is not a different single control — it is treating the merge gate as a set of layers, each closing a specific gap the others leave open.",
    ],
    threatModel: [
      "Assets: the integrity of the main branch's commit history, the provenance of whatever is actually merged into it, and — downstream — the trustworthiness of anything built or deployed from that branch.",
      "Layers, in the order this guide addresses them: required review (is at least one approval recorded), required status checks (do the defined checks pass against the exact commit being merged, not just the branch generally), and branch ruleset enforcement (does the branch reject force-pushes and history rewrites, and does the enforcement apply to every actor with no bypass list).",
      "Representative threats: a reviewer approves a pull request, and a materially different commit is pushed afterward and merged without a fresh review or a fresh check run. A branch is force-pushed after approval, replacing reviewed history with unreviewed history. A repository administrator, exempt from the review requirement by a configuration default nobody revisited, merges directly during an incident and the exemption stays in place afterward. A required check's definition lives in the same repository the check is supposed to gate, and a pull request modifies or disables it in the same change it is meant to be checking.",
      "The interactive diagram accompanying this article shows the failure case concretely: a privileged or compromised identity attempts to skip required review and required status checks entirely, going straight for a direct push or a forced history rewrite. Branch ruleset enforcement — applied without exception and with no bypass list — is the layer that decides whether that attempt actually reaches main.",
    ],
    mainContent: [
      "Layer 1 — required review — is where most teams start and, too often, where they stop. At minimum it requires at least one approving review before a merge is offered. Configured correctly, this is a real control: it means a second set of eyes examined the diff. Configured as the only layer, its gaps become the whole story. An approval is granted against whatever commits exist on the branch at that moment; nothing about the approval itself re-validates automatically if the branch changes afterward, unless the platform is separately configured to require it. And unless a repository's protection settings explicitly say otherwise, an administrator or maintainer role frequently carries an implicit exemption from the review requirement — a detail that matters precisely because those are the accounts with the broadest reach if compromised.",
      "Layer 2 — required status checks — closes the most common version of the first gap. A defined set of checks (a build, a test suite, and where the platform supports it, verification that commits are signed) must report success against the exact commit about to be merged, and the branch is usually required to be up to date with its base branch first. This is the layer that prevents 'the pull request was approved, then quietly changed, then merged anyway' — because the new commit has to pass its own checks, not inherit the approval or the check results of an earlier one. Commit signing, where required and enforced (rather than merely displayed as a badge), adds a related but distinct guarantee: that the commit's claimed author is verifiable, independent of whether its contents passed review.",
      "Layer 3 — branch ruleset enforcement — is where the two most consequential gaps get closed: force-push protection and bypass exemptions. A branch that blocks force-pushes and history rewrites means an already-approved, already-checked set of commits cannot be silently replaced with a different set after the fact; the history a reviewer saw is the history that merges. And a ruleset with no bypass list — one that applies identically to a repository administrator and to the newest contributor — is what actually determines whether a privileged-account shortcut succeeds. This is the layer most likely to be left weaker than intended, because it is usually configured once, rarely revisited, and its exemptions tend to accumulate quietly (an administrator added to a bypass list 'temporarily' during an incident, and never removed).",
      "Two mechanisms are worth naming specifically because they are commonly conflated. Many Git hosting platforms distinguish between an older, per-branch protection-rule model — typically a single set of toggles applied to one branch pattern, including an explicit 'include administrators' style setting that is easy to leave unchecked — and a newer ruleset model that layers multiple named rules, can target several branches by pattern at once, and is built around an explicit, auditable bypass list rather than a binary include/exclude toggle. Neither model is automatically the safe one; a ruleset with a generous bypass list is no better than a classic rule with administrators exempted. The distinction matters because reviewing 'is this branch protected' now requires reading the actual rule contents, not just confirming that some protection mechanism exists.",
      "One further gap is worth calling out because it is easy to miss: if the required checks' own definitions live inside the repository being protected, a pull request can, in principle, modify or weaken those definitions in the same change the checks are meant to be evaluating. A required workflow enforced from outside the individual repository's control — where the hosting platform supports that — removes this specific blind spot; where it isn't available, treating any change to check definitions as requiring its own heightened review is the next best mitigation.",
      "Put together, the layers are cumulative, not redundant: required review catches what an automated check cannot (does this change make sense, is it the right approach); required status checks catch what a human reviewer easily misses (does it actually build, does it pass its tests, is the commit signed) and specifically catch late changes to the branch; branch ruleset enforcement catches what neither of the other two layers can — an attempt to bypass them altogether, whether by rewriting history or by exploiting a privileged account's exemption.",
    ],
    validationEvidence: [
      "This article describes a configuration pattern and a fictional illustrative repository; it does not reproduce a specific implementation or a completed audit against a real system. Its evidence state is UNVERIFIED, and the recommendations should be treated as a starting checklist to adapt and then verify against your own repository's actual configuration, not as a validated result.",
    ],
    limitations: [
      "This guide addresses one branch's merge gate. It does not cover multi-branch promotion flows (feature to staging to main), environment-specific deployment approval, or the security of the build runner itself once a commit does merge — 'Threat Modeling a CI/CD Pipeline' covers the broader pipeline picture this guide deliberately does not repeat.",
      "Exact feature names, defaults, and availability (for example, which tier or plan includes a bypass list, centrally enforced required workflows, or signed-commit enforcement at the ruleset level) vary by platform and change over time. Verify the current behavior of your specific platform before relying on any single mechanism described here.",
      "This guide assumes a single protected main branch is the goal. Some teams intentionally use a more complex branching model; the same layered principle (review, status checks tied to an exact commit, and enforcement with no bypass) still applies to whichever branch or branches actually gate a release, but the mapping onto this guide's fictional example will need adjusting.",
    ],
    defensiveRecommendations: [
      "Require status checks against the exact commit being merged, and require the branch to be up to date with its base before merge is offered.",
      "Require signed commits where authorship verification matters, and enforce it at the branch level rather than displaying it only as informational.",
      "Block force-pushes and branch deletion on every branch that gates a release, not only on main.",
      "Remove administrator and maintainer bypass exemptions; if an emergency path is genuinely needed, make it a documented, logged, time-boxed exception rather than a standing exemption.",
      "Prefer required-check definitions enforced from outside the repository they protect, where the platform supports it, so a pull request cannot weaken the check that is supposed to be gating it.",
      "Review the effective bypass list directly from the configuration on a recurring cadence — exemptions added during an incident have a way of outliving the incident.",
      "Document the full layered configuration in one place a reviewer can audit without re-deriving it from the platform's settings screens each time.",
    ],
    keyTakeaways: [
      "Required review is necessary but not sufficient: it does not by itself prevent late commits, force-push history rewrites, or privileged bypass.",
      "Required status checks tied to the exact commit being merged close the 'approved, then quietly changed' gap.",
      "Branch ruleset enforcement with no bypass list is what actually stops a privileged or compromised identity from skipping the other layers.",
      "A defensible main-branch control is the combination of these layers, not any single one of them — and it is worth auditing periodically, since bypass exemptions and disabled checks tend to accumulate quietly rather than being removed all at once.",
    ],
    references: [
      "GitHub Docs, About protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches",
      "GitHub Docs, About rulesets: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets",
      "SLSA (Supply-chain Levels for Software Artifacts): https://slsa.dev/",
      "OWASP Top 10 CI/CD Security Risks: https://owasp.org/www-project-top-10-ci-cd-security-risks/",
    ],
  },
  module: module_,
  diagram,
  coverImage,
};
