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
    estimatedReadingMinutes: 5,
    publishedAt: "2026-09-03",
    updatedAt: "2026-11-22",
    lastReviewedAt: "2026-09-03",
    changeNote:
      "Shortened for faster reading. The answer now opens the article, the learning goals, audience, recommendations, and takeaways that repeated the checklist were removed, and the explanation was condensed into five steps. All eight checklist rows are unchanged.",
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
      "A backup is not proven until it has been restored. A job's exit code or green dashboard shows only that a process ran and wrote output, not that the output is complete, uncorrupted, or usable. Restore into an isolated environment, check the result against an independent record, measure RTO and RPO, confirm one copy is out of reach of the production access path, and repeat on a schedule. Every example here is fictional or documentation-safe.",
    ],
    prerequisites: [
      "Knowing how your backup jobs are scheduled, where their output is stored, and who or what can access that storage.",
      "Access to, or authority to request, an isolated non-production environment for restoration tests.",
    ],
    problem: [
      "Backup verification often stops where it should begin. A scheduled job runs, reports success, and the organization records \"backups are working.\" Nobody has opened the archive since setup, confirmed another tool version can read it, timed a real restore, or checked that the secrets and configuration the restored system needs were captured at all.",
      "From an evidence standpoint, a backup that has never been restored is indistinguishable from one that does not work.",
    ],
    threatModel: [
      "**Passive failure.** Bit rot, an incomplete write, a format change that breaks the restore tooling, or a dependency (a secret, a configuration file, a network path) that was never in the backup. None needs an adversary, and an exit code cannot detect any of them because the job never uses its own output.",
      "**Active failure.** An attacker with production access destroys the recovery option first, usually before ransomware or data destruction. MITRE ATT&CK documents this as T1490, Inhibit System Recovery: deleting backup catalogs, removing shadow copies, or disabling recovery features. A backup that shares access paths or credentials with production does little against that threat.",
    ],
    mainContent: [
      "**Restore, don't inspect.** Listing an archive's contents or checking a snapshot's size is inspection. Only a completed restoration into an isolated target (called \"lab-restore\" in this checklist), followed by a check of the result, counts as evidence.",
      "**Check integrity against something the backup didn't produce.** Compare the restored result with a checksum stored separately at backup time, an independent record count, or an application check that the restored service starts and serves a known-good request. A restore that completes without error can still return data that silently differs.",
      "**Measure RTO and RPO.** Time the exercise from the start of restoration to a confirmed-usable system and compare it with the documented recovery time objective. Then compare the backup's age at a simulated failure point with the recovery point objective. A restore that works but takes four times the documented RTO is a finding, not a pass.",
      "**Verify isolation from the production side.** At least one copy should be offline, immutable, or reachable only through credentials distinct from those that can change production. Confirm from the production access path that it cannot reach, modify, or delete that copy; a documentation review alone is not enough.",
      "**Exercise the whole runbook, then repeat it.** Include secrets references, network paths, and downstream services, and record any missing dependency as a finding. A single test proves only that recovery worked on that day, with that software and data, so repeat it on a defined interval and after material architecture changes.",
    ],
    validationEvidence: [
      "This article is a checklist framework, not a reproduced test result. No restoration described here was performed against a live or lab system for this article, no timing data was measured, and no integrity check was run. Its evidence state is UNVERIFIED and stays UNVERIFIED until an organization applying it records its own restoration evidence; internal consistency is not grounds to upgrade the label.",
    ],
    limitations: [
      "It describes a general discipline, not a specific backup product, cloud snapshot mechanism, or database point-in-time recovery process. Translate each item into your tooling and re-validate it there.",
      "Disaster-recovery governance (ownership, budget, staffing, executive reporting) belongs to SecurityCorp's governance and risk content.",
      "Detecting an in-progress attempt to destroy backups (the ATT&CK T1490 behaviors above) is a detection-engineering concern, covered separately.",
    ],
    references: [
      "NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems: https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final",
      "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations (see the CP-9 System Backup and CP-10 System Recovery and Reconstitution controls): https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
      "CIS Critical Security Control 11: Data Recovery: https://www.cisecurity.org/controls/data-recovery",
      "MITRE ATT&CK T1490, Inhibit System Recovery: https://attack.mitre.org/techniques/T1490/",
      "CISA, FBI, NSA, and MS-ISAC, #StopRansomware Guide (backup testing and offline/immutable backup guidance): https://www.cisa.gov/stopransomware/ransomware-guide",
    ],
    relatedSlugs: ["logs-are-not-proof-verifying-automated-actions", "designing-fail-closed-security-automation"],
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
