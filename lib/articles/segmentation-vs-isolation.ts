// Knowledge-base article: "Segmentation vs Isolation"
// (Bead securitycorp-source-4zl.55.1.2). Not yet added to
// lib/knowledge-content.ts's `knowledgeArticles` — status stays "drafting"
// and every review record stays "pending" until the human owner reviews it,
// per docs/publication-safety-policy.md and docs/knowledge-base.md. All
// examples describe a fictional environment; no real domain, address, port,
// topology, or configuration appears anywhere in this file.
//
// This article is conceptually adjacent to "Understanding Network Trust
// Boundaries" (lib/articles/network-trust-boundaries.ts). That article
// covers finding where a trust boundary belongs; this one assumes a
// boundary has already been identified and focuses specifically on which
// control to apply to it — a controlled path (segmentation) or no path at
// all (isolation) — and where teams conflate the two.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

export const article: KnowledgeArticle = {
  meta: {
    title: "Segmentation vs Isolation",
    slug: "segmentation-vs-isolation",
    summary:
      "Segmentation and isolation are two different controls, not two names for the same one. A decision test for choosing between them once a trust boundary exists, the failure patterns that come from conflating them, and how each is validated differently — illustrated with a fictional zone architecture.",
    pillar: "defend-systems",
    primaryCategory: "network-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "drafting",
    tags: ["network-segmentation", "network-isolation", "access-control", "least-privilege"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 11,
    updatedAt: "2026-08-29",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "pending" },
    technicalReview: { status: "pending" },
    publicationApproval: { status: "pending" },
  },
  sections: {
    executiveSummary: [
      "Segmentation and isolation are not two names for the same control, and treating them as interchangeable is one of the quieter ways a network design fails without anyone noticing. Segmentation divides a network into zones and permits a specific, controlled path between them — a path that is deliberately built, filtered, and monitored because a real requirement needs it to exist. Isolation removes or severely restricts a path so that, under normal operation, nothing should cross it at all. Both are legitimate controls. The mistake is rarely choosing the wrong one outright; it is applying segmentation's mental model — write a tighter rule — to a boundary that actually needed isolation's mental model, which is that there should be no rule to write, because there should be no path.",
      "A related guide, Understanding Network Trust Boundaries, covers how to find where a boundary belongs in the first place. This guide assumes that work is already done — a boundary has been identified — and focuses on the decision that comes next: does this specific boundary get a controlled path or no path at all, and how do you tell which one it actually needs rather than which one is already in place. A fictional architecture with a shared services zone, a finance zone reached through a segmentation gateway, and a legacy control zone that is isolated rather than segmented runs through this guide and its accompanying interactive diagram, so the distinction stays concrete without describing any real environment.",
    ],
    whatYouWillLearn: [
      "The precise, non-interchangeable difference between network segmentation and network isolation.",
      "A decision test for choosing segmentation or isolation for a specific zone-to-zone boundary, based on business justification rather than convenience or what is already configured.",
      "Where teams typically conflate the two controls — including the difference between 'a strict rule' and 'no rule needed because no path exists.'",
      "How segmentation and isolation are each validated differently, and why passing one control's validation says nothing about the other.",
      "What a legitimate rare-access exception to an isolated boundary looks like, and how it differs from quietly turning isolation into a permanent segmented path.",
    ],
    intendedAudience: [
      "Network defenders and platform engineers who have already identified a trust boundary and now need to decide which control to apply to it.",
      "Security practitioners reviewing an existing design who need to tell whether a boundary labeled 'segmented' or 'isolated' actually behaves the way its label claims.",
      "Engineers who have applied segmentation and isolation interchangeably in the past and want a repeatable way to choose correctly going forward.",
    ],
    prerequisites: [
      "Familiarity with the concept of a network trust boundary — see Understanding Network Trust Boundaries for how to identify where one belongs, if that step hasn't been done yet.",
      "Basic comfort with access-control-rule concepts and the idea that a network path can be filtered and logged, or removed entirely.",
      "No lab environment is required to follow this guide; it is conceptual and uses a fictional architecture throughout.",
    ],
    problem: [
      "In practice, 'we isolated it' and 'we segmented it' often describe the same firewall rule, and the difference gets treated as a matter of vocabulary rather than a matter of what actually happens on the wire. That looseness produces two distinct, opposite failures. First: a zone that should have been isolated — no legitimate path, ever — instead gets a segmentation rule that starts narrow and, over a series of individually reasonable 'just this one exception' requests, ends up carrying real traffic no one originally intended. The team continues to call it 'isolated' the whole time, because nobody revisited the label after the first exception was granted.",
      "Second, and less obvious: a zone that only needed a properly segmented path instead gets treated as if it must be fully isolated, and the underlying business need doesn't go away just because the boundary refused it. It gets satisfied through an undocumented workaround instead — a shared jump host, a manual export, a personal remote-access tool — that is far less visible and far less controlled than the filtered, logged rule it was avoiding. Both failures come from the same root cause: choosing a control based on which one is already in place or easiest to justify, instead of asking what the boundary actually requires.",
    ],
    threatModel: [
      "This guide's threat model assumes an adversary who has already gained a foothold on one side of a boundary and is deciding what to do with it — the same assumption Understanding Network Trust Boundaries uses, applied specifically to the segmentation-versus-isolation decision. What a mislabeled boundary buys or costs that adversary depends on which failure occurred. Segmentation misapplied where isolation was required leaves a real, narrow path in place; a compromise on the permitted side can eventually be walked through whatever exceptions accumulated on that path over time, because the path itself was never supposed to exist.",
      "Isolation misapplied where segmentation was actually the correct control produces a different risk: the legitimate need for a path doesn't disappear, so it gets met through an informal side channel instead. Those side channels are typically far less resilient to compromise than a properly filtered and logged path would have been — they rarely appear in the same review process as the documented boundary they were built to route around, and an adversary who finds one inherits a path with essentially no monitoring on it at all.",
    ],
    mainContent: [
      "**What segmentation actually is.** Segmentation divides a network into zones and permits a specific, controlled path between two of them because a real, ongoing requirement needs that path to exist. It is defined by an explicit rule: specific ports, protocols, and direction, evaluated against every attempted crossing, with what is permitted filtered and logged and everything else denied by default. A segmented path is expected to carry traffic — that is the point of it — and it requires ongoing maintenance as the requirement it serves changes, because a rule written for a need that has since expired is a rule that has quietly become broader than it should be.",
      "**What isolation actually is.** Isolation removes or severely restricts a path so that, under normal operation, nothing should cross it at all. It is not 'a very strict segmentation rule' — it is the absence of the interface, route, or reachable service in the first place. Because nothing should cross an isolated boundary, there is nothing routine to log there; a spike in traffic across a supposedly isolated boundary is itself the finding, not evidence the control is working. Any genuine, occasional need to reach an isolated zone — emergency maintenance, incident response, a scheduled audit — has to be handled through a separate, explicitly authorized, time-boxed exception mechanism, not by quietly turning the isolation boundary into a permanent segmented one.",
      "**The decision test.** For a given zone-to-zone boundary, ask whether the target zone has a specific, ongoing, and currently valid business reason to be reached from the source zone — one that can be named, not inferred from the fact that a path already exists. If the answer is yes, segmentation is the correct control, and the rule should be written to match that reason as narrowly as it can be stated. If the answer is no, isolation is correct, and the goal is to remove the path, not to write a rule that merely restricts it. Deciding this way, from the requirement outward, is what keeps the choice from defaulting to whichever control is already configured or easiest to implement.",
      "**Where teams conflate them.** A few patterns recur. A 'temporary' segmentation rule, added for a one-time need and never removed, quietly becomes the permanent state of a boundary that was supposed to be isolated. 'Isolated' gets used to mean 'behind one more firewall hop' rather than 'no route exists' — a boundary can fail a real isolation test while passing every review that only checks whether a permitting rule is present. And a segmented path gets assumed safe because it appears correctly in documentation, without anyone verifying that its live configuration is actually as narrow as the documentation claims it to be.",
      "**Operational cost and the legitimate-exception problem.** Segmentation has an ongoing cost: rules need periodic review against their original justification, logs need monitoring, and configuration drift needs to be caught before an exception becomes the default. Isolation has a different cost: legitimate emergency or scheduled access becomes harder by design, which is the point, but that difficulty has to be answered with a deliberately designed exception path — a break-glass procedure with its own authorization, logging, and expiry — rather than by eroding the isolation boundary itself every time a genuine need arises.",
      "**Validating each control.** Segmentation is validated by confirming, from the boundary's untrusted side, that permitted traffic matches the recorded justification exactly and that everything else is blocked — the same untrusted-side testing principle used for trust boundaries generally. Isolation is validated differently: confirming there is no permitting rule is not the same evidence as confirming there is no route. An isolated boundary should be tested by attempting a connection at the network layer and confirming it fails because no path exists to attempt it on, not merely because a policy engine happened to deny it this time.",
    ],
    validationEvidence: [
      "This guide is conceptual. It was not developed against a live or lab-reproduced environment, no configuration or traffic was reproduced, and no boundary described here was tested end-to-end. Its evidence state is UNVERIFIED and stays UNVERIFIED until a human reviewer records actual reproduction evidence — the label must not be upgraded merely because the reasoning here is internally consistent.",
    ],
    limitations: [
      "This guide assumes a trust boundary has already been identified; it does not cover how to find one in the first place — see Understanding Network Trust Boundaries for that step.",
      "It describes principles and a fictional illustrative architecture, not a specific vendor's firewall syntax, cloud provider's security-group model, or network-access-control product. Applying it to a real environment requires translating each principle into that environment's actual controls and re-validating the result there.",
      "It does not cover identity-centric zero-trust architectures in depth, beyond noting that the segmentation-versus-isolation distinction still applies when the boundary decision is bound to workload or user identity rather than network location — the underlying question of whether a path should exist at all does not go away just because the boundary is enforced differently.",
    ],
    defensiveRecommendations: [
      "For every zone-to-zone boundary, name the specific business reason a path would need to exist before deciding to segment rather than isolate — an unnamed reason is evidence for isolation, not a reason to default to segmentation.",
      "Treat isolation as the removal of a path, not the tightening of a rule; a denied rule and a nonexistent route are different levels of assurance and should be validated differently.",
      "Review every 'temporary' or 'one-time' segmentation rule against its original justification on a recurring schedule, and remove it once that justification has expired rather than leaving it in place because removal is more work.",
      "Design a separate, explicitly authorized, time-boxed exception mechanism for any rare legitimate access to an isolated zone, instead of allowing repeated exceptions to erode the isolation boundary itself.",
      "Validate segmented paths from the untrusted side by testing actual traffic against the documented justification, and validate isolated boundaries by confirming no reachable route exists — not by reading the rule or policy that is assumed to enforce either one.",
      "When a boundary review finds an undocumented side channel around an isolated zone, treat it as evidence that a legitimate need was denied rather than eliminated, and address the underlying need with a proper segmented path or exception mechanism instead of only closing the side channel.",
    ],
    keyTakeaways: [
      "Segmentation permits a controlled, filtered path because a real requirement needs it; isolation removes the path because no requirement justifies it. They are different controls, not different strengths of the same control.",
      "Choose between them by naming the specific business reason a path would need to exist — segmentation when one can be named, isolation when it cannot.",
      "A denied rule is not the same evidence as a nonexistent route. Segmentation and isolation must be validated differently, and passing one control's test says nothing about the other.",
      "A 'temporary' segmentation rule that outlives its justification is a common way an isolation requirement quietly degrades into something weaker.",
      "An isolated boundary still needs a way to handle rare, legitimate access — through a separate, authorized, time-boxed exception, not by converting isolation into a permanent segmented path.",
    ],
    references: [
      "NIST SP 800-207, Zero Trust Architecture: https://csrc.nist.gov/pubs/sp/800/207/final",
      "NIST SP 800-41 Rev. 1, Guidelines on Firewalls and Firewall Policy: https://csrc.nist.gov/pubs/sp/800/41/r1/final",
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the SC-7 Boundary Protection and AC-4 Information Flow Enforcement controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    ],
    relatedSlugs: ["understanding-network-trust-boundaries"],
  },
  module: {
    kind: "guide",
    requirements: [
      "A documented list of every zone-to-zone boundary under review, including administrative, legacy, and rarely used paths that are easy to leave off a primary architecture diagram.",
      "A recorded business justification — or an explicit, deliberate absence of one — for each boundary, gathered independently of what the current configuration happens to permit today.",
      "Authority to add or remove access-control rules, and, where isolation is the correct choice, authority to remove the underlying interface or route itself rather than only the rule currently restricting it.",
    ],
    procedure: [
      "For each zone-to-zone boundary, ask whether the target zone has a specific, ongoing, and currently valid business reason to be reached from the source zone. If none can be named, isolation — not a tightly written segmentation rule — is the correct control.",
      "Where a legitimate reason exists, write the segmentation rule to match that reason exactly: the specific ports, protocols, and direction actually required, not a broader range left over from testing or convenience.",
      "Where no legitimate reason exists, remove the path entirely rather than narrowing it, and confirm no route, interface, or reachable service remains — a rule that denies traffic is not the same as a path that does not exist.",
      "For any zone requiring isolation that also has a rare, genuine access need, design a separate, explicitly authorized, time-boxed exception mechanism instead of converting the isolation boundary into a permanent segmented one.",
      "Review every existing 'temporary' or 'one-time' segmentation rule against its original justification. Remove a rule whose original business reason has expired instead of leaving it in place because removal is more work than leaving it.",
      "Document, for each boundary, which control was chosen and why, so a later reviewer can tell a deliberate decision from an unexamined default.",
    ],
    validation: [
      "Every segmented path carries only the traffic matching its recorded justification, confirmed by testing from the boundary's untrusted side, not by reading the rule that is supposed to enforce it.",
      "Every isolated boundary has no observed traffic and no reachable route or interface between the two zones, verified at the network layer rather than only confirmed by the absence of a permitting rule.",
      "Every rare-access exception for an isolated zone is time-boxed and separately authorized, and does not appear in the boundary's normal-operation configuration once the exception period ends.",
    ],
    rollback: [
      "If removing a path breaks a dependency that was not identified during review, restore the specific path first and confirm restored function before re-evaluating whether the boundary should have been segmentation or isolation in the first place.",
      "If a segmentation rule is narrowed and something legitimate breaks, widen only the specific traffic that was actually required, confirmed against the recorded justification, rather than reverting to the previous, broader rule wholesale.",
      "Keep a record of each boundary's configuration immediately before a segmentation-versus-isolation change, so a revert restores a known state instead of a best guess at one.",
    ],
  },
  diagram: buildDiagram(),
};

function buildDiagram(): FlowDiagramSpec {
  return {
    titleId: "segmentation-vs-isolation-diagram",
    title: "Fictional zone architecture: segmentation vs. isolation",
    desc: "A fictional shared services zone can reach a finance zone through a segmentation gateway's controlled, filtered path, or attempt to reach a legacy control zone that is isolated — no path exists at all. Interactive: toggle between the segmented path and the isolated boundary, and explore each node.",
    viewBox: "0 0 900 380",
    failureLabel: "Isolated (no path)",
    caption:
      "Shared services zone → segmentation gateway → finance zone: a controlled, filtered path that exists because there is a specific, ongoing reason for it. The isolated view shows the same shared services zone attempting to reach a legacy control zone that has no path at all — the connection stops in open space because there is nothing to filter; no route was ever built to filter.",
    motionDuration: 2600,
    mainPacketRoute: { d: "M180,145 H260 M450,145 H530", length: 160 },
    edges: [
      { id: "shared-gateway", from: "shared", to: "gateway", d: "M180,145 H260", length: 80, kind: "main", activeIn: ["normal"] },
      { id: "gateway-finance", from: "gateway", to: "finance", d: "M450,145 H530", length: 80, kind: "main", activeIn: ["normal"] },
      {
        id: "shared-legacy-no-path",
        from: "shared",
        to: "legacy",
        d: "M120,180 C220,240 340,260 440,265",
        length: 350,
        kind: "failure",
        activeIn: ["failure"],
      },
    ],
    nodes: [
      {
        id: "shared",
        label: "Shared services zone",
        x: 10,
        y: 110,
        w: 170,
        h: 70,
        activeIn: ["normal", "failure"],
        description:
          "The common origin zone in this fictional architecture — a general workload or user session starts here. Reaching another zone from here always requires a deliberate control decision: a controlled path (segmentation) or no path at all (isolation). Being able to reach one zone from here says nothing about whether it can reach a different zone; each boundary is decided on its own terms.",
      },
      {
        id: "gateway",
        label: "Segmentation gateway",
        x: 260,
        y: 100,
        w: 190,
        h: 90,
        activeIn: ["normal"],
        role: "boundary",
        focusableLabel:
          "Segmentation gateway — a boundary that permits a specific, filtered, and logged path between the shared services zone and the finance zone",
        description:
          "This is segmentation in practice: a boundary that evaluates every attempted crossing against an explicit rule, filters and logs what it permits, and denies everything else by default. A path exists here because the finance zone has a specific, ongoing business reason to be reached from shared services. Segmentation is the correct control precisely because that legitimate need exists and has to be controlled — not because segmentation is inherently safer than isolation.",
      },
      {
        id: "finance",
        label: "Finance zone",
        x: 530,
        y: 100,
        w: 170,
        h: 90,
        activeIn: ["normal"],
        role: "safe",
        description:
          "Reached only through the segmentation gateway's filtered path, never directly from shared services. A segmented zone is not 'less protected' than an isolated one — it means a real, monitored path exists because the business actually requires it, and every crossing of that path is observed rather than assumed safe by default.",
      },
      {
        id: "legacy",
        label: "Legacy control zone",
        x: 530,
        y: 250,
        w: 190,
        h: 90,
        activeIn: ["failure"],
        role: "blocked",
        focusableLabel:
          "Legacy control zone — isolated from shared services; no rule, interface, or route connects the two zones under any normal condition",
        description:
          "This is isolation in practice: there is no ongoing business reason for the shared services zone to reach this zone directly, so there is no path to filter, log, or maintain — not a strict rule, an absent one. The broken line toward this zone in the isolated view is deliberate: unlike the finance zone's filtered path, there is nothing here to write a firewall rule for, because the connection itself was never built. Any rare, legitimate need to reach this zone should go through a separate, explicitly authorized, time-boxed exception path — not by quietly turning this boundary into a segmented one.",
      },
    ],
  };
}
