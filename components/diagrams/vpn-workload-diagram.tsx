import { InteractiveFlowDiagram, type FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const spec: FlowDiagramSpec = {
  titleId: "vpn-diagram",
  title: "VPN-bound workload egress flow",
  desc: "Application shares the VPN container's network namespace, which routes through the VPN tunnel to the internet. If the tunnel drops, the flow branches to a kill-switch block instead of falling back to the host's normal route. Interactive: switch between the normal and failure path, and explore each node.",
  viewBox: "0 0 900 300",
  failureLabel: "Tunnel drop",
  caption: "Application → shared network namespace → VPN tunnel → internet. If the tunnel drops, the flow branches to a kill-switch block instead of falling back to the host's normal route.",
  motionDuration: 2400,
  mainPacketRoute: { d: "M170,90 H210 M400,90 H430 M600,90 H630", length: 100 },
  edges: [
    { id: "app-namespace", from: "application", to: "namespace", d: "M170,90 H210", length: 40, kind: "main", activeIn: ["normal", "failure"] },
    { id: "namespace-tunnel", from: "namespace", to: "tunnel", d: "M400,90 H430", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "tunnel-internet", from: "tunnel", to: "internet", d: "M600,90 H630", length: 30, kind: "main", activeIn: ["normal"] },
    { id: "tunnel-killswitch", from: "tunnel", to: "killswitch", d: "M515,120 V220", length: 100, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    { id: "application", label: "Application", x: 10, y: 60, w: 160, h: 60, activeIn: ["normal", "failure"], description: "The workload whose outbound traffic must never leave except through the tunnel." },
    { id: "namespace", label: "Shared network namespace", x: 210, y: 55, w: 190, h: 70, activeIn: ["normal", "failure"], role: "boundary", focusableLabel: "Shared network namespace — the workload has no independent network path that could bypass the tunnel", description: "Trust boundary: the workload shares the VPN container's namespace instead of owning a separate interface." },
    { id: "tunnel", label: "VPN tunnel", x: 430, y: 60, w: 170, h: 60, activeIn: ["normal", "failure"], description: "The decision point. A dropped tunnel blocks egress rather than silently falling back to the host's route." },
    { id: "internet", label: "Internet", x: 630, y: 60, w: 150, h: 60, activeIn: ["normal"], role: "safe", description: "Reached only while the tunnel is up — the validated safe outcome of the normal path." },
    { id: "killswitch", label: "Kill-switch block", x: 425, y: 220, w: 180, h: 60, activeIn: ["failure"], role: "blocked", focusableLabel: "Kill-switch block — if the tunnel drops, outbound traffic is blocked rather than falling back to the host's route", description: "No silent fallback: a dropped tunnel blocks egress instead of quietly using the host's normal gateway." },
  ],
};

export default function VpnWorkloadDiagram() {
  return <InteractiveFlowDiagram spec={spec} />;
}
