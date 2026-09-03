// Knowledge-base article: "A Backup Is Not Proven Until It Is Restored"
// (Bead securitycorp-source-4zl.43). Published 2026-09-03 under Ravi Teja
// Thota's standing publication authorization after real review of citations,
// safety, and evidenceState honesty, per docs/publication-safety-policy.md
// and docs/knowledge-base.md. All examples describe fictional or
// documentation-safe environments; no real infrastructure, employer
// detail, credentials, identifying data, or unresolved vulnerability
// appears anywhere in this file.
import type { KnowledgeArticle } from "../knowledge-content.ts";

export const article: KnowledgeArticle = {
  meta: {
    title: "A Backup Is Not Proven Until It Is Restored",
    slug: "backup-restoration-verification",
    summary:
      "A checklist for verifying that a backup is actually recoverable — distinguishing a backup job's success signal from demonstrated restoration into an isolated environment, with fictional examples throughout.",
    pillar: "defend-systems",
    primaryCategory: "security-architecture",
    contentType: "checklist",
    difficulty: "intermediate",
    status: "published",
    tags: ["backup-recovery", "security-control-validation", "threat-modeling"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 10,
    publishedAt: "2026-09-03",
    updatedAt: "2026-09-03",
    lastReviewedAt: "2026-09-03",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-03" },
  },
  sections: {
    executiveSummary: [
      "A backup job that reports success has confirmed exactly one thing: that a process ran to completion and wrote output somewhere. It has not confirmed that the output is complete, that it is uncorrupted, that it can be read by anything other than the tool that wrote it, or that the system or dataset it represents can actually be brought back to a usable state. Treating a green checkmark, a zero exit code, or a completed job log as evidence of recoverability is one of the most common and most consequential assumptions in operational security — and it is usually discovered to be wrong at the worst possible time, during an actual incident, rather than during a planned test.",
      "This checklist gives security practitioners and platform engineers a repeatable way to verify — not assume — that a backup is recoverable. Its central discipline is simple to state and easy to skip under time pressure: a backup is not proven until a restoration has actually been attempted, into an environment isolated from production, and the result has been checked against independent evidence of integrity, completeness, and timing. Every example below is fictional or documentation-safe; no real infrastructure, provider, or incident is described.",
    ],
    whatYouWillLearn: [
      "Why a backup job's completion signal (exit code, log entry, dashboard status) is not evidence that the backup is restorable.",
      "How to structure a restoration test so it produces real evidence: a system or dataset actually restored into an isolated environment and checked, not merely inspected in place.",
      "How recovery time objective (RTO) and recovery point objective (RPO) turn a restoration test into a measurable result instead of a pass/fail guess.",
      "Why at least one backup copy needs to be isolated from the same access path that could destroy production data, and how that isolation is verified rather than assumed.",
      "How to build a checklist-driven, recurring verification practice instead of a one-time test performed only when the backup system was first configured.",
    ],
    intendedAudience: [
      "Security practitioners responsible for validating that resilience controls actually work, not only that they exist.",
      "Platform engineers who own backup and disaster-recovery tooling and need a defensible way to demonstrate it functions.",
      "Technical leads and auditors who need a repeatable record distinguishing 'a backup job ran' from 'a restoration was demonstrated.'",
    ],
    prerequisites: [
      "Familiarity with how your organization's backup jobs are scheduled, where their output is stored, and who or what can access that storage.",
      "Access to (or authority to request) an isolated, non-production environment suitable for restoration testing — this checklist assumes such an environment can be created or reused, not that one already exists.",
      "No prior incident-response or disaster-recovery experience is required; this checklist is written to be usable by a first-time reviewer.",
    ],
    problem: [
      "Backup verification frequently stops at the point where verification should begin. A scheduled job runs, writes an archive or snapshot, reports success, and the organization records that as 'backups are working.' Nobody has opened the archive since the day the job was configured. Nobody has confirmed the archive is readable by anything other than the exact tool version that wrote it. Nobody has measured how long a real restoration would take, or whether the restored system would actually start, or whether dependent configuration and secrets references the restored system needs are captured anywhere at all.",
      "This gap is rarely the result of neglect — it is usually the predictable consequence of treating backup as a completed project rather than a control that requires ongoing verification, in the same way an access-control rule or a firewall boundary does. A backup that has never been restored is, from an evidence standpoint, indistinguishable from a backup that does not work.",
    ],
    threatModel: [
      "This checklist's threat model covers two related failure paths. The first is a passive failure: bit rot, an incomplete write, a schema or format change that silently breaks compatibility with the restoration tooling, or a dependency (a secret, a configuration file, a network path) that was never captured in the backup at all. None of these require an adversary — they are ordinary operational entropy, and a backup job's exit code cannot detect any of them because the job never attempts to use its own output.",
      "The second is an active failure: an adversary who has gained sufficient access to production explicitly targets backups to remove the option of recovery, most commonly as a precursor to a ransomware or data-destruction event. MITRE ATT&CK documents this as technique T1490, Inhibit System Recovery — adversaries deleting backup catalogs, removing shadow copies, or disabling recovery features specifically so that restoration is not available as a fallback. A backup that shares its access path or credentials with the production systems it protects is not meaningfully separated from that threat; if the same compromise that destroys production data can also reach the backup, the backup has not reduced the organization's actual risk by much.",
    ],
    mainContent: [
      "**Separate the completion signal from the recoverability claim.** A backup job's exit code, log entry, or dashboard status confirms that a process ran and wrote output. It says nothing about whether that output is complete, uncorrupted, or usable. Before anything else, make this distinction explicit in your own documentation and reporting: 'the backup job succeeded' and 'the backup is recoverable' are different claims requiring different evidence, and only the second one is the actual security control.",
      "**Restore into an isolated environment, not just inspect the archive.** Opening a backup archive to confirm it contains files, or checking a snapshot's reported size, is still inspection — it is not restoration. The checklist below requires an actual restoration attempt into an environment isolated from production: a separate, non-production target (a fictional 'lab-restore' environment throughout this checklist) where the backup is used the way it would be used during a real recovery. Only a completed restoration, followed by a check of the restored result, counts as evidence.",
      "**Check integrity after restoration, against an independent record.** A successful restoration is not the same as a correct one. After restoring, compare the result against something that was not derived from the same backup process — a checksum recorded at backup time and stored separately, an independent record count, or an application-level check (can the restored service actually start and serve a known-good request). A restoration that 'completes without error' but produces data that silently differs from the original has not actually been verified.",
      "**Measure RTO and RPO instead of estimating them.** Recovery time objective (how long recovery is allowed to take) and recovery point objective (how much data loss, measured in time, is acceptable) are only meaningful once they are measured against a real restoration attempt. Time the exercise from the moment restoration begins to the moment the restored system or dataset is confirmed usable, and compare that duration against the documented RTO. Separately, confirm how much data — measured in elapsed time since the backup was taken — would be lost if this backup were the most recent restorable copy, and compare that against the documented RPO. A restoration that technically succeeds but takes four times longer than the documented RTO has revealed a real gap, not a passing test.",
      "**Verify backup isolation from the threat that could destroy it.** At least one backup copy should be offline, immutable, or reachable only through a path and credential set distinct from the ones that can modify or delete production data. This is what separates a backup from a second copy of the same single point of failure. Verifying this is not a documentation review alone — confirm, from the perspective of the production access path, that it genuinely cannot reach, modify, or delete that isolated copy.",
      "**Confirm the restoration runbook covers dependencies, not just data.** A restored dataset or system frequently depends on things the backup itself does not contain: a secret or credential reference, a network path, a downstream service, an application version. A restoration test that only proves 'the data came back' without exercising these dependencies will overstate how recoverable the system actually is. Exercise the full runbook, including these dependencies, during the test — and if a dependency is missing or undocumented, that is itself a finding to record and correct.",
      "**Repeat the test on a defined cadence, not once.** A restoration test performed once, when the backup system was first configured, only proves that the system worked at that moment, on that version of the software, with that version of the data. Repeat the test on a defined interval and after any material change to the architecture it protects, and keep a dated record of each attempt, its result, and any corrective action taken. A single historical success does not carry forward indefinitely.",
    ],
    validationEvidence: [
      "This article is a checklist framework, not a reproduced test result. No restoration exercise described here was performed against a live or lab-reproduced system as part of writing this article, no timing data was actually measured, and no integrity check was actually run. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying this checklist records its own real restoration evidence — the label must not be upgraded merely because the checklist's reasoning is internally consistent.",
    ],
    limitations: [
      "This checklist describes a general verification discipline, not a specific backup product's restoration procedure, a specific cloud provider's snapshot mechanism, or a specific database engine's point-in-time recovery process. Applying it requires translating each item into the actual tooling in use and re-validating the result there.",
      "It does not cover the organizational and governance side of disaster-recovery planning (ownership, budget, staffing, executive reporting) in depth — that belongs to SecurityCorp's governance and risk content, not this checklist.",
      "It does not address detection of an in-progress attempt to destroy backups (for example, monitoring for the ATT&CK T1490 behaviors referenced above) — that is a detection-engineering concern, covered separately from this control-validation checklist.",
    ],
    defensiveRecommendations: [
      "Never accept a backup job's exit code, log entry, or dashboard status as evidence of recoverability on its own — require a completed restoration as the actual evidence.",
      "Restore into an isolated, non-production environment on a defined, recurring schedule, and keep a dated record of each attempt and its result.",
      "Check restored data against an independent record (a separately stored checksum, an independent count, or an application-level check), not only against the restoration tool's own success message.",
      "Measure RTO and RPO from real restoration attempts instead of estimating them from documentation, and treat a measured gap against the documented objective as a finding requiring correction.",
      "Keep at least one backup copy isolated — offline, immutable, or reachable only through a distinct access path — from the credentials and systems that could destroy production data.",
      "Exercise the full restoration runbook, including dependencies outside the backup artifact itself (secrets references, network paths, downstream services), not only the data-restoration step.",
    ],
    keyTakeaways: [
      "A backup job's success signal proves the process ran; it does not prove the output is recoverable. Only a completed restoration, checked against independent evidence, proves that.",
      "Restoration testing belongs in an environment isolated from production, and its result should be measured (timing, integrity) rather than judged pass/fail by feel.",
      "RTO and RPO are only meaningful once they are measured against a real restoration attempt, not estimated from a runbook that has never been exercised.",
      "A backup that shares its access path with the production systems it protects has not meaningfully reduced the risk that both are destroyed together — verify isolation explicitly.",
      "Restoration verification is a recurring control, not a one-time project milestone; a single historical success does not carry forward indefinitely.",
    ],
    references: [
      "NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems: https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final",
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the CP-9 System Backup and CP-10 System Recovery and Reconstitution controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "CIS Critical Security Control 11: Data Recovery: https://www.cisecurity.org/controls/data-recovery",
      "MITRE ATT&CK T1490, Inhibit System Recovery: https://attack.mitre.org/techniques/T1490/",
      "CISA, FBI, NSA, and MS-ISAC, #StopRansomware Guide (backup testing and offline/immutable backup guidance): https://www.cisa.gov/stopransomware/ransomware-guide",
    ],
  },
  module: {
    kind: "checklist",
    items: [
      {
        control: "Backup completion signal is not treated as proof of recoverability",
        verificationMethod:
          "Confirm the organization's own documentation and reporting distinguish 'the backup job succeeded' from 'the backup is recoverable', and that only the latter is reported as the security control being satisfied.",
        requiredEvidence: "A written policy or runbook statement making this distinction explicit, reviewed for at least one backup system.",
        result: "Pending verification for each backup system",
      },
      {
        control: "Restoration into an isolated environment",
        verificationMethod:
          "Attempt to restore the backup into a target environment isolated from production (a fictional 'lab-restore' environment), rather than only inspecting the archive or snapshot metadata.",
        requiredEvidence: "A completed restoration into a non-production, isolated target, with the restored system or dataset brought to a usable state.",
        result: "Pending verification for each backup system",
      },
      {
        control: "Integrity check against an independent record",
        verificationMethod:
          "After restoration, compare the restored result against a checksum, record count, or application-level check recorded independently of the backup process being tested.",
        requiredEvidence: "A recorded integrity-check result performed after restoration, not only at backup-write time.",
        result: "Pending verification for each backup system",
      },
      {
        control: "Recovery time objective (RTO) measurement",
        verificationMethod: "Time the full restoration exercise from initiation to a verified-usable state, and compare against the documented RTO.",
        requiredEvidence: "An elapsed-time record of an actual restoration attempt, with any gap against the documented RTO explicitly flagged.",
        result: "Pending verification for each backup system",
      },
      {
        control: "Recovery point objective (RPO) confirmation",
        verificationMethod:
          "Confirm how much data, measured in elapsed time, would be lost if this backup were the most recent restorable copy, and compare against the documented RPO.",
        requiredEvidence: "A recorded gap between the backup's timestamp and a simulated failure point, compared against the documented RPO.",
        result: "Pending verification for each backup system",
      },
      {
        control: "Backup isolation from the production access path",
        verificationMethod:
          "Confirm at least one backup copy is offline, immutable, or reachable only through an access path and credential set distinct from the ones that can modify or delete production data.",
        requiredEvidence: "Evidence, verified from the production access path's perspective, that it cannot reach, modify, or delete the isolated backup copy.",
        result: "Pending verification for each backup system",
      },
      {
        control: "Restoration runbook covers dependencies, not only data",
        verificationMethod:
          "Exercise the full restoration runbook during the test, including secrets references, network paths, and downstream services the restored system depends on.",
        requiredEvidence: "A restoration runbook exercised end-to-end, with any missing or undocumented dependency recorded as a finding.",
        result: "Pending verification for each backup system",
      },
      {
        control: "Recurring test cadence and dated record",
        verificationMethod: "Repeat the restoration test on a defined interval and after material architecture changes, not only once at initial setup.",
        requiredEvidence: "A dated record of each restoration test, its result, and any corrective action taken, retained for audit.",
        result: "Pending verification for each backup system",
      },
    ],
  },
};
