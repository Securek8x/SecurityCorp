// Knowledge-base article: "Common Causes of Unexpected Network Exposure"
// (Bead securitycorp-source-4zl.55.1.7). Not yet added to
// lib/knowledge-content.ts's `knowledgeArticles` — status stays "drafting"
// and every review record stays "pending" until the human owner reviews it,
// per docs/publication-safety-policy.md and docs/knowledge-base.md. All
// examples describe a fictional environment using documentation-safe
// addressing (RFC 5737 ranges only); no real domain, address, port,
// topology, employer, or infrastructure detail appears anywhere in this
// file. This is a root-cause catalog companion to
// "How to Validate That a Service Is Not Publicly Reachable"
// (lib/articles/validating-a-service-is-not-publicly-reachable.ts): that
// article is the validation procedure, this one is the catalog of
// misconfiguration patterns that procedure would catch, so it references
// that article via relatedSlugs instead of repeating its validation steps.
// This checklist describes generic cloud/network concepts (load balancers,
// security groups, NAT, DNS) without naming or favoring any specific
// commercial product.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

export const article: KnowledgeArticle = {
  meta: {
    title: "Common Causes of Unexpected Network Exposure",
    slug: "common-causes-of-unexpected-network-exposure",
    summary:
      "A repeatable audit checklist covering the specific, recurring ways a service ends up reachable from somewhere it was never intended to be reachable from: a load balancer or reverse proxy with a broader listener than intended, a cloud security-group rule left permissive after testing, a service bound to every interface instead of a loopback or internal one, a leftover NAT or port-forward rule, a default-allow rule on a newly provisioned resource, and an internal-sounding DNS record that actually resolves to a publicly reachable resource. Illustrated with a fictional example.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "checklist",
    difficulty: "intermediate",
    status: "published",
    tags: ["network-isolation", "network-segmentation", "security-control-validation", "cloud-platforms"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 11,
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
  sections: {
    executiveSummary: [
      "Unintended exposure is rarely the result of one dramatic mistake. It is almost always the accumulation of small, individually reasonable-looking decisions — a rule loosened for a debugging session, a resource left at its provisioned default, a listener scoped a little wider than the service behind it actually needed — none of which anyone thought of as 'the thing that made this reachable from the internet.' Each decision made sense in isolation, on the day it was made, and none of them was ever revisited once the reason for making it had passed.",
      "This checklist catalogs the specific, recurring root causes behind that pattern: a load balancer or reverse proxy with a broader listener or rule than intended, a cloud security-group or firewall rule left permissive 'temporarily' during testing and never tightened, a service binding to every interface instead of a loopback or internal one, a leftover NAT or port-forward rule from an earlier debugging session, a default-allow rule on a newly provisioned resource that was never explicitly hardened, and a DNS record with an internal-sounding name that actually resolves to a resource that is publicly reachable. It is a companion to \"How to Validate That a Service Is Not Publicly Reachable,\" which covers the external verification procedure; this checklist is the map of what that procedure is actually looking for. A fictional example — a documented internal-only reporting service exposed anyway because a load-balancer listener rule outgrew the security group underneath it — runs through the checklist and the accompanying interactive diagram.",
    ],
    whatYouWillLearn: [
      "The six recurring root-cause patterns behind unintended network exposure, and why each one tends to survive unnoticed rather than being caught immediately.",
      "Why exposure is usually the product of a rule or default that was correct on the day it was set and simply never revisited, not a single obvious error.",
      "How a resource's newly provisioned defaults, a load balancer's listener scope, and a DNS record's name can each independently diverge from a service's actual intended reachability.",
      "How to turn each root-cause pattern into a concrete, evidence-producing audit item instead of a vague reminder to 'check the firewall rules.'",
      "Why this checklist finds the causes and a separate, external verification procedure is required to confirm the resulting reachability — and why neither replaces the other.",
    ],
    intendedAudience: [
      "Network defenders and security practitioners responsible for auditing why a service might be reachable from somewhere it was never intended to be.",
      "Platform and cloud engineers who provision load balancers, security groups, NAT rules, and DNS records and want a recurring-pattern checklist to audit their own defaults against.",
      "Security practitioners building or reviewing a team's periodic exposure-audit process, rather than relying on catching drift only when something external flags it.",
    ],
    prerequisites: [
      "Familiarity with basic networking concepts: interfaces, listening ports, NAT, DNS records, and the general idea of a security group or firewall rule governing a cloud workload.",
      "Comfort with the general idea of a load balancer or reverse proxy sitting in front of a service, without needing to know a specific product's configuration syntax.",
      "No lab environment is required to follow this checklist; it is conceptual and uses a fictional example throughout.",
    ],
    problem: [
      "A common failure pattern looks like this: a security-group rule gets widened to unblock a test, the test passes, and the rule stays widened because narrowing it again is not part of anyone's workflow. A load balancer gets a new listener added for a public-facing service, and because it is quicker to reuse an existing target group than create a new one, an internal-only service ends up reachable through the same listener. A newly provisioned storage resource or managed service comes with a default-allow rule that nobody explicitly reviewed, because provisioning it felt like the finished task rather than the start of a hardening step. A NAT rule created during a debugging session outlives the debugging session by months, because nothing about normal operation prompts its removal. A DNS record named for an internal system is created against a resource that, for unrelated reasons, is publicly reachable, and the internal-sounding name is mistaken for an access control.",
      "The underlying problem in every one of these patterns is the same: a decision that was reasonable at the moment it was made — loosen this rule to unblock a test, reuse this listener to save a step, accept this resource's shipped default, leave this NAT rule until the debugging session wraps up, name this record for clarity — quietly outlives the context that justified it, and nothing in normal operation forces it to be revisited. None of these require an attacker, a bug, or unusual carelessness. They require only the ordinary passage of time between when a rule was set and when someone next has a reason to look at it. Fixing this requires treating each of these patterns as a named, recurring thing to check for on a schedule, not as an unusual mistake to catch only after the fact.",
    ],
    threatModel: [
      "This checklist's threat model assumes an adversary who does not need to compromise anything to benefit from these patterns — an externally reachable service that its owners believe is internal-only is, by definition, already reachable to anyone who finds it, whether by scanning, by discovering a DNS record, or by enumerating a cloud provider's default-allow resources at scale. The adversary's advantage is patience and breadth, not sophistication: these are exactly the kind of drift that an automated internet-wide scan or a routine reconnaissance pass is built to find, long before any human on the defending side notices.",
      "Six failure patterns recur most often, and this checklist's interactive diagram illustrates one of them directly: a load-balancer or reverse-proxy listener rule broader than the security group sitting beneath it, so that traffic relayed through the load balancer is implicitly trusted by the service even though the service's own security-group rule looks correctly restrictive on inspection. The same underlying failure mode — a layer nobody is actively watching quietly becoming broader than a service's actual intended reachability — recurs across all six patterns in this checklist, not just the one diagrammed.",
    ],
    mainContent: [
      "**Root cause 1: a load balancer or reverse proxy with a broader listener or rule than intended.** A load balancer or reverse proxy is frequently the actual public-facing edge of a system, and its listener or routing rule can be configured more broadly than the service behind it was ever meant to allow. This commonly happens when an existing listener or target group is reused for a new service to save a provisioning step, or when a rule written for one public-facing service is copied and adapted for an internal-only one without narrowing its source scope. Because the service's own security-group rule can look correctly restrictive in isolation, this root cause is easy to miss unless the load balancer's configuration is reviewed as its own layer, not assumed to inherit the restriction of whatever sits behind it.",
      "**Root cause 2: a cloud security-group or firewall rule left permissive after testing.** A rule widened 'temporarily' to unblock a test, a demo, or an integration attempt is one of the most common sources of drift, precisely because narrowing it back down has no natural trigger — the test passes, the immediate goal is met, and the task that would have prompted revisiting the rule (closing out the ticket that created it) rarely includes a step to also tighten it. Over time, an environment accumulates rules that are individually explainable and collectively far broader than any single person intended.",
      "**Root cause 3: a service binding to every interface instead of a loopback or internal-only one.** A service that binds to the address meaning 'listen on all interfaces' — rather than a loopback address or a specific internal interface — is reachable through any network path that can otherwise get a packet to that host, regardless of what a surrounding security-group or firewall rule was written to prevent. This is frequently a framework or runtime default rather than a deliberate choice, which means it can persist silently through every later network-layer hardening effort, because nobody reviewing the security group has any reason to also check what interface the service itself is bound to.",
      "**Root cause 4: a leftover NAT or port-forward rule from an earlier debugging session.** A NAT or port-forward rule created to make troubleshooting easier — reaching an internal service directly from outside a lab or staging network, for instance — persists exactly as long as nobody removes it, and nothing about normal operation prompts that removal once the debugging session that justified it has ended. These rules are particularly persistent because they are usually created outside the normal change-management path that would otherwise generate a record someone might later review.",
      "**Root cause 5: a default-allow rule on a newly provisioned resource that was never explicitly hardened.** Many cloud resources and managed services ship with a default network posture chosen for ease of initial setup rather than least privilege, and provisioning a resource is frequently treated as a completed task rather than the beginning of a hardening step. A resource stood up quickly to unblock other work, then left at its provisioned defaults because the team moved on to the next task, is one of the most common ways a newly created asset becomes reachable in a way nobody deliberately decided on.",
      "**Root cause 6: a DNS record with an internal-sounding name pointing at a resource that is actually publicly reachable.** An internal-sounding hostname is sometimes mistaken for an access control, when in fact DNS resolution and network reachability are two entirely separate questions — a name can be resolvable by anyone, and the resource it points at can be reachable by anyone, regardless of how internal the name sounds. This root cause compounds with the previous five: a record named for an internal system, created against a resource that is exposed because of one of the other five patterns, gives a false sense that the naming itself provides some protection.",
      "**Why this is a catalog, not a verification procedure.** Every root cause above describes a way a service's actual reachability can diverge from what its owners intended; none of them, on its own, proves that divergence has actually happened for a specific service today. Confirming that requires the external, outside-the-boundary verification procedure this checklist's companion article covers — this checklist's job is to make sure that procedure, and the audit work leading up to it, actually looks in all six of these places instead of stopping at whichever layer is easiest to review.",
    ],
    validationEvidence: [
      "This checklist is conceptual. It was not developed against a live or lab-reproduced environment, no load-balancer, security-group, NAT, or DNS configuration described here was actually deployed, and no external reachability check was actually performed. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the checklist's reasoning is internally consistent.",
    ],
    limitations: [
      "This checklist describes principles and a fictional illustrative example, not a specific cloud provider's security-group model, a specific load-balancer product's listener syntax, or a specific DNS provider's record management interface. Applying it to a real environment requires translating each root cause into that environment's actual tooling and re-validating the result there.",
      "It does not cover the external verification procedure itself — the actual outside-the-boundary check that confirms whether a given service is reachable — which is covered by its companion article, \"How to Validate That a Service Is Not Publicly Reachable.\"",
      "It does not address the legal, contractual, or provider-policy requirements that may govern who is authorized to perform network changes, resource audits, or external reachability checks in a given environment — those requirements should be confirmed separately and are outside this checklist's scope.",
    ],
    defensiveRecommendations: [
      "Review a load balancer's or reverse proxy's listener and routing rules as their own layer, rather than assuming they inherit whatever restriction the service behind them enforces.",
      "Track every security-group or firewall rule widened for testing back to a closing action that narrows it again, rather than relying on someone remembering to revisit it later.",
      "Confirm explicitly which interface a service binds to; a service bound to every interface can be reachable through paths its surrounding firewall rule was never meant to permit.",
      "Search explicitly for NAT or port-forward rules left over from earlier debugging sessions, and remove any without a current, documented justification.",
      "Treat provisioning a new cloud resource as the start of a hardening step, not the end of the task — review and explicitly tighten its default network posture before it is considered done.",
      "Audit DNS records for names that imply internal-only status and confirm, separately, whether the resources they point at are actually reachable only from where the name implies — never treat a hostname as an access control.",
      "Run this catalog as a recurring audit, not a one-time review — each root cause here can reappear independently of the others, and none of them announces itself when it happens.",
    ],
    keyTakeaways: [
      "Unintended exposure is usually the accumulation of individually reasonable decisions that outlived the context that justified them, not one dramatic mistake.",
      "The six recurring root causes are: a load balancer or reverse proxy listener broader than intended, a security-group or firewall rule left permissive after testing, a service bound to every interface instead of a loopback or internal one, a leftover NAT or port-forward rule, a default-allow rule on a newly provisioned resource, and an internal-sounding DNS record pointing at a publicly reachable resource.",
      "A service's own security-group rule can look correctly restrictive in isolation while a load balancer, NAT rule, interface binding, resource default, or DNS record independently makes it reachable anyway.",
      "An internal-sounding hostname is not an access control — DNS resolution and actual network reachability are separate questions.",
      "This checklist finds where exposure is likely to be hiding; confirming whether a specific service is actually exposed requires the external verification procedure covered by its companion article.",
    ],
    references: [
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the SC-7 Boundary Protection and CM-6 Configuration Settings controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "NIST SP 800-41 Rev. 1, Guidelines on Firewalls and Firewall Policy: https://csrc.nist.gov/pubs/sp/800/41/r1/final",
      "CIS Critical Security Controls (see Control 4, Secure Configuration of Enterprise Assets and Software, and Control 12, Network Infrastructure Management): https://www.cisecurity.org/controls",
    ],
    relatedSlugs: ["validating-a-service-is-not-publicly-reachable"],
  },
  module: {
    kind: "checklist",
    items: [
      {
        control: "Load balancer and reverse proxy listener scope reviewed against intent",
        verificationMethod: "Review every load balancer or reverse proxy listener and routing rule that could forward to this service, and confirm none of them are scoped more broadly than the service's documented intended reachability, including listeners or target groups reused from another service.",
        requiredEvidence: "A recorded review of the relevant listener and routing configuration, compared field by field against the service's documented intended reachability.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "No security-group or firewall rule left permissive after testing",
        verificationMethod: "Search explicitly for security-group or firewall rules that were widened for a test, demo, or integration attempt, and confirm each either has a current, documented justification or has been narrowed back to its original intended scope.",
        requiredEvidence: "A record showing every rule identified as test-related was either justified and current, or has been tightened, with the date of the last review.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "Service interface binding confirmed as loopback or internal-only where required",
        verificationMethod: "Confirm which network interface the service actually binds to, rather than inferring it from the surrounding firewall or security-group configuration, and flag any service bound to every interface without a documented reason.",
        requiredEvidence: "A recorded binding configuration showing the service listens on a loopback or specific internal interface, not every available interface, unless a documented reason requires otherwise.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "No leftover NAT or port-forward rule from an earlier debugging session",
        verificationMethod: "Search explicitly for NAT or port-forward rules referencing this service's address or port, and confirm each has a current, documented justification rather than originating from a closed debugging or troubleshooting session.",
        requiredEvidence: "A record showing every NAT or port-forward rule tied to this service is either justified and current, or has been removed.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "Newly provisioned resource's default network posture explicitly hardened",
        verificationMethod: "For any resource provisioned within the applicable review period, confirm its default-allow or default network posture was explicitly reviewed and tightened as part of provisioning, rather than left at whatever posture it shipped with.",
        requiredEvidence: "A recorded hardening step, distinct from the provisioning step itself, showing the resource's network posture was deliberately reviewed and set.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "DNS records audited for internal-sounding names pointing at publicly reachable resources",
        verificationMethod: "Review DNS records with internal-sounding names associated with this service and confirm, independently of the name itself, whether the resource each record points at is actually reachable only from where the name implies.",
        requiredEvidence: "A record showing each internal-sounding DNS record was checked against the actual reachability of its target, not assumed safe based on the name alone.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "All six root-cause categories covered in a single audit pass",
        verificationMethod: "Confirm the audit for this service explicitly covered every root-cause category above in one pass, rather than stopping once the first or most obvious layer was reviewed.",
        requiredEvidence: "A recorded audit checklist or log showing each of the six categories was addressed, with findings or a clean result noted for each.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "Recurring audit cadence defined, independent of a single review",
        verificationMethod: "Confirm a defined cadence exists for repeating this root-cause audit, since any of the six patterns above can reappear independently after the initial review, and at minimum after any change to load-balancer, security-group, NAT, interface-binding, resource-provisioning, or DNS configuration.",
        requiredEvidence: "A recorded audit cadence and the specific configuration-change triggers that require an out-of-cycle repeat of this checklist for this service.",
        result: "Pending verification for each service reviewed",
      },
    ],
  },
  diagram: buildDiagram(),
};

function buildDiagram(): FlowDiagramSpec {
  return {
    titleId: "network-exposure-root-cause-diagram",
    title: "Fictional intended-versus-actual reachability flow",
    desc: "A fictional example: a documented internal-only reporting service flows through a load-balancer listener into a restricted security-group rule and, normally, ends up reachable only as intended. Interactive: toggle between the normal flow and a failure view showing what happens when the load-balancer listener rule is left broader than the security group beneath it, making the service reachable from the public internet despite the security group looking correctly restrictive, and explore each node for detail.",
    viewBox: "0 0 900 340",
    failureLabel: "Broad-listener exposure failure path",
    caption:
      "Documented internal-only intent → load-balancer listener → restricted security-group rule → reachable only as intended, normally. The failure view shows what happens when the load-balancer listener rule is left broader than the security group beneath it — for example, reusing a public-facing listener for this internal-only service — so traffic relayed through the load balancer reaches the service from the public internet even though the security group's own rule still looks correctly restrictive.",
    motionDuration: 2600,
    mainPacketRoute: { d: "M170,160 H220 M390,160 H440 M600,160 H650", length: 150 },
    edges: [
      { id: "intent-lb", from: "intent", to: "loadbalancer", d: "M170,160 H220", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "lb-sg", from: "loadbalancer", to: "securitygroup", d: "M390,160 H440", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "sg-confirmed", from: "securitygroup", to: "confirmed", d: "M600,160 H650", length: 50, kind: "main", activeIn: ["normal"] },
      {
        id: "lb-exposed",
        from: "loadbalancer",
        to: "exposed",
        d: "M305,200 C305,260 560,260 560,250",
        length: 300,
        kind: "failure",
        activeIn: ["failure"],
      },
    ],
    nodes: [
      {
        id: "intent",
        label: "Documented internal-only intent",
        x: 10,
        y: 120,
        w: 160,
        h: 80,
        activeIn: ["normal", "failure"],
        description:
          "The written statement of what this fictional reporting service is supposed to allow: specific internal sources only, on a documented port and protocol, with the public internet explicitly excluded. Every layer downstream is supposed to enforce this, not just the layer closest to the service.",
      },
      {
        id: "loadbalancer",
        label: "Load-balancer / reverse-proxy listener",
        x: 220,
        y: 120,
        w: 170,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Load-balancer or reverse-proxy listener — the actual public-facing edge of the system, and the layer most likely to be scoped more broadly than the service behind it, especially when a listener is reused from another service",
        description:
          "The load balancer or reverse proxy that sits in front of the fictional reporting service. In the normal flow its listener is scoped to match the documented intent. In the failure view, its listener rule was reused from a public-facing service and left broader than intended — the root cause this diagram illustrates.",
      },
      {
        id: "securitygroup",
        label: "Restricted security-group rule",
        x: 440,
        y: 120,
        w: 160,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Restricted security-group rule — looks correctly scoped to internal sources on its own, but implicitly trusts traffic relayed through the load balancer, so a broader listener upstream can bypass what this rule alone appears to enforce",
        description:
          "The service's own security-group rule, correctly scoped to allow only the documented internal sources. This rule looks right in isolation in both the normal and failure views — the failure here is invisible if this layer is the only one reviewed, because the security group itself never changed.",
      },
      {
        id: "confirmed",
        label: "Reachable only as intended",
        x: 650,
        y: 120,
        w: 190,
        h: 80,
        activeIn: ["normal"],
        role: "safe",
        description:
          "The outcome when every layer — the load balancer's listener and the security group beneath it — actually matches the documented internal-only intent: the fictional reporting service is reachable only from the sources it was designed for.",
      },
      {
        id: "exposed",
        label: "Reachable from the public internet (should never happen)",
        x: 440,
        y: 250,
        w: 280,
        h: 60,
        activeIn: ["failure"],
        role: "blocked",
        focusableLabel:
          "Reachable from the public internet — reached directly from the load balancer once its listener rule is broader than the security group beneath it, bypassing what the security group alone would otherwise appear to enforce",
        description:
          "This becomes reachable once the load balancer's listener rule is broader than intended: traffic relayed through the load balancer is implicitly trusted by the service's security group, so widening the listener alone is enough to expose the service, even though the security-group rule itself never changed and still looks correctly restrictive on inspection.",
      },
    ],
  };
}
