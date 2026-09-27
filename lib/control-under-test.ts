import { describeEvidenceRecord, evidenceMaturityLabel, type EvidenceMaturity, type TestOutcome } from "./evidence.ts";

export type ControlScenario = {
  id: string;
  control: string;
  trigger: string;
  expected: string;
  /** The project evidence record this scenario presents. Maturity and the
   * observed text are resolved from that record — never stored here. */
  evidenceRef: { projectIndex: string; recordId: string };
  principle: string;
  href: string;
};

export const controlScenarios: ControlScenario[] = [
  {
    id: "scanner-unavailable",
    control: "Fail-closed malware gate",
    trigger: "The malware scanner is unreachable or times out mid-scan.",
    expected: "The file stays in isolated staging. It is never released on a timeout.",
    evidenceRef: { projectIndex: "P-01", recordId: "scanner-outage" },
    principle: "Fail closed — an unclear result is treated as unsafe, not as a pass.",
    href: "/guides/malware-gate-for-automated-downloads#test-the-failure-paths",
  },
  {
    id: "vpn-tunnel-stopped",
    control: "VPN-bound container egress",
    trigger: "The VPN tunnel is stopped or broken without detaching the workload.",
    expected: "External access is blocked. The application does not fall back to the host's normal route.",
    evidenceRef: { projectIndex: "P-02", recordId: "kill-switch" },
    principle: "No silent fallback — losing the tunnel must look like losing the internet, not gaining a new route.",
    href: "/guides/vpn-bound-container-stack#test-the-kill-switch",
  },
  {
    id: "proxy-migration-fails",
    control: "Reverse-proxy rollback plan",
    trigger: "A host-interface change during a proxy migration doesn't take, or breaks proxied access.",
    expected: "A commit-confirm or timed rollback restores the previous configuration automatically.",
    evidenceRef: { projectIndex: "P-03", recordId: "rollback" },
    principle: "Recoverable change — a failed migration step must not be able to strand the management interface.",
    href: "/guides/reverse-proxy-home-lab#make-rollback-part-of-deployment",
  },
];

export type ScenarioEvidence =
  | { status: "resolved"; maturity: EvidenceMaturity; observed: string; outcome?: TestOutcome }
  | { status: "unavailable"; reason: string };

export type ResolvedControlScenario = ControlScenario & { evidence: ScenarioEvidence };

type EvidenceSource = ReadonlyArray<{ index: string; evidence: unknown }>;

/**
 * Resolve a scenario's evidence from the authoritative project record. A
 * missing project, missing record, or unverified evidence resolves to
 * "unavailable" — which renders as "Evidence unavailable", never Validated.
 */
export function resolveScenarioEvidence(scenario: ControlScenario, projects: EvidenceSource): ScenarioEvidence {
  const ref = scenario.evidenceRef;
  const project = projects.find((p) => p.index === ref?.projectIndex);
  if (!project) return { status: "unavailable", reason: `unknown project "${ref?.projectIndex}"` };
  const described = describeEvidenceRecord(project.evidence, ref.recordId);
  if (!described) return { status: "unavailable", reason: `no verified evidence record "${ref.projectIndex}/${ref.recordId}"` };
  return Object.freeze({
    status: "resolved",
    maturity: described.maturity,
    observed: described.observed,
    ...(described.outcome ? { outcome: described.outcome } : {}),
  });
}

/**
 * The Failure Lab diagram's caption. Its maturity term comes from the same
 * resolved evidence as the scenario's EvidenceMark, so the two can never
 * disagree; unresolved evidence gets no maturity term at all.
 */
export function failurePathLabel(evidence: ScenarioEvidence): string {
  return evidence.status === "resolved" ? `${evidenceMaturityLabel[evidence.maturity]} failure path` : "Failure path";
}

export function resolveControlScenarios(scenarios: readonly ControlScenario[], projects: EvidenceSource): ResolvedControlScenario[] {
  return scenarios.map((s) => ({ ...s, evidence: resolveScenarioEvidence(s, projects) }));
}
