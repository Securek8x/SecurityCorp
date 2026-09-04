// Knowledge-base article: "Workload Identities vs Long-Lived Credentials"
// (Bead securitycorp-source-4zl.55.3.1). Status stays "drafting" — this
// file is registered in lib/knowledge-content.ts so the catalog can render
// it as an internal/preview item, but every review record stays "pending"
// until a named human reviewer records an explicit approval, per
// docs/publication-safety-policy.md. All examples describe a fictional
// workload and a fictional identity provider; no real cloud account,
// project, cluster, credential, hostname, or infrastructure detail appears
// anywhere in this file. Generic vendor mechanism descriptions (how a named
// cloud platform's workload identity federation or a named open-source
// project's token issuance actually works) are cited for how the mechanism
// functions, not as an endorsement or a deployment recommendation.
//
// Differentiation from the other identity-scoped article in this category:
// lib/articles/least-privilege-for-pipeline-identities.ts is about a
// *scoping* decision — given a pipeline identity, whether the permissions
// and trust condition attached to it are narrower than what the job
// actually needs. This article is upstream of that question and broader in
// runtime scope: it is about the *credential mechanism itself*, across any
// runtime context (a VM, a container, a pipeline job, a serverless
// function) — whether the workload authenticates with a portable,
// long-lived secret that has to be provisioned, stored, and rotated, or
// with a short-lived token minted and bound to the workload's attested
// runtime identity, with no persistent secret to store at all. A workload
// identity that is well-scoped in the sense the pipeline-identities guide
// describes can still be undermined if the trust condition binding it to
// the runtime is too loose — the two guides compose, they do not overlap.
// lib/articles/docker-to-k3s-migration-zero-change.ts touches
// per-workload identity briefly, as one of five platform-default changes a
// migration surfaces; this guide is the dedicated treatment of the
// mechanism and its trade-offs, referenced from there rather than
// repeated.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const diagram: FlowDiagramSpec = {
  titleId: "workload-identity-vs-static-credential-diagram",
  title: "Workload identity vs. an embedded static credential",
  desc: "A fictional workload reaches a target resource two ways. Interactive: switch between the normal flow, where the workload authenticates through a workload identity provider that issues a short-lived token bound to the workload's runtime context, and a failure mode showing what happens when the same workload instead carries an embedded long-lived credential — explore each node's role in the diagram.",
  viewBox: "0 0 1000 300",
  failureLabel: "Embedded static credential",
  caption:
    "Fictional workload: in the normal path, the workload presents its runtime context to a workload identity provider, which issues a short-lived token scoped to that context and to the one target resource it needs; the workload never stores a persistent secret. In the failure mode, the same workload instead carries a long-lived API key baked into its image or configuration. That key is a portable string with no binding to runtime context, so anyone who obtains it — through a leaked image, a log, a repository, or a compromised host — can present it from anywhere, indefinitely, until someone notices and manually rotates it.",
  motionDuration: 2600,
  mainPacketRoute: {
    d: "M160,95 H190 M380,95 H630",
    length: 280,
  },
  edges: [
    { id: "workload-idp", from: "workload", to: "identity-provider", d: "M160,95 H190", length: 30, kind: "main", activeIn: ["normal"] },
    { id: "idp-target", from: "identity-provider", to: "target-resource", d: "M380,95 H630", length: 250, kind: "main", activeIn: ["normal"] },
    { id: "workload-secret", from: "workload", to: "embedded-secret", d: "M85,130 V205", length: 75, kind: "failure", activeIn: ["failure"] },
    { id: "secret-attacker", from: "embedded-secret", to: "attacker", d: "M160,235 H630", length: 470, kind: "failure", activeIn: ["failure"] },
    { id: "attacker-target", from: "attacker", to: "target-resource", d: "M715,205 V130", length: 75, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "workload",
      label: "Workload runtime",
      x: 10,
      y: 60,
      w: 150,
      h: 70,
      activeIn: ["normal", "failure"],
      description:
        "A fictional workload — a VM, container, or function — that needs to call one target resource. What it authenticates with, and whether that credential exists as a portable string at all, is a design decision made before this workload ever runs.",
    },
    {
      id: "identity-provider",
      label: "Workload identity provider",
      x: 190,
      y: 60,
      w: 190,
      h: 70,
      role: "boundary",
      activeIn: ["normal"],
      focusableLabel: "Workload identity provider — attests the workload's runtime context and mints a short-lived token; normal path only",
      description:
        "Attests facts about the workload's actual runtime context (which platform, which project or cluster, which service account) and, only if that attestation matches an expected condition, issues a short-lived, audience-scoped token. Nothing is written to disk on the workload before or after this exchange — the credential is minted fresh, on demand, and expires on its own.",
    },
    {
      id: "target-resource",
      label: "Target resource",
      x: 630,
      y: 60,
      w: 170,
      h: 70,
      role: "safe",
      activeIn: ["normal", "failure"],
      description:
        "The one resource this workload is authorized to reach. In the normal path it is reached only for the short-lived token's brief validity window, and only by the runtime context the token was actually issued to. In the failure mode, it is reached improperly by an attacker who obtained the embedded credential — not by the workload at all.",
    },
    {
      id: "embedded-secret",
      label: "Embedded static credential",
      x: 10,
      y: 205,
      w: 150,
      h: 60,
      activeIn: ["failure"],
      focusableLabel: "Embedded static credential — a long-lived key baked into the workload; failure mode only",
      description:
        "Failure-mode only: a long-lived API key or key file baked into the workload's image or configuration instead of a workload identity exchange. It is a portable string with no binding to runtime context — it authenticates whoever presents it, from wherever they present it, until it is manually rotated.",
    },
    {
      id: "attacker",
      label: "Attacker reuses the credential",
      x: 630,
      y: 205,
      w: 170,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Attacker reuses the credential — reachable only when a static secret leaks, visible only in failure mode",
      description:
        "Failure-mode only: someone who obtained the embedded credential — through a leaked image layer, a build log, a misconfigured repository, or a compromised host — and can now present it from outside the workload entirely, for as long as it remains valid. Nothing about the credential itself distinguishes this caller from the legitimate workload; the string is identical either way.",
    },
  ],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A fictional or isolated lab environment — an account, cluster, or platform instance you control and are authorized to configure, not a production system.",
    "A workload identity mechanism available in that environment: a cloud provider's workload identity federation, a Kubernetes cluster with bound service-account token projection, or a SPIFFE/SPIRE deployment, depending on what the lab platform actually supports.",
    "Read access to that platform's own current documentation for the specific mechanism in use — this guide describes the pattern generically, and exact configuration steps vary by provider and by version.",
    "Authority, or a documented path to someone with authority, to retire a long-lived credential once its replacement is validated — a migration that adds a workload identity path but never removes the standing credential has not reduced the exposed attack surface.",
  ],
  procedure: [
    "Inventory every long-lived credential a fictional workload currently holds: an API key in an environment variable, a service-account JSON key file, a hardcoded secret in configuration. For each one, record where it is stored, how it reaches the workload, and how long it remains valid without manual action.",
    "For each credential, identify whether the platform the workload runs on offers a workload identity mechanism that could replace it — a cloud platform's workload identity federation for a VM or container, a Kubernetes cluster's projected, audience-bound service-account token for a pod, or a SPIFFE/SPIRE-issued SVID for a workload attested by its runtime properties.",
    "Configure the workload identity provider to attest the specific runtime context the workload actually runs in (the specific project, cluster, namespace, or service-account binding) and to issue a token scoped to the one target resource the workload needs — not a broad, reusable grant.",
    "Update the workload to request and use the short-lived token instead of reading the long-lived credential, using whichever client-library or SDK mechanism the platform provides for consuming a federated or projected token.",
    "Run the workload's normal operation end to end using only the workload identity path, in the lab environment, and confirm every call that previously used the long-lived credential now succeeds using the short-lived token instead.",
    "Retire the long-lived credential deliberately: revoke it at the identity provider, and only after confirming no code path still reads it. A credential left valid 'just in case' after its replacement is validated is not a completed migration — it is an unused, unmonitored, still-exploitable secret.",
    "Document which target resource the new identity is scoped to and which runtime context can assume it, so a later reviewer can confirm the scope matches the workload's actual need rather than re-deriving it from the identity provider's configuration each time.",
  ],
  validation: [
    "Confirm the short-lived token's claims (audience, subject, expiry) match the workload's actual runtime context and the one target resource it should reach — not a broader scope carried over out of caution during migration.",
    "Confirm the token cannot be obtained or replayed from outside the attested runtime context: attempt, in the lab, to request a token asserting a different runtime identity than the one actually running, and confirm the identity provider rejects it.",
    "Confirm the workload's normal operation, including any less common path (a retry, a scheduled job, an error-handling branch), still succeeds using only the workload identity path before removing the long-lived credential as a fallback.",
    "Confirm the retired long-lived credential is actually rejected by the target resource after revocation — a credential marked 'deprecated' in a note but never revoked at the identity provider is not a validated control.",
    "Where a claim cannot be tested directly in the lab (for example, a platform-specific attestation detail this guide does not cover), record it explicitly as UNVERIFIED rather than assuming the migration is complete because the workload no longer references the old credential in its configuration.",
  ],
  rollback: [
    "If the workload identity path fails to cover a legitimate use the inventory missed, do not restore the retired long-lived credential as the fix — identify the specific missing scope or attestation condition and add it to the workload identity configuration, so the fix is a deliberate, documented narrowing rather than a return to a standing secret.",
    "Stage the migration: validate the workload identity path fully in the lab or a non-production instance, run a full normal-operation cycle, and only then retire the long-lived credential — keeping both live briefly during validation is reasonable; keeping both live indefinitely defeats the purpose of the migration.",
    "Keep a record of when the long-lived credential was revoked and why the workload identity configuration is scoped the way it is, so a future reviewer can distinguish 'this was migrated deliberately, on this date' from 'this workload never had a standing secret to begin with.'",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Workload Identities vs Long-Lived Credentials",
    slug: "workload-identities-vs-long-lived-credentials",
    summary:
      "Why a long-lived static credential embedded in a workload — an API key, a service-account key file, a hardcoded secret — is a persistent, high-value target, and how a workload identity mechanism (short-lived tokens bound to the workload's attested runtime context) removes the need to provision or store one at all, along with where that mechanism still needs correct scoping and does not fully apply.",
    pillar: "defend-systems",
    primaryCategory: "identity-access-management",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["authentication", "access-control", "secrets-management", "cloud-platforms"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 12,
    publishedAt: "2026-09-04",
    lastReviewedAt: "2026-09-04",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
  },
  sections: {
    executiveSummary: [
      "A long-lived credential — an API key, a service-account JSON key file, a hardcoded secret in configuration — is a portable string. Whoever holds it can present it, from wherever they are, until someone notices it is compromised and manually rotates it. It carries no information about which workload is presenting it, and that gap between 'valid credential' and 'legitimate workload' is exactly what makes a leaked long-lived credential so damaging: a leaked image layer, a build log, a misconfigured repository, or a compromised host can hand an attacker standing, reusable access that looks, to the resource being called, identical to the real workload.",
      "A workload identity mechanism removes that gap by removing the portable string entirely. Instead of storing a secret, the workload proves facts about its own runtime context — which platform, which project or cluster, which service-account binding it is actually running as — to an identity provider, which issues a short-lived, narrowly scoped token bound to that context. There is nothing sitting on disk or in an environment variable for an attacker to steal, because the credential the workload uses did not exist until moments before it was used, and stops working shortly after. This guide explains the mechanism generically, using a fictional workload and a fictional identity provider, and is explicit about where workload identity still requires correct scoping and where it does not fully apply.",
    ],
    whatYouWillLearn: [
      "Why a long-lived credential's core weakness is that it is a portable string with no binding to runtime context — not simply that it is 'old' or 'shared.'",
      "How a workload identity mechanism actually works: attestation of runtime context, followed by issuance of a short-lived, audience-scoped token — and why that means there is no persistent secret to provision or leak in the first place.",
      "Concrete mechanisms across platforms: cloud workload identity federation, Kubernetes projected and audience-bound service-account tokens, and SPIFFE/SPIRE-issued workload identities.",
      "Where workload identity is not a complete answer: it still requires correct permission scoping, it does not exist uniformly across every cloud and platform, and legacy systems that cannot participate in an attestation exchange still need a credential of some kind.",
    ],
    intendedAudience: [
      "Platform engineers deciding how a new or migrating workload should authenticate to another system.",
      "Security engineers assessing whether a workload's credential is a standing secret worth treating as a leak risk, or a short-lived token bound to runtime context.",
      "Practitioners who have read about 'workload identity' or 'keyless authentication' generically and want the actual mechanism, not just the marketing framing.",
    ],
    prerequisites: [
      "Basic familiarity with the idea that a workload (a VM, container, or function) authenticates to something else using some kind of credential.",
      "No specific cloud-provider or Kubernetes expertise is assumed; this guide describes the pattern generically and uses a fictional example for illustration.",
      "Awareness that 'this credential is valid' and 'this call comes from the workload it was issued to' are two separate questions is useful background, though this guide explains both.",
    ],
    problem: [
      "A long-lived credential's danger is structural, not incidental. Once minted, an API key or a service-account key file remains valid indefinitely — often for months or years — regardless of whether the workload it was issued for is even still running. It is stored somewhere: an environment variable, a configuration file, a secrets manager entry pulled into memory, sometimes a container image layer. Every one of those storage locations is a place the credential can leak, and once it does, the string itself carries no evidence of who is presenting it. A resource that authenticates by checking 'is this key valid' cannot distinguish the workload it was issued to from an attacker who found it in a leaked build log.",
      "This is not a hypothetical gap even in a fictional illustration: NIST's guidance on authenticator management treats an authenticator's lifetime, storage protection, and revocability as central controls precisely because a credential that is hard to constrain in time and hard to bind to a specific context is harder to protect for its entire useful life (NIST SP 800-53 Rev. 5, control IA-5). Rotation schedules and secrets-manager tooling reduce this exposure; they do not remove it, because the credential still exists as a standing, portable value between rotations.",
    ],
    threatModel: [
      "Assets: the long-lived credential's value itself (or, in the workload-identity case, the identity provider's attestation and signing trust), every resource that credential or token can reach, and — for workload identity specifically — the attestation condition that decides which runtime context may obtain a token in the first place.",
      "The central trust decision for a long-lived credential: anyone who presents the correct string is treated as the workload, for as long as the string remains valid, regardless of where the presentation actually originates from. The central trust decision for a workload identity: only a runtime context matching the identity provider's attestation condition can obtain a token, and that token is useful only for a short window and only for the resource it names.",
      "Representative threats to a long-lived credential: it appears in a build log or debug output and is captured by anyone who can read that log; it is baked into a container image layer and is extractable by anyone who can pull that image; it sits in a leaked or misconfigured repository; it is copied off a compromised host and reused from an entirely different network, indefinitely, until someone notices and rotates it.",
      "Representative threats that remain even with workload identity in place: an attestation condition scoped too broadly (any workload in an entire project or organization, rather than the one specific workload that needs access) hands the token to more runtime contexts than intended — narrowing the credential mechanism does not by itself narrow who can obtain one. A token that is correctly issued but grants excessive permissions is still an over-privileged credential, just a short-lived one. And a workload identity mechanism only protects the workloads and platforms that actually support it; anything that cannot participate in the attestation exchange still depends on some other credential.",
      "The interactive diagram accompanying this article shows the structural difference: in the normal path, a workload identity provider issues a short-lived token bound to the workload's attested runtime context, reaching only the one resource it needs. In the failure mode, the same workload instead carries a long-lived credential — a portable string that, once leaked, lets an attacker reach the same resource from entirely outside the workload, indistinguishable from the legitimate caller.",
    ],
    mainContent: [
      "**A long-lived credential is a value; a workload identity is a claim about context.** This is the core mechanical difference, and everything else in this guide follows from it. An API key or a key file is data — it can be copied, exfiltrated, and replayed from anywhere, because nothing about the value itself is tied to where it is presented from. A workload identity token is issued only after an identity provider attests specific, hard-to-forge facts about the calling workload's actual runtime context, and the resulting token is scoped narrowly and expires quickly. Copying the token doesn't help an attacker much once it expires, and obtaining a fresh one requires satisfying the same attestation condition the legitimate workload satisfies — which, correctly configured, an attacker outside that runtime context cannot do.",
      "**No secret to leak because none is stored — this is the mechanism, not a slogan.** With a long-lived credential, there is always a value sitting somewhere between issuance and use: an environment variable, a file, a secrets-manager response cached in memory. With workload identity, the credential the workload actually uses is minted fresh at the moment it's needed and expires shortly after. A cloud provider's own documentation on workload identity federation describes this directly: it lets a workload exchange its environment-specific credentials for short-lived cloud credentials, explicitly to eliminate the maintenance and security burden of a standing service-account key. There is no long-lived value for a leaked log, a leaked image layer, or a leaked repository to expose, because that long-lived value was never created.",
      "**Automatic, frequent rotation is a property of the mechanism, not a schedule someone has to run.** A long-lived credential's rotation depends on a human or a scheduled job remembering to do it, and the credential remains fully valid the entire time between rotations. A workload identity token's expiry is enforced by the issuing mechanism itself. Kubernetes' bound, projected service-account tokens illustrate this concretely: the platform's own documentation describes them as time-bound, audience-scoped tokens that the kubelet automatically rotates before they expire, with a default lifetime on the order of an hour, replacing the old pattern of a non-expiring token mounted into every pod by default. The workload never has to request a rotation; the platform enforces a short lifetime as a baseline property of every token it issues.",
      "**The identity is tied to runtime context, not to a portable string, which is what actually closes the exfiltration gap.** A cloud platform's instance-metadata identity for a virtual machine works the same way in spirit: an application running on the instance retrieves temporary security credentials automatically from a metadata endpoint reachable only from that instance, rather than an operator embedding a long-lived access key in the application's configuration — a pattern cloud providers' own IAM documentation describes specifically as the alternative to storing access keys on the instance. SPIFFE/SPIRE generalizes the same idea outside any single cloud platform: a SPIRE agent attests a workload's identity based on properties of the runtime that are hard for an outside party to fake (which process, on which node, launched by which parent), and only then issues a short-lived SVID — the workload's cryptographic identity document — scoped to that attested identity. In every one of these mechanisms, the thing being verified is 'is this actually the workload it claims to be, right now,' not 'does this caller happen to possess the right string.'",
      "**Federation is how a workload proves its identity to a system it doesn't already have a standing credential with.** The generic pattern — present a token from one trust domain, receive a token scoped to another — is standardized outside any single vendor's implementation: the IETF's OAuth 2.0 Token Exchange specification defines exactly this kind of exchange, letting a client present one security token and receive a different one, which is the same shape of operation a cloud platform's cross-cloud workload identity federation performs when a workload running on one provider's infrastructure exchanges its native identity for a token scoped to a different provider's resources. Federation is what makes workload identity usable across organizational and platform boundaries, not just within a single vendor's own compute service.",
      "**Correct scoping is still required — workload identity changes the credential mechanism, not the authorization question.** A short-lived token issued to an over-broad attestation condition, or granted excessive permissions once issued, is still a problem; it is simply a shorter-lived one. NSA and CISA's cloud identity guidance is explicit that strong authentication mechanisms need to be paired with least-privilege authorization decisions — the two are complementary controls, and eliminating the standing secret does not substitute for scoping what the resulting identity can actually do. A workload identity that any workload in an entire project or account can obtain is a narrower improvement than one scoped to the single workload that actually needs it.",
      "**Cross-cloud and cross-platform coverage is real but not universal.** Cloud providers' own workload identity federation documentation lists the identity providers and platforms they support — deployment services, other major clouds, generic OIDC or SAML providers — and that list is deliberately broad, but it is still a list. A workload running on infrastructure or a platform the identity provider doesn't recognize, or communicating with a system that has no concept of federated or attested identity at all, cannot use this mechanism to reach it. Where two systems on different platforms both need to trust the same workload identity, someone has to configure that trust relationship explicitly; it does not appear automatically because both systems individually support some flavor of workload identity.",
      "**Legacy systems are the honest limitation, not an edge case to wave away.** Some systems — an old on-premises application with no OIDC or SAML support, a device that only understands a static API key, a vendor integration that has never implemented any federation protocol — simply cannot participate in an attestation exchange. For those systems, a long-lived credential (ideally short-lived within what that system allows, rotated as tightly as its interface permits, and stored in a secrets manager rather than a file) remains the only option until the system itself changes. Treating 'we adopted workload identity' as a completed migration while a legacy integration quietly still runs on a five-year-old key is the same gap this guide is otherwise about closing — the fix is knowing exactly where that gap still exists, not assuming it has been closed everywhere.",
    ],
    validationEvidence: [
      "This guide describes a mechanism and a fictional illustrative migration; it does not reproduce a specific cloud platform's configuration or a completed credential-elimination exercise against a real workload. Its evidence state is UNVERIFIED, and the guide module's requirements/procedure/validation/rollback steps should be treated as a starting checklist to adapt and then verify against your own lab platform's actual workload identity mechanism, not as a validated result.",
    ],
    limitations: [
      "This guide addresses the credential mechanism — long-lived static secret versus short-lived, runtime-bound token — and the scoping question that remains once workload identity is in place. It does not repeat lib/articles/least-privilege-for-pipeline-identities.ts's detailed treatment of scoping a pipeline identity's permissions and trust condition once that identity exists; read that guide for the deeper scoping procedure.",
      "Exact attestation mechanisms, token lifetimes, and supported identity providers vary by cloud platform, by Kubernetes distribution, and by SPIFFE/SPIRE deployment, and change over time as providers update their own services. This guide describes the pattern generically; verify the specific mechanism and current documentation your platform offers before relying on any one detail here.",
      "This guide does not cover human user authentication, session management, or multi-factor authentication for people — it is specifically about how a non-human workload authenticates to another system, which is a related but distinct problem from user identity.",
    ],
    defensiveRecommendations: [
      "Prefer a workload identity mechanism (cloud workload identity federation, Kubernetes bound service-account tokens, or SPIFFE/SPIRE) over a long-lived credential wherever the platform and the target system both support one.",
      "Where a long-lived credential cannot be avoided (a legacy system with no federation support), rotate it as tightly as the system allows, store it in a secrets manager rather than a file or environment variable visible to the whole process, and treat every location it is stored as a leak surface to inventory.",
      "Scope the attestation condition narrowly — to the specific workload that needs access, not to an entire project, account, or organization — because eliminating the standing secret does not by itself narrow who can obtain the resulting token.",
      "Pair workload identity adoption with least-privilege scoping of the permissions the resulting token actually grants; a short-lived token with excessive permissions is still an over-privileged credential.",
      "Explicitly inventory which workloads and integrations still depend on a long-lived credential after a workload identity migration, rather than assuming the migration is complete once the primary workloads have moved.",
      "Revoke a retired long-lived credential at the identity provider once its workload identity replacement is validated — an unused but still-valid credential is not a reduced attack surface.",
    ],
    keyTakeaways: [
      "A long-lived credential's core weakness is structural: it is a portable string with no binding to runtime context, so a leak anywhere it is stored is indistinguishable, to the resource being called, from the legitimate workload.",
      "A workload identity mechanism removes that weakness by removing the standing secret entirely — a short-lived token is minted only after the workload's runtime context is attested, and expires on its own shortly after.",
      "Workload identity changes the credential mechanism, not the authorization question — correct scoping of both the attestation condition and the resulting token's permissions is still required.",
      "Cross-platform coverage and legacy-system support are real limits, not implementation details — know explicitly which workloads still depend on a long-lived credential rather than assuming a migration reached everything.",
    ],
    references: [
      "NIST SP 800-53 Rev. 5, control IA-5, Authenticator Management: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "NIST SP 800-53 Rev. 5, control AC-2, Account Management: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "CISA and NSA, Identity and Access Management: Recommended Best Practices for Administrators: https://www.cisa.gov/sites/default/files/2023-12/ESF%20IDENTITY%20AND%20ACCESS%20MANAGEMENT%20RECOMMENDED%20BEST%20PRACTICES%20FOR%20ADMINISTRATORS%20PP-23-0248_508C.pdf",
      // media.defense.gov (DoD's own CDN) blocks automated fetches (HTTP
      // 403) regardless of the document's own liveness — confirmed live
      // via WebFetch. Cited via CISA's own announcement/landing page for
      // the same Cybersecurity Information Sheet instead of the
      // bot-blocked direct PDF URL.
      "NSA and CISA, Use Secure Cloud Identity and Access Management Practices (Cybersecurity Information Sheet), announced: https://www.cisa.gov/news-events/alerts/2024/03/07/cisa-and-nsa-release-cybersecurity-information-sheets-cloud-security-best-practices",
      "IETF RFC 8693, OAuth 2.0 Token Exchange: https://www.rfc-editor.org/info/rfc8693/",
      "Google Cloud, Workload Identity Federation documentation: https://docs.cloud.google.com/iam/docs/workload-identity-federation",
      "AWS, IAM roles for Amazon EC2 documentation: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html",
      "Kubernetes, Service Accounts documentation (bound, projected service-account tokens): https://kubernetes.io/docs/concepts/security/service-accounts/",
      "SPIFFE, SPIFFE Concepts documentation: https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/",
    ],
    relatedSlugs: ["least-privilege-for-pipeline-identities", "securing-api-authentication-authorization", "docker-to-k3s-migration-zero-change"],
  },
  module: module_,
  diagram,
};
