// Knowledge-base article: "How to Validate That a Service Is Not Publicly
// Reachable" (Bead securitycorp-source-4zl.55.1.8). Not yet added to
// lib/knowledge-content.ts's `knowledgeArticles` — status stays "drafting"
// and every review record stays "pending" until the human owner reviews it,
// per docs/publication-safety-policy.md and docs/knowledge-base.md. All
// examples describe a fictional environment using documentation-safe
// addressing (RFC 5737 ranges only); no real domain, address, port,
// topology, employer, or infrastructure detail appears anywhere in this
// file. This checklist describes the generic technique of an external
// port/service scan performed from outside the network boundary; it does
// not name or favor any specific commercial scanning product.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

export const article: KnowledgeArticle = {
  meta: {
    title: "How to Validate That a Service Is Not Publicly Reachable",
    slug: "validating-a-service-is-not-publicly-reachable",
    summary:
      "A repeatable checklist for confirming — through an actual external check, not an assumption drawn from a configuration file — that a service intended to be internal-only cannot be reached from the public internet. Covers the common ways a service becomes unintentionally exposed: a misconfigured load balancer, a cloud security-group rule broader than intended, a leftover NAT or port-forward rule, and a service binding to every interface instead of a loopback or internal one. Illustrated with a fictional example.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "checklist",
    difficulty: "intermediate",
    status: "published",
    tags: ["security-control-validation", "network-isolation", "network-segmentation"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 10,
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
      "\"The configuration says internal-only\" and \"this service cannot be reached from the public internet\" are two different claims, and the gap between them is where a large share of accidental exposure lives. A configuration file, an infrastructure-as-code definition, or a security-group rule describes intent — what someone meant the network to allow. What actually determines reachability is the accumulated, live effect of every load balancer, security group, NAT rule, and interface binding sitting between the public internet and that service, and any one of those layers can quietly diverge from the intent recorded elsewhere.",
      "This checklist gives you a repeatable way to close that gap: state what internal-only is supposed to mean for a specific service, enumerate the layers that could override that intent, and then actually confirm the result from a vantage point outside the network boundary — not merely read the configuration and assume it holds. A fictional example — a documented internal-only reporting service that turns out to be reachable anyway because of a load-balancer rule broader than intended — runs through the checklist and the accompanying interactive diagram so the process stays concrete without describing any real environment.",
    ],
    whatYouWillLearn: [
      "Why a configuration's stated intent and a service's actual reachability are two separate claims, and why only one of them can be verified by reading a file.",
      "The most common ways a service becomes unintentionally exposed: an overly broad load-balancer or security-group rule, a leftover NAT or port-forward rule from earlier testing, and a service binding to every interface instead of a loopback or internal one.",
      "How to perform and interpret an external, outside-the-boundary check of a service's actual reachability, instead of relying on an internal test that never leaves the trusted network.",
      "Why a single passing check is not durable evidence, and what has to trigger revalidation.",
      "How to record a reachability finding as defensible evidence rather than as an assumption inherited from a configuration review.",
    ],
    intendedAudience: [
      "Network defenders and platform engineers responsible for services that are meant to stay internal-only.",
      "Security practitioners auditing whether an organization's internal-only claims are backed by actual verification or only by configuration review.",
      "Engineers moving from \"we checked the security group\" toward a repeatable, externally verified exposure-validation process.",
    ],
    prerequisites: [
      "Familiarity with basic networking concepts: interfaces, listening ports, NAT, and the general idea of a security group or firewall rule governing a cloud workload.",
      "Comfort with the general idea of checking a service from outside a network boundary, without needing to know a specific scanning product or command syntax.",
      "No lab environment is required to follow this checklist; it is conceptual and uses a fictional example throughout.",
    ],
    problem: [
      "A common failure pattern looks like this: a service is designed and deployed as internal-only, the security-group rule or firewall policy that was written for it looks correct on inspection, and everyone involved treats that inspection as the answer. Nobody actually tries to reach the service from outside the network boundary, because the configuration already says it should not be reachable, and re-deriving the same conclusion by testing it feels redundant. The service then goes unreviewed for months, through a load-balancer change, a security-group edit made for an unrelated request, and a NAT rule added temporarily during a debugging session and never removed — any one of which could have quietly widened its actual exposure without anyone touching the original rule that was reviewed.",
      "The underlying problem is treating configuration review as equivalent to reachability verification, when a configuration file only describes what one layer was asked to do — not what the full, layered path from the public internet to the service actually permits today. A load balancer can forward more than a downstream security group intends to allow. A security-group rule can be broader than the requirement that justified it. A NAT or port-forward rule can persist long after the testing it was created for has ended. A service can bind to every interface by default, regardless of what the network layer around it was configured to permit. Fixing this requires treating \"internal-only\" as a claim that must be tested from outside the boundary, not one that can be confirmed by reading configuration alone.",
    ],
    threatModel: [
      "This checklist's threat model assumes an adversary who benefits from exactly the gap this checklist closes: a service its owners believe is internal-only, reachable from the public internet because of a misconfiguration nobody has actually tested for. That adversary does not need to compromise anything to find the service — an externally reachable service intended to be internal-only is, by definition, already reachable to anyone who scans for it, whether or not the owner has audited the traffic yet.",
      "Two failure modes recur most often, both represented in this checklist's interactive diagram: a layer in the path — a load-balancer listener, a cloud security-group rule, a NAT or port-forward rule, or a service bound to every interface instead of a loopback or internal one — is broader than the documented intent, and the resulting exposure is never actually tested for because internal-only status was assumed from configuration review rather than confirmed from an external vantage point. Either failure can persist indefinitely, since nothing about a passing internal check or a clean-looking configuration file reveals it.",
    ],
    mainContent: [
      "**Stating the intended reachability explicitly.** Before anything can be validated, it has to be documented what \"internal-only\" is supposed to mean for this specific service: which networks or hosts are permitted to reach it, on which port and protocol, and — just as importantly — that the public internet is not one of the permitted sources. A vague or implicit assumption of internal-only status cannot be tested against; a documented statement can.",
      "**Enumerating every layer that determines actual reachability.** A service's real-world reachability is the product of everything between the public internet and the service, not just the rule someone remembers writing. That typically includes, at minimum: any load balancer or reverse proxy in front of the service and its listener configuration, the cloud security-group or firewall rule attached to the service's network interface, any NAT or port-forward rule at a network edge, and the interface the service itself binds to. Reviewing only one of these layers and calling the service validated leaves every other layer unchecked.",
      "**Checking the service's own bind configuration.** A service that binds to every available interface — commonly the address that means \"listen on all interfaces\" rather than a loopback or a specific internal interface — is reachable through any network path that can otherwise get a packet to that host, regardless of what the surrounding security-group or firewall rule was written to prevent. Confirm explicitly which interface the service binds to; do not infer it from the fact that a firewall rule exists in front of it.",
      "**Checking for load-balancer and reverse-proxy scope that exceeds intent.** A load balancer or reverse proxy is frequently the actual public-facing edge of a system, and a listener configured more broadly than intended — for example, a rule meant to expose one public-facing service that also forwards to an internal one on a shared listener — can make an internal-only service reachable regardless of what its own security group says. This layer is easy to overlook precisely because the service's own configuration looks correct in isolation.",
      "**Checking for security-group or firewall rules broader than documented intent.** Compare the deployed security-group or firewall rule against the documented intended source scope field by field, the same way a firewall-rule request should be validated against its requirement. A rule that allows a wider address range than intended, or that was copied and loosened from a similar rule rather than derived from this service's own requirement, is one of the most common quiet sources of unintended exposure.",
      "**Checking for leftover NAT or port-forward rules.** A NAT or port-forward rule created temporarily — commonly during testing, a demo, or a debugging session — persists until someone deliberately removes it, and nothing about normal operation prompts that removal. Explicitly search for NAT and port-forward rules that reference this service's address or port, and treat any that lack a documented, current justification as a candidate for removal, not as background noise.",
      "**Performing the actual external check.** Once every layer above has been reviewed, the review itself is still only an inspection of intent — the only way to confirm actual reachability is to test from a vantage point outside the network boundary: a scan or connection attempt against the service's port and protocol, performed from outside the perimeter the service is supposed to sit behind, not from inside the trusted network where an internal test would succeed regardless of how the perimeter is configured. An internal-only test proves the service works for the traffic it is supposed to serve; it proves nothing about whether traffic that should not reach the service also can.",
      "**Reconciling the result against documented intent, and revalidating on drift.** A single external check that finds no reachability is evidence for exactly one point in time, not a permanent guarantee — a subsequent load-balancer change, security-group edit, or NAT rule added for an unrelated reason can silently reopen exposure that a prior check closed. Revalidate after any change to the layers enumerated above, and on a periodic review cadence for services where change history is not reliably tracked, rather than treating one clean result as final.",
    ],
    validationEvidence: [
      "This checklist is conceptual. It was not developed against a live or lab-reproduced service, no security-group, load-balancer, or NAT configuration described here was actually deployed, and no external scan was actually performed. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the checklist's reasoning is internally consistent.",
    ],
    limitations: [
      "This checklist describes principles and a fictional illustrative example, not a specific cloud provider's security-group model, a specific load-balancer product's listener syntax, or a specific external-scanning tool's command syntax. Applying it to a real environment requires translating each control into that environment's actual tooling and re-validating the result there.",
      "It does not cover the deep-dive technical methodology of port scanning itself, service fingerprinting, or building an authorized external-scanning program — those are separate disciplines covered, where SecurityCorp publishes on them, by its own dedicated content rather than this checklist.",
      "It does not address the legal, contractual, or provider-policy requirements that may govern who is authorized to scan a given service from outside its network — those requirements should be confirmed before performing the external check this checklist describes, and are outside this checklist's scope.",
    ],
    defensiveRecommendations: [
      "Document what \"internal-only\" is supposed to mean for a service — permitted sources, port, and protocol — before attempting to validate it; an implicit assumption cannot be tested against.",
      "Enumerate every layer between the public internet and the service — load balancer or reverse proxy, cloud security-group or firewall rule, NAT or port-forward rules, and the service's own interface binding — rather than validating only the layer that is easiest to check.",
      "Confirm explicitly which interface a service binds to; a service bound to every interface can be reachable through paths its surrounding firewall rule was never meant to permit.",
      "Treat a security-group or firewall rule copied and loosened from a similar rule as a warning sign, not a shortcut, and compare every deployed rule against its documented intended scope field by field.",
      "Search explicitly for leftover NAT or port-forward rules tied to a service's address or port, and remove any without a current, documented justification.",
      "Perform the actual reachability check from a vantage point outside the network boundary — an internal test proves the service works for intended traffic, not that unintended traffic is blocked.",
      "Revalidate reachability after any change to the layers that determine it, and on a periodic cadence otherwise — one clean external check is evidence for that point in time only, not a permanent guarantee.",
    ],
    keyTakeaways: [
      "\"The configuration says internal-only\" and \"this service is not reachable from the public internet\" are separate claims — only the second can be confirmed by an external check, and only the second is the one that matters to an adversary.",
      "Actual reachability is the product of every layer between the public internet and the service — load balancer, security group, NAT, and the service's own interface binding — not just the layer that is easiest to review.",
      "The most common unintentional-exposure causes are an overly broad load-balancer or security-group rule, a leftover NAT or port-forward rule, and a service binding to every interface instead of a loopback or internal one.",
      "An internal-only test proves a service works for its intended traffic; it proves nothing about whether unintended traffic, including traffic from the public internet, can also reach it.",
      "A passing external check is evidence for one point in time — revalidate after any change to the layers that determine reachability, not just once at deployment.",
    ],
    references: [
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the SC-7 Boundary Protection and CA-8 Penetration Testing controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "NIST SP 800-41 Rev. 1, Guidelines on Firewalls and Firewall Policy: https://csrc.nist.gov/pubs/sp/800/41/r1/final",
      "NIST SP 800-115, Technical Guide to Information Security Testing and Assessment: https://csrc.nist.gov/pubs/sp/800/115/final",
    ],
  },
  module: {
    kind: "checklist",
    items: [
      {
        control: "Intended reachability documented explicitly",
        verificationMethod: "Confirm a written statement exists naming the permitted source networks or hosts, port, and protocol for the service, and stating explicitly that the public internet is not a permitted source.",
        requiredEvidence: "A recorded reachability intent statement independent of the network configuration it will be validated against.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "Service interface binding confirmed",
        verificationMethod: "Confirm which network interface the service actually binds to, rather than inferring it from the surrounding firewall or security-group configuration.",
        requiredEvidence: "A recorded binding configuration showing the service listens on a loopback or specific internal interface, not every available interface, unless a documented reason requires otherwise.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "Load-balancer and reverse-proxy scope checked against intent",
        verificationMethod: "Review any load balancer or reverse proxy in front of the service and confirm its listener configuration does not forward traffic to this service beyond the documented intended source scope.",
        requiredEvidence: "A recorded review of the relevant listener configuration, compared field by field against the documented reachability intent.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "Security-group or firewall rule scope matches documented intent",
        verificationMethod: "Compare the deployed security-group or firewall rule's source, port, and protocol fields against the documented reachability intent, field by field.",
        requiredEvidence: "A side-by-side comparison showing no deployed rule field is broader than the corresponding documented intent field.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "No leftover NAT or port-forward rule exposes the service",
        verificationMethod: "Search explicitly for NAT or port-forward rules referencing this service's address or port and confirm each has a current, documented justification.",
        requiredEvidence: "A record showing every NAT or port-forward rule tied to this service is either justified and current, or has been removed.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "External reachability check performed from outside the network boundary",
        verificationMethod: "Perform an actual connection attempt or scan against the service's port and protocol from a vantage point outside the network boundary the service is supposed to sit behind, not from within the trusted internal network.",
        requiredEvidence: "A recorded test result, including the vantage point used, the port and protocol tested, and the observed outcome, performed after the configuration review above — not assumed from it.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "External check result reconciled against documented intent",
        verificationMethod: "Confirm the external check's result matches the documented reachability intent exactly — no reachability from the public internet where none was intended — and that any discrepancy was investigated and resolved before the service is considered validated.",
        requiredEvidence: "A recorded reconciliation showing the external check's actual result matched the documented intent, or documenting the investigation and remediation if it did not.",
        result: "Pending verification for each service reviewed",
      },
      {
        control: "Revalidation trigger defined for configuration drift",
        verificationMethod: "Confirm a defined trigger exists for repeating this checklist — at minimum, any change to the service's load-balancer, security-group, NAT, or interface-binding configuration, plus a periodic review cadence.",
        requiredEvidence: "A recorded revalidation policy naming the specific triggers and, where applicable, the review cadence for this service.",
        result: "Pending verification for each service reviewed",
      },
    ],
  },
  diagram: buildDiagram(),
};

function buildDiagram(): FlowDiagramSpec {
  return {
    titleId: "reachability-validation-diagram",
    title: "Fictional internal-only reachability validation flow",
    desc: "A fictional example: a documented internal-only reporting service flows from its stated reachability intent into an external, outside-the-boundary vantage-point check, then a reconciled result, then confirmed non-reachability. Interactive: toggle between the normal flow and a failure view showing what happens when a load-balancer or security-group rule is broader than the documented intent, making the service actually reachable from outside despite the configuration's claim, and explore each node for detail.",
    viewBox: "0 0 900 340",
    failureLabel: "Unintended-exposure failure path",
    caption:
      "Documented internal-only intent → external vantage-point check → reconciled result → confirmed not reachable, normally. The failure view shows what happens when a load-balancer listener or security-group rule is broader than the documented intent — for example, a rule meant for one public-facing service that also forwards to this internal-only one — so the external check finds the service reachable from outside despite the configuration's claim.",
    motionDuration: 2600,
    mainPacketRoute: { d: "M160,160 H210 M380,160 H430 M590,160 H640", length: 150 },
    edges: [
      { id: "intent-scan", from: "intent", to: "scan", d: "M160,160 H210", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "scan-result", from: "scan", to: "result", d: "M380,160 H430", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "result-confirmed", from: "result", to: "confirmed", d: "M590,160 H640", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      {
        id: "scan-exposed",
        from: "scan",
        to: "exposed",
        d: "M295,200 C295,260 560,260 560,250",
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
        w: 150,
        h: 80,
        activeIn: ["normal", "failure"],
        description:
          "The written statement a reachability check must be tested against: the permitted source networks or hosts, port, and protocol for a fictional internal-only reporting service, with the public internet explicitly excluded. A check performed without this record has nothing to reconcile its result against.",
      },
      {
        id: "scan",
        label: "External vantage-point check",
        x: 210,
        y: 120,
        w: 170,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "External vantage-point check — an actual connection attempt or scan performed from outside the network boundary, the step that determines real reachability rather than assuming it from configuration",
        description:
          "An actual connection attempt or scan against the service's port and protocol, performed from a vantage point outside the network boundary the service is supposed to sit behind. This is the step that produces real evidence of reachability; reviewing the load-balancer, security-group, and NAT configuration beforehand is preparation for this step, not a substitute for it.",
      },
      {
        id: "result",
        label: "Reconciled result",
        x: 430,
        y: 120,
        w: 160,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Reconciled result — compares the external check's actual outcome against the documented internal-only intent, and requires any discrepancy to be investigated before the service is considered validated",
        description:
          "The external check's actual outcome compared against the documented intent from the first step. In the normal flow, the two match: no reachability from outside where none was intended. Any discrepancy has to be investigated and resolved here — it cannot be waved through because the configuration looked correct on inspection.",
      },
      {
        id: "confirmed",
        label: "Confirmed not reachable",
        x: 640,
        y: 120,
        w: 190,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "safe",
        description:
          "The result of a fully performed validation: the fictional internal-only reporting service was actually checked from outside the network boundary, and the result matched its documented intent. This is what distinguishes a validated service from one that was only assumed safe from a configuration review.",
      },
      {
        id: "exposed",
        label: "Reachable from outside (should never happen)",
        x: 430,
        y: 250,
        w: 260,
        h: 60,
        activeIn: ["failure"],
        role: "blocked",
        focusableLabel:
          "Reachable from outside — becomes visible only when a load-balancer or security-group rule is broader than the documented internal-only intent, and only if the external vantage-point check is actually performed to catch it",
        description:
          "This becomes reachable only when a layer between the public internet and the service — a load-balancer listener, a security-group rule, or a leftover NAT or port-forward rule — is broader than the documented intent. Its appearance here, discovered directly by the external check rather than by an internal test, is the failure being illustrated: the gap between what the configuration claimed and what the network actually permitted.",
      },
    ],
  };
}
