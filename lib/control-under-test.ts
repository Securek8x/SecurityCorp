export type ControlScenario = {
  id: string;
  control: string;
  trigger: string;
  expected: string;
  observed: string;
  principle: string;
  href: string;
};

export const controlScenarios: ControlScenario[] = [
  {
    id: "scanner-unavailable",
    control: "Fail-closed malware gate",
    trigger: "The malware scanner is unreachable or times out mid-scan.",
    expected: "The file stays in isolated staging. It is never released on a timeout.",
    observed: "Validated: a scanner outage was simulated deliberately and the release step never ran.",
    principle: "Fail closed — an unclear result is treated as unsafe, not as a pass.",
    href: "/guides/malware-gate-for-automated-downloads#test-the-failure-paths",
  },
  {
    id: "vpn-tunnel-stopped",
    control: "VPN-bound container egress",
    trigger: "The VPN tunnel is stopped or broken without detaching the workload.",
    expected: "External access is blocked. The application does not fall back to the host's normal route.",
    observed: "Validated: the tunnel was stopped directly and outbound access failed as expected.",
    principle: "No silent fallback — losing the tunnel must look like losing the internet, not gaining a new route.",
    href: "/guides/vpn-bound-container-stack#test-the-kill-switch",
  },
  {
    id: "proxy-migration-fails",
    control: "Reverse-proxy rollback plan",
    trigger: "A host-interface change during a proxy migration doesn't take, or breaks proxied access.",
    expected: "A commit-confirm or timed rollback restores the previous configuration automatically.",
    observed: "Documented pattern: direct and proxied access are validated independently before a change is considered final.",
    principle: "Recoverable change — a failed migration step must not be able to strand the management interface.",
    href: "/guides/reverse-proxy-home-lab#make-rollback-part-of-deployment",
  },
];
