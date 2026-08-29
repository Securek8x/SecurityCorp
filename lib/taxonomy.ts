// Canonical knowledge-base taxonomy: six pillars, twenty-one categories.
// Source of truth for scope/audience/boundary text: the corresponding Beads
// under securitycorp-source-4zl.54 through .59 (see docs/knowledge-base.md
// for how this file maps back to those Beads). Category and pillar pages
// generate from this data — do not hand-duplicate these definitions on
// individual pages.
//
// Boundaries below are editorial guardrails for future article review, not
// public copy by themselves — they mirror the publication-safety policy
// (Bead securitycorp-source-4zl.53; docs/knowledge-base.md notes that the
// policy file itself is not yet committed) and exist so a reviewer can
// check a draft against its category's stated limits without re-deriving
// them from the Beads each time.

export type PillarId =
  | "build-securely"
  | "defend-systems"
  | "detect-respond"
  | "test-validate"
  | "govern-risk"
  | "learn-security";

export type CategoryId =
  | "application-code-security"
  | "cicd-supply-chain-security"
  | "container-kubernetes-security"
  | "ai-security"
  | "network-security"
  | "cloud-security"
  | "identity-access-management"
  | "security-architecture"
  | "detection-engineering"
  | "soc-operations"
  | "incident-response-dfir"
  | "malware-file-security"
  | "offensive-security"
  | "vulnerability-management"
  | "security-control-validation"
  | "governance-risk-compliance"
  | "threat-modeling"
  | "security-program-design"
  | "security-fundamentals"
  | "learning-tracks"
  | "security-terminology";

export type Pillar = {
  id: PillarId;
  bead: string;
  name: string;
  description: string;
  audience: string;
  boundaries: string;
};

export type Category = {
  id: CategoryId;
  bead: string;
  pillar: PillarId;
  name: string;
  scope: string;
  audience: string;
  exampleSubjects: string;
  boundaries: string;
};

export const pillars: Pillar[] = [
  {
    id: "build-securely",
    bead: "securitycorp-source-4zl.54",
    name: "Build Securely",
    description: "Secure software, pipelines, containers, and AI systems before release.",
    audience: "Developers, DevOps practitioners, and security engineers.",
    boundaries: "Excludes unsanctioned exploitation or real-environment details.",
  },
  {
    id: "defend-systems",
    bead: "securitycorp-source-4zl.55",
    name: "Defend Systems",
    description: "Protect networks, cloud workloads, identities, and architectures.",
    audience: "Administrators, platform engineers, and defenders.",
    boundaries: "Excludes real topology, accounts, or live configurations.",
  },
  {
    id: "detect-respond",
    bead: "securitycorp-source-4zl.56",
    name: "Detect and Respond",
    description: "Develop detections and respond to incidents using safe, synthetic evidence.",
    audience: "SOC analysts, detection engineers, and incident responders.",
    boundaries: "Excludes employer-derived data or real cases.",
  },
  {
    id: "test-validate",
    bead: "securitycorp-source-4zl.57",
    name: "Test and Validate",
    description: "Validate security controls through authorized assessment, vulnerability management, and repeatable tests.",
    audience: "Security testers, engineers, and program owners.",
    boundaries: "Excludes unauthorized or destructive operations.",
  },
  {
    id: "govern-risk",
    bead: "securitycorp-source-4zl.58",
    name: "Govern Risk",
    description: "Connect security decisions to risk, threat models, and program design.",
    audience: "Security leaders, engineers, and recruiters.",
    boundaries: "Excludes employer policies, client information, or internal controls.",
  },
  {
    id: "learn-security",
    bead: "securitycorp-source-4zl.59",
    name: "Learn Security",
    description: "Provide foundational concepts and structured learning paths.",
    audience: "Beginners, career changers, practitioners, and recruiters.",
    boundaries: "Excludes unreviewed advice or unsupported claims.",
  },
];

export const categories: Category[] = [
  {
    id: "application-code-security",
    bead: "securitycorp-source-4zl.54.1",
    pillar: "build-securely",
    name: "Application and Code Security",
    scope: "Secure application design, implementation, review, and testing.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Code review, APIs, dependencies, and boundary validation.",
    boundaries: "No real source, secrets, repositories, exploit chains, or production defects.",
  },
  {
    id: "cicd-supply-chain-security",
    bead: "securitycorp-source-4zl.54.2",
    pillar: "build-securely",
    name: "CI/CD and Software Supply-Chain Security",
    scope: "Secure build, release, and dependency workflows.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Runner trust, artifact verification, SBOMs, and pipeline identities.",
    boundaries: "No real pipelines, credentials, repositories, or release controls.",
  },
  {
    id: "container-kubernetes-security",
    bead: "securitycorp-source-4zl.54.3",
    pillar: "build-securely",
    name: "Container and Kubernetes Security",
    scope: "Secure container workloads, orchestration, and operational boundaries.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Workload isolation, RBAC, image provenance, and management interfaces.",
    boundaries: "No real clusters, manifests, addresses, or administrative access paths.",
  },
  {
    id: "ai-security",
    bead: "securitycorp-source-4zl.54.4",
    pillar: "build-securely",
    name: "AI Security",
    scope: "Secure AI-assisted systems and agents.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Prompt injection, tool permissions, approval gates, and data handling.",
    boundaries: "No proprietary prompts, internal data, credentials, or unsafe autonomous operations.",
  },
  {
    id: "network-security",
    bead: "securitycorp-source-4zl.55.1",
    pillar: "defend-systems",
    name: "Network Security",
    scope: "Design and validate defensible network trust boundaries.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Segmentation, DNS, TLS, firewall requirements, and safe packet analysis.",
    boundaries: "No real domains, addresses, ports, topology, or device identifiers.",
  },
  {
    id: "cloud-security",
    bead: "securitycorp-source-4zl.55.2",
    pillar: "defend-systems",
    name: "Cloud Security",
    scope: "Manage cloud identity, workload, and configuration risk.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "IAM governance, workload access, logging, and architectural controls.",
    boundaries: "No cloud account IDs, tenant details, live policies, or credentials.",
  },
  {
    id: "identity-access-management",
    bead: "securitycorp-source-4zl.55.3",
    pillar: "defend-systems",
    name: "Identity and Access Management",
    scope: "Apply authentication, authorization, lifecycle, and least-privilege principles.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Pipeline identities, workload identities, roles, and privilege review.",
    boundaries: "No real accounts, groups, access policies, tokens, or identity-provider configuration.",
  },
  {
    id: "security-architecture",
    bead: "securitycorp-source-4zl.55.4",
    pillar: "defend-systems",
    name: "Security Architecture",
    scope: "Design defensible systems and resilience patterns.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Trust boundaries, secure defaults, failure modes, backups, and rollbacks.",
    boundaries: "No real environment topology, weaknesses, deployment details, or recovery data.",
  },
  {
    id: "detection-engineering",
    bead: "securitycorp-source-4zl.56.1",
    pillar: "detect-respond",
    name: "Detection Engineering",
    scope: "Create, validate, and maintain security detections.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Telemetry, synthetic events, detection logic, coverage, and rule review.",
    boundaries: "No employer-derived alerts, queries, thresholds, telemetry, or screenshots.",
  },
  {
    id: "soc-operations",
    bead: "securitycorp-source-4zl.56.2",
    pillar: "detect-respond",
    name: "SOC Operations and Alert Tuning",
    scope: "Operate and improve alert triage and escalation.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "False positives, decision trees, suppression, enrichment, and escalation.",
    boundaries: "No real SOC cases, alert thresholds, rules, identities, or internal process details.",
  },
  {
    id: "incident-response-dfir",
    bead: "securitycorp-source-4zl.56.3",
    pillar: "detect-respond",
    name: "Incident Response and DFIR",
    scope: "Prepare for evidence-based response and investigation.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Timelines, evidence handling, containment, severity, and post-incident improvement.",
    boundaries: "No real incidents, victims, evidence, employer practices, or identifying metadata.",
  },
  {
    id: "malware-file-security",
    bead: "securitycorp-source-4zl.56.4",
    pillar: "detect-respond",
    name: "Malware and File Security",
    scope: "Defend against malicious files using safe analysis and scanning practices.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "File triage, synthetic samples, defensive scanning, and safe handling.",
    boundaries: "No live malware, acquisition workflows, copyrighted-content activity, or unsafe execution.",
  },
  {
    id: "offensive-security",
    bead: "securitycorp-source-4zl.57.1",
    pillar: "test-validate",
    name: "Authorized Offensive Security",
    scope: "Plan and perform controlled assessment and adversary emulation.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Scope, rules of engagement, attack-path mapping, findings, and remediation validation.",
    boundaries: "Authorized systems or isolated labs only; no real targets, credentials, destructive guidance, or production exploitation.",
  },
  {
    id: "vulnerability-management",
    bead: "securitycorp-source-4zl.57.2",
    pillar: "test-validate",
    name: "Vulnerability Management",
    scope: "Identify, prioritize, remediate, and verify vulnerabilities.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Risk prioritization, remediation workflows, exception review, and validation.",
    boundaries: "No unresolved real vulnerabilities, asset inventories, scanners against live targets, or identifying findings.",
  },
  {
    id: "security-control-validation",
    bead: "securitycorp-source-4zl.57.3",
    pillar: "test-validate",
    name: "Security Control Validation",
    scope: "Verify controls using safe, repeatable tests.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Synthetic events, failure-path tests, evidence, and validation criteria.",
    boundaries: "No unsafe real-system testing or claims based only on logs or service startup.",
  },
  {
    id: "governance-risk-compliance",
    bead: "securitycorp-source-4zl.58.1",
    pillar: "govern-risk",
    name: "Governance, Risk, and Compliance",
    scope: "Explain risk governance and defensible assurance practices.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Risk registers, control objectives, assurance, and compliance mapping.",
    boundaries: "No employer, client, audit, or policy details.",
  },
  {
    id: "threat-modeling",
    bead: "securitycorp-source-4zl.58.2",
    pillar: "govern-risk",
    name: "Threat Modeling",
    scope: "Identify threats, assumptions, mitigations, and residual risk.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Trust boundaries, misuse cases, attack hypotheses, and design review.",
    boundaries: "No modeling of real systems, hidden architecture, or unresolved exposure.",
  },
  {
    id: "security-program-design",
    bead: "securitycorp-source-4zl.58.3",
    pillar: "govern-risk",
    name: "Security Program Design",
    scope: "Design sustainable security practices and decision structures.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Metrics, ownership, review cadence, and operating models.",
    boundaries: "No employer-derived programs, budgets, staffing, policies, or internal plans.",
  },
  {
    id: "security-fundamentals",
    bead: "securitycorp-source-4zl.59.1",
    pillar: "learn-security",
    name: "Security Fundamentals",
    scope: "Teach core security concepts and safe mental models.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "CIA, trust, least privilege, authentication, logging, and risk.",
    boundaries: "No unsupported simplifications presented as operational advice.",
  },
  {
    id: "learning-tracks",
    bead: "securitycorp-source-4zl.59.2",
    pillar: "learn-security",
    name: "Learning Tracks",
    scope: "Sequence approved articles into goal-oriented learning paths.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Prerequisites, stages, checkpoints, and related reading.",
    boundaries: "No credential promises, fabricated outcomes, or uncurated link lists.",
  },
  {
    id: "security-terminology",
    bead: "securitycorp-source-4zl.59.3",
    pillar: "learn-security",
    name: "Security Terminology and Concept Explanations",
    scope: "Explain security terms and concepts precisely.",
    audience: "Beginners, practitioners, and security engineers relevant to this discipline.",
    exampleSubjects: "Common definitions, distinctions, examples, and misconceptions.",
    boundaries: "No vendor marketing, vague buzzwords, or context-free claims.",
  },
];

export const pillarById = new Map<PillarId, Pillar>(pillars.map((p) => [p.id, p]));
export const categoryById = new Map<CategoryId, Category>(categories.map((c) => [c.id, c]));

export function categoriesForPillar(pillar: PillarId): Category[] {
  return categories.filter((c) => c.pillar === pillar);
}

/** Structural checks over the taxonomy data itself — independent of any
 * article. Exercised by lib/taxonomy.test.ts; kept here so both the tests
 * and any future admin/build-time check can call the same function. */
export function checkTaxonomyIntegrity(): string[] {
  const errors: string[] = [];

  const pillarIds = pillars.map((p) => p.id);
  const duplicatePillars = pillarIds.filter((id, i) => pillarIds.indexOf(id) !== i);
  if (duplicatePillars.length > 0) errors.push(`duplicate pillar id(s): ${[...new Set(duplicatePillars)].join(", ")}`);

  const categoryIds = categories.map((c) => c.id);
  const duplicateCategories = categoryIds.filter((id, i) => categoryIds.indexOf(id) !== i);
  if (duplicateCategories.length > 0) errors.push(`duplicate category id(s): ${[...new Set(duplicateCategories)].join(", ")}`);

  for (const category of categories) {
    if (!pillarById.has(category.pillar)) {
      errors.push(`category "${category.id}" references unknown pillar "${category.pillar}" (orphaned category)`);
    }
  }

  for (const pillar of pillars) {
    if (categoriesForPillar(pillar.id).length === 0) {
      errors.push(`pillar "${pillar.id}" has no categories`);
    }
  }

  return errors;
}
