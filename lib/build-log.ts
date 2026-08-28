export type BuildLogStatus = "published" | "validated" | "documented" | "planned";

export type BuildLogEntry = {
  date: string;
  title: string;
  summary?: string;
  status: BuildLogStatus;
  href?: string;
};

export const buildLog: BuildLogEntry[] = [
  {
    date: "Aug 28, 2026",
    title: "Fail-closed malware gate architecture",
    summary: "Staged intake, explicit state machine, and release verification, written up as a full guide.",
    status: "published",
    href: "/guides/malware-gate-for-automated-downloads",
  },
  {
    date: "Aug 24, 2026",
    title: "VPN-bound container egress, verified",
    summary: "Namespace sharing, egress proof, and kill-switch testing documented and confirmed against a live stack.",
    status: "validated",
    href: "/guides/vpn-bound-container-stack",
  },
  {
    date: "Aug 18, 2026",
    title: "Private reverse-proxy rollback pattern",
    summary: "Split DNS, constrained management plane, and commit-confirm rollback, written up as a guide.",
    status: "documented",
    href: "/guides/reverse-proxy-home-lab",
  },
  {
    date: "2026",
    title: "Kubernetes parity migration",
    summary: "A zero-change migration plan for existing services — still in design, no production cutover yet.",
    status: "planned",
    href: "/projects",
  },
];
