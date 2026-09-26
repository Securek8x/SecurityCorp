import type { IsoDate } from "./content-dates.ts";
import {
  checkProjectEvidence,
  verifyOperationalState,
  type CheckedEvidence,
  type OperationalState,
  type ProjectEvidenceInput,
} from "./evidence.ts";

export type Callout = { kind: "operational" | "warning" | "assumption" | "evidence"; text: string };
export type Section = { heading: string; paragraphs: string[]; code?: string; callout?: Callout };
export type Article = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  level: string;
  read: string;
  /** Canonical YYYY-MM-DD; format with formatDisplayDate from ./content-dates.ts. */
  publishedAt: IsoDate;
  lastReviewedAt: IsoDate;
  number: string;
  intro: string;
  prerequisites: string[];
  sections: Section[];
};

export const articles: Article[] = [
{slug:"malware-gate-for-automated-downloads",title:"Building a fail-closed malware gate for automated downloads",dek:"How to keep untrusted files away from media services until scanning, verification, and release all succeed.",category:"Detection Engineering",level:"Intermediate",read:"12 min",publishedAt:"2026-08-28",lastReviewedAt:"2026-08-28",number:"01",intro:"Automation is useful precisely because it removes human waiting. That same quality makes it dangerous when untrusted files move through a pipeline faster than anyone can inspect them. This guide develops a safer pattern: isolate first, scan second, verify the result, and release only after every condition is satisfied.",prerequisites:["Comfortable with basic Linux file permissions and process states","Familiarity with a malware scanner such as ClamAV","Enough shell or scripting experience to automate state transitions"],sections:[
{heading:"The trust boundary",paragraphs:["A downloader should be treated as an untrusted ingestion service. Its output is not part of your library merely because a transfer completed. Place completed files in a staging path that downstream applications cannot read.","This is stronger than relying on application order. A filesystem boundary turns an operational expectation into an enforceable control: if the gate fails, content remains invisible."]},
{heading:"Design the state machine",paragraphs:["Use explicit states: downloading, complete, scanning, clean, released, and quarantined. Never infer completion from a filename alone, and never let a scanner timeout become an implicit pass."],code:"DOWNLOADING → COMPLETE → SCANNING → CLEAN → VERIFIED → RELEASED\n                              └→ INFECTED / ERROR → QUARANTINED"},
{heading:"Verify the release",paragraphs:["A successful move command is not enough. Confirm the destination exists, compare the expected size, and ensure the staging source is no longer exposed. Apply a bounded retry policy and fail closed when verification cannot complete.","Logs should record identifiers and outcomes without exposing credentials or full private paths. Alert on stuck scans, repeated replacement attempts, and any transition that bypasses verification."]},
{heading:"Test the failure paths",paragraphs:["The useful tests are uncomfortable ones: an incomplete transfer, a scanner outage, a malicious test file, two workers racing for the same item, and a release operation that reports success without moving data."],callout:{kind:"evidence",text:"A control is only proven when its failure mode is safe. In this design, every ambiguous outcome leaves the file isolated."}}]},
{slug:"vpn-bound-container-stack",title:"Proving a container can only reach the internet through a VPN",dek:"A practical verification method for network namespaces, kill switches, DNS behavior, and restart persistence.",category:"Container Security",level:"Intermediate",read:"10 min",publishedAt:"2026-08-24",lastReviewedAt:"2026-08-24",number:"02",intro:"A VPN badge in a dashboard is not evidence that application traffic is protected. The reliable pattern is architectural: make the application share the VPN container’s network namespace, restrict outbound routes, then test both the healthy and failed states.",prerequisites:["Basic Docker or container networking (namespaces, published ports)","Comfortable running docker exec and reading ip route output","A VPN client capable of running inside a container."],sections:[
{heading:"Share the boundary",paragraphs:["Attach the workload to the VPN container’s network namespace instead of giving it an independent network path. The workload no longer owns a separate interface that can quietly use the host gateway.","Publish required ports from the VPN service, and allow only the private subnets needed for local management."]},
{heading:"Prove the egress path",paragraphs:["Check the public address from inside the application container and compare it with the VPN service. Inspect routes and DNS resolvers as supporting evidence; neither alone proves the actual egress path."],code:"docker exec <app> curl -fsS https://ifconfig.me\ndocker exec <vpn> curl -fsS https://ifconfig.me\ndocker exec <app> ip route"},
{heading:"Test the kill switch",paragraphs:["Stop or break the tunnel without detaching the workload. Internet access should fail while explicitly allowed LAN management remains predictable."],callout:{kind:"warning",text:"If the application falls back to the host’s normal route when the tunnel drops, the design is not fail closed — treat that as a failed test, not an edge case."}},
{heading:"Recheck after restarts",paragraphs:["A one-time test misses startup races. Restart the stack and the host, then repeat the egress and failure tests. Capture the expected results in a small regression checklist so an image or configuration update cannot silently undo the boundary."]}]},
{slug:"reverse-proxy-home-lab",title:"A safer reverse proxy pattern for a private home lab",dek:"Split DNS, isolated listeners, internal TLS, and rollback planning without publishing services to the internet.",category:"Home Lab Security",level:"Foundational",read:"9 min",publishedAt:"2026-08-18",lastReviewedAt:"2026-08-18",number:"03",intro:"A reverse proxy can simplify a private lab without turning it into a public one. The key is to separate convenience from exposure: use internal resolution, bind proxy listeners deliberately, keep the management plane constrained, and plan the rollback before changing a production interface.",prerequisites:["A home lab with at least one internal DNS resolver","Basic reverse proxy concepts: virtual hosts, upstream targets","Comfortable issuing and installing certificates from an internal CA"],sections:[
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
  /** The documented design expectation — what should happen. Never an
   * observed result; those live only on the project's evidence records. */
  designExpectation: string;
  limitations: string;
  lessons: string;
};

/** Authoring shape: evidence and operational state are untrusted until
 * buildProjects() checks them. */
export type ProjectInput = {
  index: string;
  title: string;
  text: string;
  tags: string[];
  problem: string;
  limitation: string;
  slug?: string;
  guideSlug?: string;
  caseStudy?: CaseStudy;
  evidence: ProjectEvidenceInput;
  /** Optional, and only with a dated source. Absent = no operational claim.
   * None is set below: the legacy "Operational" values were an overloaded
   * status with no recorded operational source (s41.20.5). */
  operationalState?: OperationalState;
};

export type Project = Omit<ProjectInput, "evidence" | "operationalState"> & {
  /** Verified evidence, or an explicit rejection that renders as
   * "Evidence unavailable" — never as Validated. */
  evidence: CheckedEvidence;
  operationalState?: OperationalState;
};

/**
 * The authoritative construction boundary for project evidence. Every
 * consumer reads `projects` (built here), so nothing downstream sees
 * unverified evidence. Malformed evidence fails closed to "unavailable";
 * a malformed operational state fails closed to "no claim". Both are
 * reported in `errors`, which lib/evidence.test.ts requires to be empty.
 */
export function buildProjects(inputs: readonly unknown[]): { projects: Project[]; errors: string[] } {
  const errors: string[] = [];
  const built: Project[] = [];
  inputs.forEach((raw, i) => {
    if (typeof raw !== "object" || raw === null || typeof (raw as ProjectInput).index !== "string") {
      errors.push(`project #${i}: not a project object with an index — excluded`);
      return;
    }
    const input = raw as ProjectInput;
    const label = input.index;
    const evidence = checkProjectEvidence(label, input.evidence);
    if ("unavailable" in evidence) errors.push(...evidence.errors);
    const operational = verifyOperationalState(label, input.operationalState);
    if (!operational.ok) errors.push(...operational.errors);
    const { operationalState: _ignored, ...rest } = input;
    void _ignored;
    built.push({ ...rest, evidence, ...(operational.ok && operational.value ? { operationalState: operational.value } : {}) } as Project);
  });
  return { projects: built, errors };
}

export const projectInputs: readonly ProjectInput[] = [
{index:"P-01",title:"Fail-Closed File Intake",text:"A staged malware-scanning pipeline that prevents downstream import until completion, scan, and move verification all pass.",tags:["ClamAV","Python","Docker"],
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
  validation:"Each failure mode above was reported as exercised deliberately — interrupting transfers mid-flight, taking the scanner offline, submitting a known-bad test file, and running two workers against the same item. Only the scanner outage has a recorded observed result: the scanner was taken offline and the release step never ran. The other four were reported as exercised but have no recorded observed result, so they remain Documented until one is.",
  designExpectation:"A control is only proven when its failure mode is safe. In this design, every ambiguous outcome — a stalled scan, a race, an unclear move result — leaves the file isolated rather than released.",
  limitations:"Scan latency for very large files can leave content quarantined longer than expected under load; there's a bounded retry policy, not a latency guarantee.",
  lessons:"The state machine was easier to get right than the verification step. The tempting shortcut is trusting a successful-looking move command — that's exactly the assumption worth testing first.",
},
// Five failure paths (the five caseStudy.failureModes). Only the scanner
// outage has a recorded observed result. The other four were reported as
// exercised in the case study's own account, which is kept as "reported" —
// not upgraded to a result, and not presented as never having run.
evidence:{unit:"failure path",records:[
  {id:"incomplete-transfer",claim:"An incomplete transfer is never treated as complete",maturity:"documented",observation:{kind:"reported",note:"Reported as exercised by interrupting transfers mid-flight."}},
  {id:"scanner-outage",claim:"A scanner outage blocks release instead of being skipped",maturity:"validated",observation:{kind:"recorded",result:"A scanner outage was simulated deliberately and the release step never ran.",outcome:"as-intended"}},
  {id:"malicious-test-file",claim:"A known-bad test file never reaches the release path",maturity:"documented",observation:{kind:"reported",note:"Reported as exercised by submitting a known-bad test file."}},
  {id:"worker-race",claim:"Two workers racing the same item cannot both release it",maturity:"documented",observation:{kind:"reported",note:"Reported as exercised by running two workers against the same item."}},
  {id:"false-success-move",claim:"A move that reports success without relocating the file is caught by verification",maturity:"documented",observation:{kind:"reported",note:"Reported as exercised along with the other failure modes."}},
]}},
{index:"P-02",title:"VPN-Isolated Workloads",text:"A shared-network-namespace design with controlled LAN access, a documented tunnel-egress check, and a validated kill-switch test.",tags:["VPN Isolation","Networking","Containers"],
problem:"A VPN status badge in a dashboard doesn't prove application traffic is actually routed through the tunnel — a misconfigured route can leak straight to the ISP.",
limitation:"Kill-switch testing currently covers planned tunnel stops and host restarts; it hasn't been exercised against every possible VPN client crash mode.",
guideSlug:"vpn-bound-container-stack",
// The three claims the original build-log entry enumerated ("namespace
// sharing, egress proof, and kill-switch testing … confirmed against a live
// stack"). Only the kill switch has a recorded observed result (the Failure
// Lab record). Restart rechecks are guide advice and a scope note on the
// kill-switch limitation, not a separate evidence claim.
evidence:{records:[
  {id:"namespace-sharing",claim:"The workload shares the VPN container's network namespace and has no independent route to the host gateway",maturity:"documented",observation:{kind:"reported",note:"Reported as confirmed against a live stack."}},
  {id:"egress-path",claim:"Application egress matches the VPN service's public address",maturity:"documented",observation:{kind:"reported",note:"Reported as confirmed against a live stack."}},
  {id:"kill-switch",claim:"Stopping the tunnel blocks outbound access with no fallback to the host route",maturity:"validated",observation:{kind:"recorded",result:"The tunnel was stopped directly and outbound access failed as expected.",outcome:"as-intended"}},
]}},
{index:"P-03",title:"Private Service Gateway",text:"An internal reverse proxy with split DNS, isolated management access, internal TLS, backup, and a documented rollback plan.",tags:["Nginx","PKI","DNS"],
problem:"Convenient internal hostnames for home-lab services shouldn't require exposing anything to the public internet.",
limitation:"Client classes that can't easily trust an internal CA — some smart TVs and appliances — still need a case-by-case exception rather than one unified certificate strategy.",
guideSlug:"reverse-proxy-home-lab",
evidence:{records:[
  {id:"rollback",claim:"A commit-confirm or timed rollback restores the previous configuration if a host-interface change fails",maturity:"documented",observation:{kind:"none"}},
]}},
{index:"P-04",title:"Kubernetes Parity Migration",text:"A zero-change migration plan that preserves ports, paths, credentials, networking behavior, data, and recovery semantics.",tags:["K3s","Architecture","GitOps"],
problem:"Moving existing services onto Kubernetes is only safe if the migration preserves every port, path, credential, and recovery behavior — not just \"roughly works.\"",
limitation:"Still in the design phase — no production traffic has been cut over yet, so real-world parity is unverified beyond the plan.",
evidence:{records:[
  {id:"parity-plan",claim:"The migration preserves ports, paths, credentials, networking behavior, data, and recovery semantics",maturity:"design",observation:{kind:"none"}},
]}}];

const built = buildProjects(projectInputs);
export const projects: Project[] = built.projects;
/** Must be empty; enforced by lib/evidence.test.ts (part of `npm test`). */
export const projectIntegrityErrors: readonly string[] = built.errors;
