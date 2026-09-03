// Knowledge-base article: "Hardening a Private Gitea Server" (Bead
// securitycorp-source-4zl.15). Published 2026-09-03 under Ravi Teja
// Thota's standing publication authorization after real review of
// citations, safety, and evidenceState honesty — including specific
// attention to this article's proximity to this repo's own real Gitea
// remote — per docs/publication-safety-policy.md.
//
// CRITICAL SAFETY NOTE: this repository's own canonical git remote is a
// private, self-hosted Gitea instance. Nothing below describes that real
// instance. Every hostname, username, organization, IP range, and
// directory path in this article is fictional or drawn from RFC 5737 /
// RFC 2606 documentation-safe ranges (192.0.2.0/24, 198.51.100.0/24,
// 203.0.113.0/24, *.example.com). The fictional organization used
// throughout is "Meridian Labs" and its fictional Gitea instance is
// git.example.com — neither refers to any real entity.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { GuideModule } from "../knowledge-content-types.ts";

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "Administrative access to the Gitea instance's `app.ini` configuration and its site-administration panel — this guide describes what a defensible configuration contains, not how to request access to change it.",
    "Enough visibility into the current deployment to answer concrete questions before starting: is 2FA enforced or merely available, are SSH keys scoped per-purpose or shared, is the instance reachable directly on the internet or only through a reverse proxy, and how far behind the latest patched release is the running version.",
    "A working backup and restore path already in place, or the willingness to build one before making other changes — several steps below (patch upgrades, permission changes) are safer to attempt once a tested restore path exists.",
    "Authority, or a documented path to someone with authority, to change instance-wide settings (`[security]`, `[server]`, `[webhook]` sections of `app.ini`), not only individual repository settings.",
  ],
  procedure: [
    "Enforce two-factor authentication instance-wide rather than leaving it opt-in. Gitea supports TOTP and WebAuthn-based hardware keys, configured per-user under the account's Security settings; since Gitea 1.24, the `[security]` section's `TWO_FACTOR_AUTH` option can be set to `enforced` to require it for every account rather than relying on individual users to opt in.",
    "Move every account off password-only Git-over-HTTP access. With 2FA enabled, Gitea's HTTP interface no longer accepts a bare password for Git operations; issue scoped personal access tokens instead, and prefer SSH with per-user keys for interactive Git operations where practical.",
    "Move from shared or long-lived SSH keys toward one key per person and per automated purpose. A deploy key tied to one repository and one automation should never double as a person's own login key: if the automation is retired but the key isn't revoked, or if the person's key is compromised, the blast radius should stay confined to what that specific key was scoped for.",
    "Scope deploy keys to read-only wherever the consuming automation only needs to fetch source, and reserve write-capable deploy keys for the specific pipelines that must push (for example, a release automation publishing tags). Review the deploy-key list on any repository with automation attached and confirm each entry's access level matches what it's actually used for, not what was convenient when it was created.",
    "Verify every configured webhook target validates the delivery's signature before acting on it, not merely that the request arrived from a plausible-looking source. Configure a webhook secret and confirm the receiving endpoint checks the `X-Gitea-Signature` (or `X-Hub-Signature-256`, if using GitHub-compatible payloads) header with a constant-time HMAC comparison against the raw request body — not against a value it expects to find inside the JSON payload, since current Gitea versions no longer send the secret there.",
    "Separate webhook authentication concerns: use the webhook secret to prove the delivery came from this Gitea instance and wasn't tampered with in transit, and use a distinct `Authorization` header, configured separately, if the receiving endpoint also needs to authenticate the caller as a specific identity. Treat these as two different guarantees rather than assuming one implies the other.",
    "Replace ad hoc repository collaborator lists with organization teams scoped to specific units (Code, Issues, Wiki, Actions, and so on) and, where possible, to specific repositories rather than every repository the organization owns. Audit the organization's Owner team membership specifically — it is the one team whose members can change any other team's permissions, and membership in it tends to accumulate over time without being deliberately reviewed.",
    "Put the instance behind a reverse proxy for its web and API traffic (HTTPS on a single public listener, TLS terminated at the proxy) rather than exposing Gitea's own HTTP listener directly. Where SSH-based Git access is also needed from outside a trusted network, treat the SSH listener as a separate exposure decision from the web interface — a reverse proxy in front of the web UI does not, by itself, add any protection to the SSH port, since SSH is not HTTP traffic a typical reverse proxy terminates.",
    "Establish a patch cadence instead of upgrading only when a problem forces the question. Subscribe to Gitea's release announcements and security advisories, keep a record of the currently deployed version against the latest patched release, and treat a widening gap between the two as a finding to act on rather than a fact to note and move past.",
    "Build and test a backup procedure that captures the repository data, the Gitea database, any attached object storage (LFS objects, package registry artifacts, avatars), and the `app.ini` configuration together — a backup of only the Git repository data is not sufficient to restore a working instance, and a backup that has never been restored is unverified by definition.",
    "Turn on and route Gitea's application-level logs (and, where the deployment terminates TLS at a separate reverse proxy, that proxy's access logs) somewhere they'll actually be reviewed — a log that is generated but never read provides audit trail in name only. At minimum, retain enough log history to reconstruct who authenticated, when, and what administrative actions (permission changes, webhook edits, SSH key additions) were taken.",
  ],
  validation: [
    "Confirm 2FA enforcement actually blocks an account that hasn't configured it, rather than merely displaying a prompt that can be dismissed: attempt, in a lab or non-production instance, to sign in as a fresh account with `TWO_FACTOR_AUTH=enforced` set, and confirm the account is required to enroll before it can do anything else.",
    "Confirm a read-only deploy key genuinely cannot push: attempt, in a lab environment, to push a commit using a deploy key configured as read-only, and confirm the push is rejected rather than merely undocumented as a capability.",
    "Confirm webhook signature verification is actually enforced on the receiving end, not just configured on the Gitea side: send a delivery with a deliberately incorrect signature (or none) from a lab instance and confirm the receiving endpoint rejects it rather than processing the payload anyway.",
    "Confirm the effective permissions of a representative account by checking what that account can actually do (which repositories, which units, read versus write versus admin) rather than reading the team configuration and assuming it matches — permission models with unit-level granularity are easy to get subtly wrong.",
    "Confirm the SSH port's actual exposure by checking from outside the network it's meant to be reachable from (a lab or authorized external vantage point), rather than trusting a firewall rule's stated intent.",
    "Perform an actual test restore of the backup — repository data, database, and configuration together — into a separate lab environment, and confirm the restored instance is functional, not merely that the backup job reported success.",
    "Where a control could not be tested directly (no lab environment, no authorized way to force a failure), record that explicitly as UNVERIFIED rather than assuming it holds because a configuration screen describes it that way.",
  ],
  rollback: [
    "If enforcing 2FA locks out an account that genuinely needs emergency access before it can enroll (a service account, a break-glass administrator), have a documented, logged, time-boxed exception process defined in advance rather than disabling enforcement instance-wide under pressure.",
    "If moving automation from a shared SSH key to individually scoped deploy keys breaks a pipeline that assumed broader access than it actually needed, grant that specific pipeline the narrow additional scope it requires and record why — rather than reverting to a shared key that quietly restores the original blast radius for every consumer of it, not just the one that needed the exception.",
    "If tightening webhook signature verification breaks an existing integration that was never checking the signature, fix the integration rather than removing the secret — an integration that ignores signatures was already accepting unauthenticated deliveries, whether or not that had caused a visible problem yet.",
    "Keep a record of any period during which a control was intentionally relaxed (2FA exception, broader deploy-key scope, direct exposure during a migration) and why, so a later reviewer can distinguish a deliberate, time-boxed exception from a control that was simply never enforced.",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Hardening a Private Gitea Server",
    slug: "hardening-a-private-gitea-server",
    summary:
      "A self-hosted Gitea instance is both source-of-truth for code and, once Actions or webhooks are involved, part of the supply chain. Concrete hardening steps for authentication and enforced 2FA, SSH and deploy-key scoping, webhook secret verification, repository and organization access control, patch cadence, backup, and network exposure — illustrated with a fictional organization throughout.",
    pillar: "build-securely",
    primaryCategory: "cicd-supply-chain-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["self-hosted", "access-control", "authentication", "secrets-management"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 15,
    publishedAt: "2026-09-03",
    updatedAt: "2026-09-03",
    lastReviewedAt: "2026-09-03",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: false,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  },
  sections: {
    executiveSummary: [
      "A self-hosted Gitea instance is easy to think of as 'just where the code lives' — a convenience compared to a hosted platform, run because a team wants to keep its source under its own control. That framing understates what the instance actually is once anything real depends on it: the authoritative copy of every repository it hosts, the identity provider deciding who can read or write to each of them, the source of any webhook deliveries that trigger downstream automation, and — if Gitea Actions or an external CI system is wired to it — a component of the software supply chain itself. A Gitea instance that is easy to reach, thinly authenticated, or running months behind its latest patched release is a materially different risk than one that has been deliberately hardened, even though both 'work' day to day.",
      "This guide covers concrete, verifiable hardening steps across six areas: authentication and enforced two-factor authentication, SSH and deploy-key scoping, webhook secret verification, repository and organization access control, patch and backup cadence, and network exposure through a reverse proxy rather than direct exposure. Every hostname, username, organization, and address below is fictional — the running example throughout is a fictional organization, Meridian Labs, running a fictional Gitea instance at `git.example.com`. No detail here describes any real, specific deployment.",
    ],
    whatYouWillLearn: [
      "How to move two-factor authentication from optional to instance-wide enforced, and what changes for Git-over-HTTP access once it is.",
      "Why a shared or long-lived SSH key is a worse default than one key scoped to one person or one automated purpose, and how deploy-key read/write scoping limits what a leaked key is worth.",
      "How Gitea webhook signature verification actually works (HMAC-SHA256 over the raw request body, delivered via a signature header — not a secret field inside the payload) and what it does and doesn't guarantee on its own.",
      "How to structure repository and organization access using teams and unit-level permissions instead of ad hoc collaborator lists, and why Owner-team membership specifically deserves periodic review.",
      "Why direct exposure of the instance's own HTTP listener is a worse default than a reverse proxy in front of it, and why that same reverse proxy does not automatically cover SSH exposure.",
      "Why a backup that has never been restored, and a log that is generated but never reviewed, both provide less assurance than they appear to.",
    ],
    intendedAudience: [
      "Practitioners running a self-hosted Gitea instance for a team, a homelab, or a small organization who want a concrete hardening checklist rather than a general 'secure your server' reminder.",
      "DevOps practitioners responsible for provisioning or maintaining Gitea as part of a build or release pipeline.",
      "Security engineers assessing whether a self-hosted Git platform's configuration is defensible, not just functional.",
    ],
    prerequisites: [
      "Basic familiarity with Git hosting concepts: repositories, collaborators, organizations, and webhooks.",
      "Administrative access, or a documented path to someone who has it, to the target Gitea instance's configuration.",
      "No prior Gitea-specific administration experience is assumed; this guide explains the relevant mechanisms as it goes, with citations to Gitea's own documentation for anything version-specific.",
    ],
    problem: [
      "It's easy to treat a self-hosted Gitea instance the way you'd treat any other internal tool: stand it up, add a login, move on. That framing misses that the instance is simultaneously an authentication system (who can log in and how strongly that's verified), an authorization system (who can read or write which repository), a secrets-adjacent system (webhook secrets, deploy keys, personal access tokens all live inside it), and — the moment anything downstream trusts a webhook delivery or a push from it — part of the supply chain feeding that downstream system.",
      "None of the individual gaps that follow from under-hardening are exotic. A password-only login without 2FA is vulnerable to credential stuffing like any other login. A shared deploy key used across three unrelated pipelines means compromising the least-important one exposes the other two. A webhook receiver that trusts any POST request that arrives at its endpoint, without checking a signature, will act on a forged delivery exactly as readily as a real one. None of these require a sophisticated attacker — they require the instance to have been configured for convenience once, and never revisited.",
    ],
    threatModel: [
      "Assets: the source code and history in every hosted repository, the credentials Gitea itself manages (password hashes, personal access tokens, SSH and deploy keys, webhook secrets), the instance's own admin accounts, and — where Gitea Actions or an external CI system is wired to it — anything that trusts a push or a webhook delivery as a trigger.",
      "The central trust decision: anyone who can authenticate to the instance, or who can present a valid deploy key or access token, is trusted to act within whatever scope that credential carries. A credential broader than the actor actually needs — an account without 2FA, a deploy key with write access where read would do, an Owner-team membership nobody revisited — is exactly as usable to an attacker who obtains it as to its legitimate holder.",
      "Representative threats: a password-only account is compromised through credential stuffing or reuse from an unrelated breach, and nothing beyond that password stands between the attacker and everything the account can reach. A deploy key scoped more broadly than its automation needs is exfiltrated from that automation's environment and used to push to repositories the automation never actually touches. A webhook receiver that doesn't verify the signature header processes a forged delivery as if it were a real push event, triggering downstream automation on attacker-controlled input. An account accumulates Owner-team membership during some past project and is never removed, so a later compromise of that one account carries organization-wide administrative reach. The instance runs for months past a patched release addressing a known issue, because nobody owns the decision to schedule the upgrade.",
      "None of these threats require the instance to be reachable from the open internet, though direct exposure without a reverse proxy in front of it does widen who can attempt any of them — see the network-exposure section below for what a reverse proxy does and does not cover.",
    ],
    mainContent: [
      "**Authentication and enforced 2FA.** Gitea supports both TOTP-based authenticator apps and FIDO/WebAuthn hardware keys for multi-factor authentication, configured per account from the Security tab of that account's settings. Left as opt-in, 2FA only protects the accounts whose owners bothered to enable it — in practice, usually a minority. Since Gitea 1.24, the `[security]` section of `app.ini` accepts `TWO_FACTOR_AUTH = enforced`, which requires every account to have MFA configured before it can do anything else on the instance, closing that gap instance-wide rather than account-by-account. One real workflow consequence is worth planning for: Gitea's Git-over-HTTP interface does not support MFA directly, so once 2FA is enabled on an account, a bare password stops working for `git push`/`git pull` over HTTP — the account needs a scoped personal access token (or SSH) instead. That's a deliberate tradeoff, not a bug: a personal access token is easier to scope and revoke than a password, and moving off password-based Git access is itself a hardening step worth making regardless of 2FA.",
      "**SSH and deploy-key scoping.** The default failure mode here isn't a missing key — it's a key that does more than it needs to. A single SSH key reused across a person's interactive login and three unrelated automated pipelines means any one of those four things being compromised puts all four at risk. Prefer one key per person for interactive access, and separate, repository-scoped deploy keys for automation. Gitea's deploy keys and branch-protection allowlisting distinguish read-only from write-capable access, and a protected branch's push allowlist can name specific deploy keys explicitly rather than trusting anything with repository access. In practice: an automation that only needs to fetch source (a build step, a mirroring job) should be issued a read-only deploy key, full stop — a write-capable key is justified only for the specific pipeline that actually needs to push, such as a release-tagging job, and even then it should be scoped to that one repository rather than reused across several.",
      "**Webhook secret handling.** Gitea signs webhook deliveries with HMAC-SHA256: the `X-Gitea-Signature` header (or, for GitHub-compatible payloads, `X-Hub-Signature-256`) carries a digest computed over the raw request body using the configured webhook secret. Two mistakes are common on the receiving end. The first is checking for a `secret` field inside the JSON payload itself — that pattern shows up in older examples, but current Gitea versions do not send the secret in the payload body, so a receiver looking for it there is checking nothing. The second is parsing the JSON body before verifying the signature, which means the verification (if it happens at all) runs against a re-serialized copy of the payload rather than the exact bytes that were signed; verify against the raw body first, before any parsing or modification. Gitea also supports a separate, independently configured `Authorization` header for endpoints that need to authenticate the caller as a specific identity — that's a distinct guarantee from HMAC signature verification (integrity of this specific delivery) and shouldn't be assumed to substitute for it, or vice versa.",
      "**Repository and organization access control.** Gitea's permission model is unit-based: a repository's Code, Issues, Wiki, Pull Requests, and Actions (among others) can each carry different access levels, and organization teams are assigned permissions per unit rather than one blanket role. That granularity is useful, but it also means an access review has to check what a team can actually do per unit, not just what its name implies. The one membership worth reviewing specifically, on a recurring cadence rather than once, is the organization's Owner team: its members can change every other team's permissions and repository visibility, which makes it the highest-leverage account set in the organization if any one of its members is compromised. A general team scoped to specific repositories and specific units — say, write access to Code and Issues on three named repositories, and nothing else — is a materially smaller target than blanket organization-wide collaborator access, and it's usually not meaningfully less convenient to set up.",
      "**Network exposure — reverse proxy, not direct exposure.** Running Gitea's own HTTP listener directly reachable, with TLS (if any) terminated by Gitea itself, works, but it means every request — well-formed or not — reaches Gitea's own request-handling code first. Placing a reverse proxy in front (terminating TLS there, forwarding to Gitea over a private network path) adds a layer that can rate-limit login attempts, restrict which paths are reachable at all, and centralize where certificate management and access logging happen, independent of Gitea's own configuration. One gap worth naming explicitly: a reverse proxy sitting in front of Gitea's web UI and API does nothing for the SSH listener, if SSH-based Git access is also offered — SSH isn't HTTP traffic a typical reverse proxy terminates, so that exposure decision (open to a trusted network only, gated behind a VPN, or accepted as internet-reachable with its own hardening) has to be made separately rather than assumed to be covered by 'we're behind a proxy.'",
      "**Patch cadence, backup, and audit logging.** These three are grouped because they share the same failure mode: each looks fine until the moment it's actually needed, and by then it's too late to establish. A patch cadence means deciding, in advance, how quickly a security-relevant release gets applied — not upgrading only when something breaks or a problem is reported. NIST's enterprise patch management guidance frames this as planning work, not a purely reactive one, and treating an increasing gap between the running version and the latest patched release as an ongoing finding rather than a fact to note in passing is the practical version of that. A backup is only as good as its last successful restore, not its last successful backup job: capture the repository data, the database, any attached object storage (LFS objects, package artifacts, avatars), and the `app.ini` configuration together, and actually restore that set into a separate environment periodically to confirm it produces a working instance — a backup nobody has restored is, for practical purposes, unverified. Audit logging follows the same logic in reverse: a log that records administrative actions, authentications, and permission changes is only useful if something is actually reading it, on some cadence, looking for the specific things that would matter (a new Owner-team member, a new deploy key with write access, a spike in failed logins) — generating the log without a review habit attached to it provides an audit trail in name only.",
    ],
    validationEvidence: [
      "This article describes a hardening pattern and a fictional illustrative Gitea deployment; it does not reproduce a specific real instance's configuration or a completed assessment against one. Its evidence state is UNVERIFIED, and every recommendation here should be adapted to your actual deployment and then verified against it — via the validation module below — rather than treated as already-proven for your environment.",
    ],
    limitations: [
      "This guide covers the instance's own configuration surface: authentication, key and secret handling, access control, exposure, patching, backup, and logging. It does not cover hardening the underlying host OS, container runtime, or reverse-proxy software itself in detail — 'Building a Secure Internal Reverse Proxy' covers the proxy-layer trust boundary separately, and general host-hardening is out of scope here.",
      "It does not cover hardening Gitea Actions runners specifically (the execution environment that runs CI jobs triggered from the instance) — 'Why Build Runners Should Be Treated as Untrusted' covers that blast-radius question generically and applies directly if Actions is in use, but this guide doesn't repeat it.",
      "Exact configuration keys, defaults, and available features (the `TWO_FACTOR_AUTH=enforced` option in particular) are version-specific and were verified against Gitea's current documentation at the time of writing; confirm the behavior of your specific deployed version before relying on any single setting described here.",
      "This guide assumes a single, moderately sized self-hosted instance (a team, a homelab, or a small organization). Very large multi-tenant deployments may need additional controls (rate limiting at scale, dedicated identity-provider integration, SSO) beyond what's covered here.",
    ],
    defensiveRecommendations: [
      "Set `TWO_FACTOR_AUTH = enforced` in the `[security]` section once every active account has had a chance to enroll, rather than leaving 2FA opt-in indefinitely.",
      "Issue one SSH key per person and per automated purpose; never reuse one key across a person's interactive access and an unrelated pipeline's automation.",
      "Scope deploy keys to read-only by default, and grant write access only to the specific automation that needs to push, scoped to the one repository it needs.",
      "Verify webhook deliveries against the raw request body using the signature header (`X-Gitea-Signature` or `X-Hub-Signature-256`), with constant-time comparison, before parsing the payload — never check for a secret field inside the JSON body.",
      "Structure access with organization teams scoped to specific units and specific repositories rather than ad hoc collaborator lists, and review Owner-team membership on a recurring cadence.",
      "Put a reverse proxy in front of the web UI and API; decide SSH exposure as a separate, deliberate question rather than assuming the proxy covers it.",
      "Establish and follow a patch cadence tied to Gitea's security advisories, rather than upgrading reactively.",
      "Back up repository data, the database, attached object storage, and configuration together, and periodically perform an actual test restore.",
      "Route authentication and administrative-action logs somewhere they are actually reviewed on a cadence, not just retained.",
    ],
    keyTakeaways: [
      "A self-hosted Gitea instance is an authentication system, an authorization system, and — once Actions or webhooks are wired to it — a supply-chain component, not just a place code happens to live.",
      "Enforced 2FA, scoped SSH/deploy keys, and verified webhook signatures close specific, well-understood gaps rather than being generic best-practice advice; each maps to a concrete failure mode described above.",
      "Unit-based permissions and organization team scoping let you grant exactly what's needed per repository — Owner-team membership specifically deserves periodic, deliberate review rather than accumulating unnoticed.",
      "A reverse proxy hardens the web/API surface but does not, by itself, cover SSH exposure — that's a separate decision.",
      "Patch cadence, tested backups, and reviewed audit logs share the same trap: each looks adequate right up until the moment it's actually needed, which is exactly why they need to be verified in advance rather than assumed.",
    ],
    references: [
      "Gitea Documentation, Multi-factor Authentication: https://docs.gitea.com/usage/multi-factor-authentication",
      "Gitea Documentation, Configuration Cheat Sheet (`[security]` section, `TWO_FACTOR_AUTH`): https://docs.gitea.com/administration/config-cheat-sheet/",
      "Gitea Documentation, Webhooks: https://docs.gitea.com/usage/webhooks",
      "Gitea Documentation, Permissions: https://docs.gitea.com/usage/access-control/permissions/",
      "Gitea Documentation, Protected Branches (deploy-key push allowlisting): https://docs.gitea.com/usage/access-control/protected-branches/",
      "NIST SP 800-63B-4, Digital Identity Guidelines: Authentication and Authenticator Management: https://csrc.nist.gov/pubs/sp/800/63/b/4/final",
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (Access Control family): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "NIST SP 800-40 Rev. 4, Guide to Enterprise Patch Management Planning: https://csrc.nist.gov/pubs/sp/800/40/r4/final",
      "NIST SP 800-92, Guide to Computer Security Log Management: https://csrc.nist.gov/pubs/sp/800/92/final",
      "CIS Critical Security Control 6, Access Control Management: https://www.cisecurity.org/controls/access-control-management",
      "CISA and NSA, Defending Continuous Integration/Continuous Delivery (CI/CD) Environments: https://www.cisa.gov/news-events/alerts/2023/06/28/cisa-and-nsa-release-joint-guidance-defending-continuous-integrationcontinuous-delivery-cicd",
    ],
    relatedSlugs: ["secure-internal-reverse-proxy-design", "build-runners-untrusted", "protecting-main-branch-beyond-pr-approval"],
  },
  module: module_,
};
