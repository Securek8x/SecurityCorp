import { InteractiveFlowDiagram, type FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const spec: FlowDiagramSpec = {
  titleId: "proxy-diagram",
  title: "Private reverse proxy flow",
  desc: "Client resolves a hostname through internal DNS, which points to the private proxy, which forwards to the internal service. The proxy's administration plane is a separate, restricted branch reached through a controlled management path — a deliberate separation, not a failure. Interactive: switch between the client path and the management path, and explore each node.",
  viewBox: "0 0 900 300",
  failureLabel: "Management path",
  caption: "Client → internal DNS → private proxy → internal service. The proxy's administration plane is a separate, restricted branch reached through a controlled management path.",
  motionDuration: 2400,
  mainPacketRoute: { d: "M170,90 H200 M370,90 H400 M580,90 H610", length: 90 },
  edges: [
    { id: "client-dns", from: "client", to: "dns", d: "M170,90 H200", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "dns-proxy", from: "dns", to: "proxy", d: "M370,90 H400", length: 30, kind: "main", activeIn: ["normal", "failure"] },
    { id: "proxy-service", from: "proxy", to: "service", d: "M580,90 H610", length: 30, kind: "main", activeIn: ["normal"] },
    { id: "proxy-management", from: "proxy", to: "management", d: "M495,120 V220", length: 100, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    { id: "client", label: "Client", x: 10, y: 60, w: 160, h: 60, activeIn: ["normal", "failure"], description: "Any normal client on the network — resolves the friendly hostname, never sees the management plane." },
    { id: "dns", label: "Internal DNS", x: 200, y: 60, w: 170, h: 60, activeIn: ["normal", "failure"], description: "Resolves the hostname to the private proxy address; the router exposes no inbound ports." },
    { id: "proxy", label: "Private proxy", x: 400, y: 55, w: 180, h: 70, activeIn: ["normal", "failure"], role: "boundary", focusableLabel: "Private proxy — resolves internally, exposes no inbound ports on the router, forwards to internal services only", description: "Trust boundary: a friendly hostname does not require public reachability." },
    { id: "service", label: "Internal service", x: 610, y: 60, w: 170, h: 60, activeIn: ["normal"], role: "safe", description: "The resolved route's destination — the validated outcome of the normal client path." },
    { id: "management", label: "Restricted management", x: 400, y: 220, w: 190, h: 60, activeIn: ["failure"], role: "blocked", focusableLabel: "Restricted management — the admin interface is bound to a controlled network, reached only through an authenticated tunnel", description: "The proxy's public listeners and its administration interface carry different risk and are isolated accordingly — a deliberate separation, not a failure." },
  ],
};

export default function ReverseProxyDiagram() {
  return <InteractiveFlowDiagram spec={spec} />;
}
