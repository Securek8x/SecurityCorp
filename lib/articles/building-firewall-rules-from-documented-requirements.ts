// Knowledge-base article: "Building Firewall Rules from Documented
// Requirements" (Bead securitycorp-source-4zl.55.1.5). Not yet added to
// lib/knowledge-content.ts's `knowledgeArticles` — status stays "drafting"
// and every review record stays "pending" until the human owner reviews it,
// per docs/publication-safety-policy.md and docs/knowledge-base.md. All
// examples describe a fictional environment using documentation-safe
// addressing (RFC 5737 ranges only); no real domain, address, port,
// topology, employer, or infrastructure detail appears anywhere in this
// file.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

export const article: KnowledgeArticle = {
  meta: {
    title: "Building Firewall Rules from Documented Requirements",
    slug: "building-firewall-rules-from-documented-requirements",
    summary:
      "A repeatable checklist for turning a documented business or technical requirement into a specific, least-privilege firewall rule, and confirming — through testing rather than assumption — that the deployed rule does exactly what it claims. Illustrated with a fictional two-tier example.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "checklist",
    difficulty: "intermediate",
    status: "published",
    tags: ["access-control", "least-privilege", "security-control-validation", "network-segmentation"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 10,
    publishedAt: "2026-08-31",
    lastReviewedAt: "2026-08-31",
    updatedAt: "2026-08-30",
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
      "A firewall rule that exists is not the same as a firewall rule that was actually derived from a documented requirement. Most rule sets that grow unmanageable over time did not start that way — they accumulate one convenience at a time: a rule copied from a similar one and widened 'just to be safe,' a request approved verbally and never written down, a temporary access grant with no review date. None of those failures require a sophisticated attacker; they only require nobody checking, later, whether the deployed rule actually matches what was asked for.",
      "This checklist gives you a repeatable way to go from a documented requirement to a least-privilege rule, keep a traceable record of why the rule exists, and validate — from the position of the traffic the rule is supposed to govern — that it permits exactly what was documented and nothing else. A fictional two-tier example (a reporting service that needs read access to a documented data store) runs through the checklist and the accompanying interactive diagram so the process stays concrete without describing any real environment.",
    ],
    whatYouWillLearn: [
      "What a firewall-rule request must document before a rule is drafted, and why a verbal or chat-based request is not sufficient input.",
      "How to derive a least-privilege rule from a requirement's actual source, destination, protocol, and service — instead of defaulting to a wider scope for convenience.",
      "Why copying and loosening an existing rule is one of the most common ways a firewall accumulates unjustified access.",
      "How to keep a change and approval trail that lets a later audit tell a validated rule apart from an assumed one.",
      "How to validate a deployed rule from the position of the actual documented source, confirming both that permitted traffic passes and that everything else is denied by default.",
    ],
    intendedAudience: [
      "Network defenders and platform engineers who draft or approve firewall rule changes.",
      "Security practitioners auditing an existing rule set to find rules that no longer trace to a documented justification.",
      "Engineers moving from ad hoc rule requests toward a requirement-driven change-control process.",
    ],
    prerequisites: [
      "Familiarity with basic firewall or access-control-list concepts (source, destination, protocol, and a permit/deny decision).",
      "Comfort reading a change ticket or access-request record.",
      "No lab environment is required to follow this checklist; it is conceptual and uses a fictional example throughout.",
    ],
    problem: [
      "A common failure pattern looks like this: someone needs a new connection to work, so they ask for 'access to the reporting database' or 'a rule like the one the other team has.' The person drafting the rule, wanting to unblock the requester quickly and not wanting to be the reason a legitimate need gets denied, drafts something broader than the actual need — a wider address range than the one host that actually requires access, every protocol instead of the one the service uses, or a copy of an existing rule with the destination changed and the rest left untouched. The rule gets deployed, the requester's traffic works, and the ticket closes. Nobody tests whether traffic the requirement never authorized also works — because the rule appears to do its job.",
      "The underlying problem is treating 'the access works' as proof that the rule is correct, when it only proves the rule is not too narrow. A rule can be simultaneously functional for its intended purpose and far broader than its documented justification. Fixing this requires a documented requirement to exist before a rule is drafted, a rule derived narrowly from that requirement's specific fields, and a validation step performed from the untrusted side that checks for excess permission, not just for intended function.",
    ],
    threatModel: [
      "This checklist's threat model assumes an adversary who benefits from any gap between a rule's documented justification and its actual scope — a compromised host that turns out to have more reach than its role required, a decommissioned system whose access grant was never revoked, or an internal party who discovers that a rule intended for one narrow purpose also happens to permit something it should not. The relevant question is not 'does the requester's traffic work' but 'does the deployed rule permit exactly the source, destination, protocol, and service the requirement documented, and nothing broader.'",
      "Two failure modes recur most often, both represented in this checklist's interactive diagram: a rule drafted broader than its requirement (a wider address range, an unrestricted protocol, or a copied rule loosened for convenience) that lets unintended traffic reach a resource the requirement never authorized, and a rule that was never actually tested from the position of the traffic it governs, so the gap between documented intent and deployed behavior goes unnoticed until it is exploited.",
    ],
    mainContent: [
      "**Documenting the requirement before drafting a rule.** A rule should never be drafted from a verbal request, a chat message, or an inference about what someone 'probably means.' The documented requirement must state the specific source (a host or a narrowly scoped range, not a broad supernet chosen for convenience), the specific destination, the protocol, the single service the connection is for, the business justification, the requester, and an expected duration or review date. If any of these fields is missing, the correct response is to ask for it — not to fill the gap with the widest option that will not need revisiting.",
      "**Deriving a least-privilege rule from the requirement.** Once the requirement is documented, the rule should mirror it exactly: the narrowest source the requirement actually names, the narrowest destination, the specific protocol, and the specific service — never 'any' in a field the requirement did not leave open. If the requirement names one host, the rule should permit one host, not the subnet that host happens to live in. If the requirement names one direction of traffic, the rule should not also permit the reverse direction on the assumption that it will probably be needed eventually.",
      "**Resisting the copy-and-loosen pattern.** One of the most common ways a firewall accumulates unjustified access is by copying an existing rule that looks similar and loosening it to fit the new request, rather than deriving a new rule independently from the new requirement. A copied rule inherits whatever scope creep the original rule had already accumulated, and loosening it to fit a new destination often loosens fields that had nothing to do with the new request. Every rule should be traceable to its own requirement, not to the rule it happened to be copied from.",
      "**Maintaining a change and approval trail.** Every deployed rule should carry a reference back to the specific documented requirement that justified it, a record of who approved it, and a review or expiration date. Without a review date, a temporary access grant becomes a permanent one by default — not through a deliberate decision, but because nobody was ever prompted to reconsider it. A rule set that cannot answer 'why does this rule exist, and is it still needed' for every entry is not a managed rule set; it is an accumulation.",
      "**Validating the deployed rule, not the rule's text.** A rule that has been deployed and appears to work is not the same as a rule that has been validated. Validation means testing from a position that represents the documented source — not a position with broader existing access — and confirming two separate things: that the traffic the requirement documented actually succeeds, and that traffic outside the documented scope (a different source, a different destination, a different protocol, or a different service) is denied by default. Confirming only the first half proves the rule is not too narrow; confirming the second half is what proves the rule is not too broad, and both are required before a rule can be considered validated rather than assumed.",
    ],
    validationEvidence: [
      "This checklist is conceptual. It was not developed against a live or lab-reproduced firewall, no rule described here was deployed, and no traffic test was actually performed. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the checklist's reasoning is internally consistent.",
    ],
    limitations: [
      "This checklist describes principles and a fictional illustrative example, not a specific vendor's firewall syntax, a specific cloud provider's security-group model, or a specific policy-as-code tool. Applying it to a real environment requires translating each control into that environment's actual rule language and re-validating the result there.",
      "It does not cover automated rule-linting or policy-as-code enforcement in depth, beyond noting that automated checks can catch some of these controls mechanically but do not substitute for a documented requirement or a human approval decision.",
      "It does not address detection of exploitation once an overly broad rule has already been abused — that is covered by SecurityCorp's detection and incident-response content, not this checklist.",
    ],
    defensiveRecommendations: [
      "Require a documented requirement — source, destination, protocol, service, justification, requester, and review date — before any firewall rule is drafted.",
      "Derive each rule's scope narrowly from the requirement's actual fields; never widen a field the requirement did not leave open, even for convenience.",
      "Treat copying and loosening an existing rule as a warning sign, not a shortcut — derive each rule independently from its own requirement.",
      "Give every deployed rule a traceable reference to its requirement and approval record, plus a review or expiration date so temporary access does not become permanent by default.",
      "Validate every deployed rule from a position representing the documented source: confirm the documented traffic succeeds and that traffic outside the documented scope is denied by default.",
      "Treat 'the access works' and 'the rule was validated' as two separate gates — passing the first proves the rule is not too narrow, not that it is correctly scoped.",
    ],
    keyTakeaways: [
      "A firewall rule should be derived from a documented requirement's specific fields, not from a verbal request or an inference about intent.",
      "Least privilege means matching the requirement's actual source, destination, protocol, and service — never defaulting to a wider scope for convenience.",
      "Copying and loosening an existing rule inherits that rule's prior scope creep and is one of the most common quiet failures in rule management.",
      "A rule without a traceable requirement, approval record, and review date drifts from temporary to permanent without anyone deciding that it should.",
      "Validating a rule requires confirming both that the documented traffic succeeds and that traffic outside the documented scope is denied — confirming only the first proves nothing about excess permission.",
    ],
    references: [
      "NIST SP 800-41 Rev. 1, Guidelines on Firewalls and Firewall Policy: https://csrc.nist.gov/pubs/sp/800/41/r1/final",
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the AC-4 Information Flow Enforcement and CM-3 Configuration Change Control controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "NIST SP 800-53 Rev. 5 (see the SC-7 Boundary Protection control): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    ],
  },
  module: {
    kind: "checklist",
    items: [
      {
        control: "Documented requirement exists",
        verificationMethod: "Confirm the rule request references a written requirement, not a verbal or chat-based ask.",
        requiredEvidence: "A change ticket or request record capturing the requirement independent of the rule text itself.",
        result: "Pending verification for each rule request",
      },
      {
        control: "Requirement specifies exact source, destination, protocol, and service",
        verificationMethod: "Check that the requirement names a specific source and destination rather than a range chosen for convenience, and a single protocol and service rather than an open-ended set.",
        requiredEvidence: "The requirement's recorded source, destination, protocol, and service fields, each specific rather than broad-by-default.",
        result: "Pending verification for each rule request",
      },
      {
        control: "Drafted rule scope matches the requirement exactly",
        verificationMethod: "Compare the rule's source, destination, protocol, and service fields against the requirement field by field.",
        requiredEvidence: "A side-by-side comparison showing no rule field is broader than the corresponding requirement field.",
        result: "Pending verification for each rule request",
      },
      {
        control: "Rule was derived independently, not copied and loosened from an existing rule",
        verificationMethod: "Ask how the rule was authored; if based on an existing rule, confirm every field was re-derived from this requirement rather than inherited.",
        requiredEvidence: "A record showing the rule's fields trace to this requirement, not to an unrelated rule's prior scope.",
        result: "Pending verification for each rule request",
      },
      {
        control: "Rule carries a traceable approval record and a review or expiration date",
        verificationMethod: "Confirm the deployed rule references its approving requirement and has a recorded review or expiration date.",
        requiredEvidence: "A rule annotation, ticket link, or inventory entry showing approver, justification reference, and review date.",
        result: "Pending verification for each rule request",
      },
      {
        control: "Documented traffic was tested from the position of the actual source",
        verificationMethod: "Generate or observe traffic from a position representing the documented source and confirm it succeeds through the deployed rule.",
        requiredEvidence: "A recorded test result showing the documented traffic passing, performed after deployment, not assumed from the rule's text.",
        result: "Pending verification for each rule request",
      },
      {
        control: "Traffic outside the documented scope was tested and denied",
        verificationMethod: "From the same untrusted-side position, attempt traffic that differs from the requirement in source, destination, protocol, or service, and confirm it is denied.",
        requiredEvidence: "A recorded test result showing out-of-scope traffic denied by default, not merely an assumption based on the rule's stated scope.",
        result: "Pending verification for each rule request",
      },
    ],
  },
  diagram: buildDiagram(),
};

function buildDiagram(): FlowDiagramSpec {
  return {
    titleId: "firewall-requirement-rule-diagram",
    title: "Fictional requirement-to-rule-to-validation flow",
    desc: "A fictional example: a documented requirement (a reporting service needs read access to a documented data store) flows into a drafted rule, then a validation test, then the permitted destination. Interactive: toggle between the normal flow and a failure view showing what happens when a rule is drafted broader than its requirement, and explore each node for detail.",
    viewBox: "0 0 900 340",
    failureLabel: "Overbroad-rule failure path",
    caption:
      "Documented requirement → drafted rule → validation test → permitted destination, normally. The failure view shows what happens when a rule is drafted broader than its requirement — for example, a documented single-host source translated into a wider address range 'to be safe' — reaching a destination the requirement never authorized, without ever being caught by validation.",
    motionDuration: 2600,
    mainPacketRoute: { d: "M160,160 H210 M380,160 H430 M590,160 H640", length: 150 },
    edges: [
      { id: "requirement-rule", from: "requirement", to: "rule", d: "M160,160 H210", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "rule-validation", from: "rule", to: "validation", d: "M380,160 H430", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      { id: "validation-destination", from: "validation", to: "destination", d: "M590,160 H640", length: 50, kind: "main", activeIn: ["normal", "failure"] },
      {
        id: "rule-unintended-destination",
        from: "rule",
        to: "unintended",
        d: "M295,200 C295,260 545,260 545,250",
        length: 300,
        kind: "failure",
        activeIn: ["failure"],
      },
    ],
    nodes: [
      {
        id: "requirement",
        label: "Documented requirement",
        x: 10,
        y: 120,
        w: 150,
        h: 80,
        activeIn: ["normal", "failure"],
        description:
          "The written record a rule must be derived from: a specific source (for example, a single fictional host such as 203.0.113.10), a specific destination, a protocol, a service, a business justification, and a review date. A rule drafted without this record has nothing to be validated against.",
      },
      {
        id: "rule",
        label: "Drafted firewall rule",
        x: 210,
        y: 120,
        w: 170,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Drafted firewall rule — the point where a documented requirement is translated into an enforceable permit/deny decision; the failure view shows what happens when this translation is broader than the requirement",
        description:
          "Where the requirement is translated into an enforceable rule. In the normal flow, the rule's source, destination, protocol, and service match the requirement's fields exactly. The failure view shows the same step producing a rule broader than the requirement — for example, a range in place of the one documented host — which is the point where excess permission actually enters the system.",
      },
      {
        id: "validation",
        label: "Validation test",
        x: 430,
        y: 120,
        w: 160,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "boundary",
        focusableLabel:
          "Validation test — confirms, from a position representing the documented source, that permitted traffic succeeds and out-of-scope traffic is denied",
        description:
          "Tests the deployed rule from a position representing the documented source, confirming both that the documented traffic succeeds and that traffic outside the documented scope is denied by default. A rule that has not passed through this step has been deployed, not validated.",
      },
      {
        id: "destination",
        label: "Permitted destination",
        x: 640,
        y: 120,
        w: 190,
        h: 80,
        activeIn: ["normal", "failure"],
        role: "safe",
        description:
          "The specific fictional resource the requirement authorized access to (for example, a documented data store at 198.51.100.20). Only the exact source, protocol, and service the requirement named should ever reach it.",
      },
      {
        id: "unintended",
        label: "Unintended destination (should be blocked)",
        x: 430,
        y: 250,
        w: 230,
        h: 60,
        activeIn: ["failure"],
        role: "blocked",
        focusableLabel:
          "Unintended destination — never authorized by the requirement; reachable only when the drafted rule is broader than its requirement and validation is skipped or inadequate",
        description:
          "A resource the requirement never authorized. It becomes reachable only when the drafted rule is broader than its requirement — the specific failure this diagram illustrates — and only stays reachable if validation never actually tests for out-of-scope traffic. Its appearance here, reached directly from the drafted rule, is the failure being illustrated.",
      },
    ],
  };
}
