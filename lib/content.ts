export type Callout = { kind: "operational" | "warning" | "assumption" | "evidence"; text: string };
export type Section = { heading: string; paragraphs: string[]; code?: string; callout?: Callout };
export type Article = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  level: string;
  read: string;
  date: string;
  lastReviewed: string;
  number: string;
  intro: string;
  prerequisites: string[];
  sections: Section[];
};

export const articles: Article[] = [
{slug:"malware-gate-for-automated-downloads",title:"Building a fail-closed malware gate for automated downloads",dek:"How to keep untrusted files away from media services until scanning, verification, and release all succeed.",category:"Detection Engineering",level:"Intermediate",read:"12 min",date:"Aug 28, 2026",lastReviewed:"Aug 28, 2026",number:"01",intro:"Automation is useful precisely because it removes human waiting. That same quality makes it dangerous when untrusted files move through a pipeline faster than anyone can inspect them. This guide develops a safer pattern: isolate first, scan second, verify the result, and release only after every condition is satisfied.",prerequisites:["Comfortable with basic Linux file permissions and process states","Familiarity with a malware scanner such as ClamAV","Enough shell or scripting experience to automate state transitions"],sections:[
{heading:"The trust boundary",paragraphs:["A downloader should be treated as an untrusted ingestion service. Its output is not part of your library merely because a transfer completed. Place completed files in a staging path that downstream applications cannot read.","This is stronger than relying on application order. A filesystem boundary turns an operational expectation into an enforceable control: if the gate fails, content remains invisible."]},
{heading:"Design the state machine",paragraphs:["Use explicit states: downloading, complete, scanning, clean, released, and quarantined. Never infer completion from a filename alone, and never let a scanner timeout become an implicit pass."],code:"DOWNLOADING → COMPLETE → SCANNING → CLEAN → VERIFIED → RELEASED\n                              └→ INFECTED / ERROR → QUARANTINED"},
{heading:"Verify the release",paragraphs:["A successful move command is not enough. Confirm the destination exists, compare the expected size, and ensure the staging source is no longer exposed. Apply a bounded retry policy and fail closed when verification cannot complete.","Logs should record identifiers and outcomes without exposing credentials or full private paths. Alert on stuck scans, repeated replacement attempts, and any transition that bypasses verification."]},
{heading:"Test the failure paths",paragraphs:["The useful tests are uncomfortable ones: an incomplete transfer, a scanner outage, a malicious test file, two workers racing for the same item, and a release operation that reports success without moving data."],callout:{kind:"evidence",text:"A control is only proven when its failure mode is safe. In this design, every ambiguous outcome leaves the file isolated."}}]},
{slug:"vpn-bound-container-stack",title:"Proving a container can only reach the internet through a VPN",dek:"A practical verification method for network namespaces, kill switches, DNS behavior, and restart persistence.",category:"Container Security",level:"Intermediate",read:"10 min",date:"Aug 24, 2026",lastReviewed:"Aug 24, 2026",number:"02",intro:"A VPN badge in a dashboard is not evidence that application traffic is protected. The reliable pattern is architectural: make the application share the VPN container’s network namespace, restrict outbound routes, then test both the healthy and failed states.",prerequisites:["Basic Docker or container networking (namespaces, published ports)","Comfortable running docker exec and reading ip route output","A VPN client capable of running inside a container, such as Gluetun"],sections:[
{heading:"Share the boundary",paragraphs:["Attach the workload to the VPN container’s network namespace instead of giving it an independent network path. The workload no longer owns a separate interface that can quietly use the host gateway.","Publish required ports from the VPN service, and allow only the private subnets needed for local management."]},
{heading:"Prove the egress path",paragraphs:["Check the public address from inside the application container and compare it with the VPN service. Inspect routes and DNS resolvers as supporting evidence; neither alone proves the actual egress path."],code:"docker exec <app> curl -fsS https://ifconfig.me\ndocker exec <vpn> curl -fsS https://ifconfig.me\ndocker exec <app> ip route"},
{heading:"Test the kill switch",paragraphs:["Stop or break the tunnel without detaching the workload. Internet access should fail while explicitly allowed LAN management remains predictable."],callout:{kind:"warning",text:"If the application falls back to the host’s normal route when the tunnel drops, the design is not fail closed — treat that as a failed test, not an edge case."}},
{heading:"Recheck after restarts",paragraphs:["A one-time test misses startup races. Restart the stack and the host, then repeat the egress and failure tests. Capture the expected results in a small regression checklist so an image or configuration update cannot silently undo the boundary."]}]},
{slug:"reverse-proxy-home-lab",title:"A safer reverse proxy pattern for a private home lab",dek:"Split DNS, isolated listeners, internal TLS, and rollback planning without publishing services to the internet.",category:"Home Lab Security",level:"Foundational",read:"9 min",date:"Aug 18, 2026",lastReviewed:"Aug 18, 2026",number:"03",intro:"A reverse proxy can simplify a private lab without turning it into a public one. The key is to separate convenience from exposure: use internal resolution, bind proxy listeners deliberately, keep the management plane constrained, and plan the rollback before changing a production interface.",prerequisites:["A home lab with at least one internal DNS resolver","Basic reverse proxy concepts: virtual hosts, upstream targets","Comfortable issuing and installing certificates from an internal CA"],sections:[
{heading:"Separate names from exposure",paragraphs:["A friendly hostname does not require public reachability. Internal DNS can map service names to a dedicated private proxy address while the router exposes no inbound ports.","Document which resolver is authoritative for lab clients. Most mysterious proxy failures are actually DNS-path inconsistencies."]},
{heading:"Constrain the management plane",paragraphs:["The proxy’s public-facing listeners and its administration interface have different risk. Bind the admin interface to loopback or a tightly controlled management network and reach it through an authenticated tunnel when needed."]},
{heading:"Treat certificates as a trust decision",paragraphs:["An internal certificate authority works well for devices you control."],callout:{kind:"assumption",text:"This assumes appliances and TVs on the network can't easily trust a private CA. Decide per client class rather than forcing one certificate strategy everywhere."}},
{heading:"Make rollback part of deployment",paragraphs:["Before changing the host interface, verify the new address is unused and use a commit-confirm or timed rollback mechanism. Validate direct access and proxied access independently. A proxy migration is complete only when a failed change cannot strand the management UI."]}]}
];

export type CaseStudy = {
  problem: string;
  threatModel: string;
  trustBoundary: string;
  architecture: string;
  failureModes: string[];
  controls: string[];
  validation: string;
  evidence: string;
  limitations: string;
  lessons: string;
};

export type Project = {
  index: string;
  title: string;
  status: "Validated" | "Operational" | "Design";
  text: string;
  tags: string[];
  problem: string;
  limitation: string;
  slug?: string;
  guideSlug?: string;
  caseStudy?: CaseStudy;
};

export const projects: Project[] = [
{index:"P-01",title:"Fail-Closed File Intake",status:"Validated",text:"A staged malware-scanning pipeline that prevents downstream import until completion, scan, and move verification all pass.",tags:["ClamAV","Python","Docker"],
problem:"Automated downloads land faster than anyone can manually inspect them — a single infected or corrupted file reaching a media library is worse than a slower pipeline.",
limitation:"Scan latency for very large files can leave content quarantined longer than expected under load; there's a bounded retry policy, not a latency guarantee.",
slug:"fail-closed-file-intake",
guideSlug:"malware-gate-for-automated-downloads",
caseStudy:{
  problem:"Automated downloads land faster than anyone can manually inspect them — a single infected or corrupted file reaching a media library is worse than a slower pipeline.",
  threatModel:"An automated downloader is treated as an untrusted ingestion service. Its output isn't part of the library merely because a transfer completed — the risk being defended against is malicious or corrupted content reaching a media service before it has been scanned.",
  trustBoundary:"Completed downloads land in a staging path that downstream applications cannot read. That boundary is enforced at the filesystem level, not just by application ordering, so a gate failure leaves content invisible rather than silently accessible.",
  architecture:"An explicit state machine — DOWNLOADING → COMPLETE → SCANNING → CLEAN → VERIFIED → RELEASED — with any ambiguous or failed outcome routed to INFECTED/ERROR → QUARANTINED. No state is inferred from a filename, and a scanner timeout is never treated as an implicit pass.",
  failureModes:["An incomplete transfer treated as complete","A scanner outage silently skipped instead of blocking release","A malicious test file reaching the release path","Two workers racing to release the same item","A move operation reporting success without actually relocating the file"],
  controls:["A filesystem-level staging boundary downstream services cannot read","An explicit state machine with no implicit transitions","Destination existence and size verification before a release counts as complete","A bounded retry policy with fail-closed behavior on verification failure","Logging of identifiers and outcomes without credentials or full private paths"],
  validation:"Each failure mode above was exercised deliberately rather than assumed: interrupting transfers mid-flight, taking the scanner offline, submitting a known-bad test file, and running two workers against the same item concurrently.",
  evidence:"A control is only proven when its failure mode is safe. In this design, every ambiguous outcome — a stalled scan, a race, an unclear move result — leaves the file isolated rather than released.",
  limitations:"Scan latency for very large files can leave content quarantined longer than expected under load; there's a bounded retry policy, not a latency guarantee.",
  lessons:"The state machine was easier to get right than the verification step. The tempting shortcut is trusting a successful-looking move command — that's exactly the assumption worth testing first.",
}},
{index:"P-02",title:"VPN-Isolated Workloads",status:"Operational",text:"A shared-network-namespace design with controlled LAN access, verified tunnel egress, and kill-switch regression checks.",tags:["Gluetun","Networking","Containers"],
problem:"A VPN status badge in a dashboard doesn't prove application traffic is actually routed through the tunnel — a misconfigured route can leak straight to the ISP.",
limitation:"Kill-switch testing currently covers planned tunnel stops and host restarts; it hasn't been exercised against every possible VPN client crash mode.",
guideSlug:"vpn-bound-container-stack"},
{index:"P-03",title:"Private Service Gateway",status:"Operational",text:"An internal reverse proxy with split DNS, isolated management access, internal TLS, backup, and tested rollback.",tags:["Nginx","PKI","DNS"],
problem:"Convenient internal hostnames for home-lab services shouldn't require exposing anything to the public internet.",
limitation:"Client classes that can't easily trust an internal CA — some smart TVs and appliances — still need a case-by-case exception rather than one unified certificate strategy.",
guideSlug:"reverse-proxy-home-lab"},
{index:"P-04",title:"Kubernetes Parity Migration",status:"Design",text:"A zero-change migration plan that preserves ports, paths, credentials, networking behavior, data, and recovery semantics.",tags:["K3s","Architecture","GitOps"],
problem:"Moving existing services onto Kubernetes is only safe if the migration preserves every port, path, credential, and recovery behavior — not just \"roughly works.\"",
limitation:"Still in the design phase — no production traffic has been cut over yet, so real-world parity is unverified beyond the plan."}];
