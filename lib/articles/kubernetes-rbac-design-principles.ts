// Knowledge-base article draft (Bead securitycorp-source-4zl.54.3.3,
// "Kubernetes RBAC Design Principles"). Status is intentionally "drafting"
// and every review record is intentionally "pending" — see
// docs/publication-safety-policy.md. This agent is not authorized to set
// status to "published" or to mark any review "approved"; those remain
// human decisions. All examples describe a fictional namespace, fictional
// ServiceAccounts, and fictional Role/ClusterRole names; no real cluster,
// namespace, credential, hostname, or infrastructure detail appears
// anywhere in this file.
//
// Differentiation from the other identity/access-scoped articles already in
// this catalog: lib/articles/least-privilege-for-pipeline-identities.ts
// scopes a CI/CD pipeline identity's permissions and trust condition at
// grant time, in any runtime context — it is not Kubernetes-specific and
// does not explain RBAC's own object model. lib/articles/cloud-iam-permission-creep.ts
// is about permission DRIFT over time in cloud IAM, not Kubernetes RBAC's
// mechanics. lib/articles/workload-identities-vs-long-lived-credentials.ts
// is about the credential mechanism a workload authenticates with (a
// projected service-account token is one example it cites), not about how
// RBAC then decides what that authenticated identity may do.
// lib/articles/docker-to-k3s-migration-zero-change.ts mentions RBAC only in
// passing, as one of several platform-default changes a migration surfaces.
// This article is the dedicated treatment of Kubernetes RBAC's own object
// model (Role/ClusterRole, RoleBinding/ClusterRoleBinding), the scoping
// decision between them, common RBAC-specific anti-patterns, and how to
// verify effective permissions with kubectl auth can-i — referenced from
// those other articles rather than repeated there.
//
// Editorial routing note: per this repo's Ruflo routing requirement, a real
// mcp__ruflo__workflow_run invocation was attempted before drafting
// (workflow id workflow-1788532531926-ncvz44, task-based custom workflow —
// mcp__ruflo__workflow_template list returned zero registered templates, so
// the task description itself carried the research objective, audience,
// and scope). A bounded mcp__ruflo__workflow_status check afterward
// reproduced the documented issue in CLAUDE.md: 0% progress, a single
// pending "Execute" stage, no retrievable editorial output. This draft was
// therefore produced with the disclosed native fallback instead — separate
// research, drafting, technical-verification, publication-safety, and
// final-editorial passes — not credited to Ruflo. Every citation below was
// independently verified via WebFetch/WebSearch against its primary source
// (Kubernetes' own documentation, CIS, NIST, and CISA) before inclusion;
// none were invented.
import type { KnowledgeArticle } from "../knowledge-content.ts";
import type { UniversalSections, GuideModule } from "../knowledge-content-types.ts";
import type { FlowDiagramSpec } from "@/components/diagrams/interactive-flow-diagram";

const diagram: FlowDiagramSpec = {
  titleId: "rbac-scoped-vs-cluster-admin-diagram",
  title: "A scoped namespace binding vs. a cluster-admin binding out of convenience",
  desc: "A fictional subject requests access two ways. Interactive: switch between the normal flow, where the subject is bound through a RoleBinding to a namespace-scoped Role granting only the verbs it needs on one resource type, and a failure mode showing what happens when the same subject is instead bound to the built-in cluster-admin ClusterRole through a ClusterRoleBinding created out of convenience — explore each node's role in the diagram.",
  viewBox: "0 0 1000 300",
  failureLabel: "Bound to cluster-admin",
  caption:
    "Fictional subject: in the normal path, a RoleBinding ties the subject to a namespace-scoped Role whose rules list specific verbs and resources, so the subject can act only on the one resource type, in the one namespace, the binding names. In the failure mode, the same subject is instead given a ClusterRoleBinding to the built-in cluster-admin ClusterRole — a wildcard grant (apiGroups '*', resources '*', verbs '*') — reachable across every namespace and every cluster-scoped resource, granted 'to save time' rather than because the subject's actual workload needed cluster-wide superuser access.",
  motionDuration: 2600,
  mainPacketRoute: {
    d: "M160,95 H610",
    length: 450,
  },
  edges: [
    { id: "subject-rolebinding", from: "subject", to: "role-binding", d: "M160,95 H190", length: 30, kind: "main", activeIn: ["normal"] },
    { id: "rolebinding-role", from: "role-binding", to: "namespace-role", d: "M360,95 H400", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "role-target", from: "namespace-role", to: "target-resource", d: "M570,95 H610", length: 40, kind: "main", activeIn: ["normal"] },
    { id: "subject-clusterbinding", from: "subject", to: "cluster-role-binding", d: "M85,130 V205", length: 75, kind: "failure", activeIn: ["failure"] },
    { id: "clusterbinding-clusteradmin", from: "cluster-role-binding", to: "cluster-admin-role", d: "M360,235 H400", length: 40, kind: "failure", activeIn: ["failure"] },
    { id: "clusteradmin-other", from: "cluster-admin-role", to: "other-namespaces", d: "M570,235 H610", length: 40, kind: "failure", activeIn: ["failure"] },
    { id: "other-target", from: "other-namespaces", to: "target-resource", d: "M695,205 V130", length: 75, kind: "failure", activeIn: ["failure"] },
  ],
  nodes: [
    {
      id: "subject",
      label: "Subject (ServiceAccount)",
      x: 10,
      y: 60,
      w: 150,
      h: 70,
      activeIn: ["normal", "failure"],
      description:
        "A fictional subject — a ServiceAccount, user, or group — requesting access to a cluster resource. What that subject is actually bound to decides everything downstream; the subject itself carries no scope of its own.",
    },
    {
      id: "role-binding",
      label: "RoleBinding",
      x: 190,
      y: 60,
      w: 170,
      h: 70,
      role: "boundary",
      activeIn: ["normal"],
      focusableLabel: "RoleBinding — ties the subject to a Role, scoped to one namespace; normal path only",
      description:
        "Grants the referenced Role's permissions to the subject, and only within the namespace the RoleBinding itself lives in. Even if this RoleBinding referenced a ClusterRole instead of a Role, the grant would still be confined to this one namespace — the binding, not the role, decides the scope.",
    },
    {
      id: "namespace-role",
      label: "Namespace-scoped Role",
      x: 400,
      y: 60,
      w: 170,
      h: 70,
      role: "boundary",
      activeIn: ["normal"],
      focusableLabel: "Namespace-scoped Role — lists specific verbs and resources, not wildcards; normal path only",
      description:
        "A Role whose rules list specific verbs (for example get, list, watch) against a specific resource type, with no wildcard. It exists only in one namespace and cannot be referenced from another.",
    },
    {
      id: "target-resource",
      label: "Target resource, one namespace",
      x: 610,
      y: 60,
      w: 170,
      h: 70,
      role: "safe",
      activeIn: ["normal", "failure"],
      description:
        "The one resource type, in one namespace, the subject actually needs to reach. In the normal path it is reached only through the narrow Role's listed verbs. In the failure mode it is still reachable — but so is everything else, because the binding no longer limits the subject to it.",
    },
    {
      id: "cluster-role-binding",
      label: "ClusterRoleBinding to cluster-admin",
      x: 190,
      y: 205,
      w: 170,
      h: 60,
      activeIn: ["failure"],
      focusableLabel: "ClusterRoleBinding to cluster-admin — granted out of convenience; failure mode only",
      description:
        "Failure-mode only: instead of a scoped RoleBinding, the subject is granted a ClusterRoleBinding to the built-in cluster-admin ClusterRole — typically because narrowing the actual permissions needed was skipped to unblock work quickly.",
    },
    {
      id: "cluster-admin-role",
      label: "cluster-admin ClusterRole (wildcard)",
      x: 400,
      y: 205,
      w: 170,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "cluster-admin ClusterRole — wildcard apiGroups, resources, and verbs; failure mode only",
      description:
        "The built-in ClusterRole whose rules grant every verb on every resource in every API group. It exists for genuine cluster-superuser needs (initial bootstrapping, break-glass access); binding an ordinary workload's subject to it grants far more than that workload's own task requires.",
    },
    {
      id: "other-namespaces",
      label: "Every other namespace and cluster-scoped resource",
      x: 610,
      y: 205,
      w: 170,
      h: 60,
      role: "blocked",
      activeIn: ["failure"],
      focusableLabel: "Every other namespace and cluster-scoped resource — reachable only in the failure mode",
      description:
        "Failure-mode only: because a ClusterRoleBinding applies cluster-wide, the subject can now act on every namespace's resources and every cluster-scoped resource (nodes, persistent volumes, the ClusterRole and ClusterRoleBinding objects themselves), not just the one resource its actual workload needed.",
    },
  ],
};

const sections: UniversalSections = {
  executiveSummary: [
    "Kubernetes RBAC (role-based access control) decides which subject — a user, a group, or a ServiceAccount — can perform which verb (get, list, create, delete, and so on) against which resource, and in which scope. The object model has exactly four pieces: Role and ClusterRole define permissions; RoleBinding and ClusterRoleBinding grant those permissions to a subject. Getting the scoping decision right — Role by default, ClusterRole only for a genuinely cluster-wide need — is most of what separates a cluster where 'least privilege' is an enforced property from one where it is an aspiration written in a design document.",
    "RBAC being present and configured is not the same as RBAC being correct. A cluster can have Roles, RoleBindings, and reasonable-looking YAML everywhere and still grant far more access than any single file suggests, because Kubernetes RBAC is purely additive: a subject's effective permission is the union of every Role and ClusterRole bound to it, directly or through group membership, with no explicit 'deny' rule available to narrow that union back down. This guide covers the Role/ClusterRole and RoleBinding/ClusterRoleBinding distinction, three common anti-patterns (wildcard grants, convenience bindings to cluster-admin, and over-permissioned ServiceAccounts), and how to check what a subject can actually do — with kubectl auth can-i — rather than trusting what one binding's YAML appears to claim.",
  ],
  whatYouWillLearn: [
    "The structural difference between Role/ClusterRole (what is permitted) and RoleBinding/ClusterRoleBinding (who gets it and in what scope), including the specific case of a RoleBinding referencing a ClusterRole to reuse a permission set without granting cluster-wide reach.",
    "Why a namespace-scoped Role should be the default choice, and the concrete situations where a ClusterRole is actually required (cluster-scoped resources, cross-namespace grants, non-resource URLs).",
    "Three RBAC-specific anti-patterns: wildcard verbs/resources, binding a workload's subject to the built-in cluster-admin ClusterRole out of convenience, and ServiceAccounts carrying far more permission than the workload running under them needs.",
    "Why RBAC's additive-only model means a Role's YAML never proves what a subject can do on its own, and how to verify effective permission directly with kubectl auth can-i, --list, and --as/--as-group impersonation.",
  ],
  intendedAudience: [
    "Platform engineers designing or reviewing a cluster's Role and RoleBinding layout.",
    "Security engineers auditing whether a cluster's actual permission surface matches its intended least-privilege design.",
    "Practitioners who have written a Role or ClusterRole from a copied example and want the underlying scoping logic, not just working YAML.",
  ],
  prerequisites: [
    "Basic familiarity with Kubernetes objects (Pods, namespaces) and with kubectl.",
    "A fictional or isolated lab cluster you control and are authorized to configure — a local kind, minikube, or k3s instance is sufficient; this guide does not require a managed cloud cluster.",
    "No prior RBAC-specific knowledge is assumed; this guide explains the object model from first principles and uses fictional names throughout.",
  ],
  problem: [
    "RBAC's four-object model (Role, ClusterRole, RoleBinding, ClusterRoleBinding) is small, but the scoping decisions it requires are easy to get backwards under time pressure. A ClusterRole is easier to write once and reuse everywhere; a wildcard verb list is easier than enumerating the exact verbs a workload actually calls; binding a stuck deployment to cluster-admin unblocks it immediately. Each shortcut works in the moment and each one silently widens the cluster's actual attack surface, because none of them fail loudly — a workload with more permission than it needs runs exactly the same as one that is correctly scoped, until the extra permission is the thing an attacker who compromises that workload uses next.",
    "Kubernetes' own RBAC documentation is explicit that role-based access control's purpose is to let an operator 'grant the minimum permissions required' so that 'pods that use that service account don't get more permissions than are required to function correctly' — but the mechanism only enforces what it is actually configured to enforce (Kubernetes, Service Accounts documentation). A cluster with RBAC enabled and a cluster with RBAC enabled and correctly scoped are not the same cluster.",
  ],
  threatModel: [
    "Assets: every resource type (Pods, Secrets, ConfigMaps, and cluster-scoped objects such as nodes and persistent volumes) that a subject's aggregate RBAC grants can reach, plus the RBAC objects themselves (a subject that can create RoleBindings or ClusterRoleBindings can grant itself further access).",
    "The central trust decision RBAC makes: a request is authorized only if some Role or ClusterRole, bound to the requesting subject through some RoleBinding or ClusterRoleBinding, explicitly lists the requested verb and resource. Kubernetes' own authorization documentation states this directly: 'access is denied by default,' and when multiple authorization checks apply, a request proceeds only if at least one explicitly approves it (Kubernetes, Authorization Overview documentation). RBAC itself has no explicit deny rule — every Role and ClusterRole is a positive, additive grant, so a subject's effective permission is the union of everything bound to it, and removing one narrow binding does nothing if a broader one elsewhere still applies.",
    "Representative threats: a Role or ClusterRole with verbs: [\"*\"] or resources: [\"*\"] grants far more than the workload's observed call pattern needs, and that gap is invisible until something (or someone) exercises it. A ClusterRoleBinding to cluster-admin, created to unblock a stuck deployment, persists long after the blocker is resolved because nothing forces its removal. A Pod's default ServiceAccount — which every namespace has automatically (Kubernetes, Service Accounts documentation) — receives a mounted token and, if bound to an over-broad Role, hands that same over-broad access to any code running in that Pod, including code an attacker manages to execute via an unrelated vulnerability.",
    "The interactive diagram accompanying this article shows the structural difference: in the normal path, a RoleBinding ties the subject to a namespace-scoped Role listing specific verbs, reaching only the one resource type in the one namespace it needs. In the failure mode, the same subject is instead bound to the built-in cluster-admin ClusterRole through a ClusterRoleBinding — a wildcard grant reachable across every namespace and every cluster-scoped resource, because the binding was created for convenience rather than because the subject's workload needed cluster-wide access.",
  ],
  mainContent: [
    "**Role and ClusterRole define permissions; they do not grant anything by themselves.** A Role's `rules` list specific verbs (get, list, watch, create, update, patch, delete, and others) against specific resource types and, optionally, specific resource names — and nothing is authorized until a RoleBinding or ClusterRoleBinding actually attaches that Role to a subject. A Role is namespace-scoped: it must be created inside a specific namespace, and its rules apply only to resources in that namespace. A ClusterRole is not namespaced — it is a cluster-wide object. Kubernetes' own RBAC documentation is explicit about why these are two separate object kinds rather than one: 'a Kubernetes object always has to be either namespaced or not namespaced; it can't be both' (Kubernetes, Using RBAC Authorization documentation).",
    "**A ClusterRole has legitimate uses beyond 'cluster-admin' — and most of them are not what a typical namespaced workload needs.** The official documentation lists ClusterRole's actual use cases: defining permissions on cluster-scoped resources (such as nodes or persistent volumes, which have no namespace to scope a Role to), defining permissions on non-resource endpoints (such as `/healthz`), and defining a reusable permission set that can be granted either within one namespace or across every namespace, depending on how it is bound (Kubernetes, Using RBAC Authorization documentation). None of those cases is 'this Role would have worked but I wrote a ClusterRole instead to save a step' — each one is a permission that a namespace-scoped Role structurally cannot express.",
    "**RoleBinding and ClusterRoleBinding decide scope, not just 'who' — and the binding, not the role, is what limits a ClusterRole's reach.** A RoleBinding grants permissions within one specific namespace: the namespace it is created in. It can reference either a Role in that same namespace, or a ClusterRole — and the documented behavior for the second case is worth internalizing exactly, because it is a genuinely useful and commonly misunderstood pattern: binding a ClusterRole through a RoleBinding scopes that ClusterRole's rules to the RoleBinding's own namespace only, not cluster-wide (Kubernetes, Using RBAC Authorization documentation). This is how a cluster reuses one well-defined permission set (say, 'read-only access to Secrets') across many namespaces without maintaining a near-duplicate Role per namespace — write the ClusterRole once, bind it per namespace with an ordinary RoleBinding, and each binding stays confined to its own namespace. A ClusterRoleBinding, by contrast, grants the referenced ClusterRole's permissions across every namespace in the cluster and for every cluster-scoped resource the ClusterRole's rules cover — there is no namespace to confine it to.",
    "**The default should be Role, and the ClusterRole/ClusterRoleBinding path should require a specific, statable reason.** Given the two mechanisms above, a subject that only needs access within one namespace should get a Role bound with a RoleBinding — full stop, even if that means writing the same shaped Role in three different namespaces instead of one ClusterRole. Reach for a ClusterRole only when the permission genuinely cannot be expressed any other way: a cluster-scoped resource, a non-resource URL, or a cross-namespace grant that is an actual requirement of the workload rather than a convenience for the person configuring it. 'This subject might need another namespace later' is not that reason; RBAC objects are cheap to add when the actual need appears.",
    "**Wildcard verbs and resources are the first anti-pattern, and they defeat the entire purpose of writing a Role in the first place.** A rule such as `apiGroups: [\"*\"]`, `resources: [\"*\"]`, `verbs: [\"*\"]` is technically valid RBAC syntax, and it is exactly the rule the built-in cluster-admin ClusterRole itself uses — which is precisely the point: that grant shape is reserved for genuine cluster-superuser needs (initial bootstrapping, break-glass access), not for an ordinary workload's Role. The CIS Kubernetes Benchmark's RBAC-related recommendations exist specifically to catch this pattern: a cluster audited against the benchmark is checked for exactly this kind of over-broad wildcard grant and for unnecessary use of the cluster-admin role, as part of the benchmark's broader least-privilege access-control guidance (CIS Kubernetes Benchmark). NIST's control on least privilege states the general principle a wildcard grant violates directly: an organization should employ 'the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) that are necessary to accomplish assigned organizational tasks' (NIST SP 800-53 Rev. 5, control AC-6, Least Privilege). A wildcard rule is the opposite of that by construction — it grants every verb on every resource regardless of what the workload's actual call pattern is.",
    "**Binding to cluster-admin out of convenience is the second anti-pattern, and it is usually a shortcut that outlives the reason for taking it.** The common path: a Pod or a person hits a permission error, someone (correctly) doesn't want to spend time enumerating the exact missing verb and resource, and a ClusterRoleBinding to cluster-admin makes the error disappear immediately. The workload now works — and also now has standing, cluster-wide superuser access it will keep until someone deliberately revisits and narrows it, which in practice often never happens, because nothing about a working workload prompts that revisit. Joint NSA and CISA Kubernetes hardening guidance treats RBAC misconfiguration as a named risk category and calls for continuously monitoring and enforcing least-privilege role assignment across a cluster's authorized users and workloads specifically because this kind of scope creep is common in practice (NSA and CISA, Kubernetes Hardening Guidance, announced). The fix is procedural, not just technical: treat 'bound to cluster-admin' as a finding that requires a written justification, the same way an unresolved wildcard grant does, rather than a normal and forgettable unblocking step.",
    "**Over-permissioned ServiceAccounts are the third anti-pattern, and they are easy to create by accident because Kubernetes gives every Pod one automatically.** Kubernetes automatically creates a ServiceAccount named `default` in every namespace, and a Pod that does not specify its own ServiceAccount is assigned that namespace's `default` one and receives a mounted, usable token for it unless `automountServiceAccountToken` is explicitly set to `false` (Kubernetes, Service Accounts documentation). If that `default` ServiceAccount — or any custom one — is ever bound to a Role or ClusterRole broader than the specific workload running under it needs, every Pod using that ServiceAccount inherits the excess, including a Pod compromised through an unrelated vulnerability with no RBAC weakness of its own. Kubernetes' own guidance is direct about the fix: use RBAC 'to grant the minimum permissions required by each service account' so that pods 'don't get more permissions than are required to function correctly' (Kubernetes, Service Accounts documentation) — which in practice means giving each workload with distinct access needs its own dedicated ServiceAccount, bound to its own narrowly scoped Role, rather than defaulting every Pod in a namespace to one shared, broadly permissioned account.",
    "**A Role's YAML is a claim; effective permission is what actually gets evaluated, and those two things can differ.** Because RBAC is additive-only and a subject can be bound through multiple RoleBindings, multiple ClusterRoleBindings, and group membership at once, reading one Role's file and concluding 'this subject can only do X' is an assumption, not a verified fact — some other binding elsewhere in the cluster may already grant more. The only way to know what a subject can actually do is to ask the API server directly.",
    "**`kubectl auth can-i` asks the API server the question RBAC YAML alone cannot answer.** Its syntax is `kubectl auth can-i VERB [TYPE | TYPE/NAME | NONRESOURCEURL]` — for example, `kubectl auth can-i delete pods -n fictional-namespace` returns yes or no for the currently authenticated identity, evaluated against every applicable binding, not just the one a reviewer happens to be looking at (Kubernetes, kubectl auth can-i reference documentation). The `--list` flag prints every allowed action at once (`kubectl auth can-i --list -n fictional-namespace`) instead of checking one verb/resource pair at a time, which is the practical way to audit a subject's full effective permission rather than guessing what to ask about.",
    "**Impersonation makes `kubectl auth can-i` answer the question that actually matters: what can *this* subject do, not what can I do.** The `--as` and `--as-group` flags impersonate a specific user or group for the check, and the same mechanism works for a ServiceAccount by name — `kubectl auth can-i list secrets --as=system:serviceaccount:fictional-namespace:fictional-workload -n fictional-namespace` — so a reviewer can verify a workload's exact ServiceAccount identity's effective permissions without needing that ServiceAccount's own credentials (Kubernetes, kubectl auth can-i reference documentation). This is the concrete answer to the RBAC anti-patterns above: don't read the Role and infer the ServiceAccount's access — impersonate the ServiceAccount and ask directly, before and after every change to its bindings.",
  ],
  validationEvidence: [
    "This guide describes Kubernetes RBAC's mechanism and a fictional illustrative lab exercise; it does not reproduce a completed audit of a real cluster's RBAC configuration. Its evidence state is UNVERIFIED, and the guide module's requirements/procedure/validation/rollback steps below should be treated as a starting checklist to run and verify against your own isolated lab cluster's actual behavior, not as a validated result.",
  ],
  limitations: [
    "This guide covers Kubernetes RBAC specifically — the Role/ClusterRole and RoleBinding/ClusterRoleBinding object model. It does not cover other Kubernetes authorization or admission mechanisms (webhook authorization, admission controllers, OPA/Gatekeeper or similar policy engines, or Pod Security admission), which can further constrain what an authorized subject is allowed to do and are a separate topic.",
    "This guide does not cover authentication — how a subject's identity is established in the first place (client certificates, OIDC tokens, or the ServiceAccount token issuance mechanism covered in lib/articles/workload-identities-vs-long-lived-credentials.ts). RBAC only decides what an already-authenticated identity may do.",
    "This guide does not repeat lib/articles/cloud-iam-permission-creep.ts's detailed treatment of how standing permissions accumulate over time through ongoing drift; that guide's review cadence and de-provisioning process apply to Kubernetes RBAC bindings as much as to any other access-control system, but the mechanics of drift are covered there, not here.",
    "Exact RBAC API details (aggregated ClusterRoles, the `rbac.authorization.k8s.io` API group version) can change across Kubernetes releases; verify current behavior against your cluster's actual version and Kubernetes' current documentation before relying on any one detail here.",
  ],
  defensiveRecommendations: [
    "Default to a namespace-scoped Role bound with a RoleBinding for every subject whose actual need is confined to one namespace; require a specific, statable reason before reaching for a ClusterRole or ClusterRoleBinding.",
    "Treat any rule using `verbs: [\"*\"]`, `resources: [\"*\"]`, or `apiGroups: [\"*\"]` outside the built-in cluster-admin role as a finding requiring justification, not a normal shortcut — enumerate the specific verbs and resources a workload actually calls instead.",
    "Treat any ClusterRoleBinding to cluster-admin created to unblock a workload as temporary by default: record why it was added, and revisit and replace it with a narrowly scoped Role once the workload's actual permission needs are known.",
    "Give each workload with distinct access needs its own dedicated ServiceAccount bound to its own narrowly scoped Role, rather than relying on a namespace's shared `default` ServiceAccount; set `automountServiceAccountToken: false` on any Pod that does not need to call the Kubernetes API at all.",
    "Verify effective permission directly with `kubectl auth can-i --list` and `kubectl auth can-i ... --as=<subject>` before and after every binding change, rather than inferring a subject's access from reading one Role's YAML in isolation.",
    "Periodically re-audit existing RoleBindings and ClusterRoleBindings for a cluster's ServiceAccounts and users, the same way lib/articles/cloud-iam-permission-creep.ts recommends for cloud IAM — an RBAC grant that was correctly scoped at creation can still become excessive as a workload's actual needs change.",
  ],
  keyTakeaways: [
    "Role/ClusterRole define permissions; RoleBinding/ClusterRoleBinding grant them to a subject and decide scope — a RoleBinding referencing a ClusterRole confines that ClusterRole's rules to the RoleBinding's own namespace, while a ClusterRoleBinding applies cluster-wide.",
    "Default to a namespace-scoped Role; reserve ClusterRole for permissions a Role structurally cannot express — cluster-scoped resources, non-resource URLs, or a genuine cross-namespace need.",
    "Wildcard verbs/resources, convenience bindings to cluster-admin, and over-permissioned ServiceAccounts are the three RBAC-specific anti-patterns to treat as findings requiring justification, not normal shortcuts.",
    "RBAC is additive-only with no explicit deny rule, so a Role's YAML never proves what a subject can do on its own — verify effective permission directly with `kubectl auth can-i --list` and `--as` impersonation.",
  ],
  references: [
    "Kubernetes, Using RBAC Authorization documentation: https://kubernetes.io/docs/reference/access-authn-authz/rbac/",
    "Kubernetes, Authorization Overview documentation: https://kubernetes.io/docs/reference/access-authn-authz/authorization/",
    "Kubernetes, Service Accounts documentation: https://kubernetes.io/docs/concepts/security/service-accounts/",
    "Kubernetes, kubectl auth can-i reference documentation: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_can-i/",
    "CIS Kubernetes Benchmark: https://www.cisecurity.org/benchmark/kubernetes",
    "NIST SP 800-53 Rev. 5, control AC-6, Least Privilege: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    // media.defense.gov (DoD's own CDN) blocks automated fetches (HTTP 403)
    // regardless of the document's own liveness — confirmed live via
    // WebFetch, same as the citation pattern already used in
    // lib/articles/workload-identities-vs-long-lived-credentials.ts. Cited
    // via CISA's own announcement/landing page for the same guidance
    // instead of the bot-blocked direct PDF URL.
    "NSA and CISA, Kubernetes Hardening Guidance, announced: https://www.cisa.gov/news-events/alerts/2022/03/15/updated-kubernetes-hardening-guide",
  ],
  relatedSlugs: ["docker-to-k3s-migration-zero-change", "least-privilege-for-pipeline-identities", "cloud-iam-permission-creep"],
};

const module_: GuideModule = {
  kind: "guide",
  requirements: [
    "A fictional or isolated lab Kubernetes cluster you control and are authorized to configure (a local kind, minikube, or k3s instance is sufficient) — not a production cluster.",
    "kubectl access to that cluster with sufficient privilege to create Roles, ClusterRoles, RoleBindings, ClusterRoleBindings, and ServiceAccounts for the duration of the exercise.",
    "Read access to Kubernetes' own current RBAC and kubectl documentation — this guide describes the object model generically, and exact API details vary by cluster version.",
  ],
  procedure: [
    "In the lab cluster, create a fictional namespace and a fictional ServiceAccount within it (for example, `fictional-workload` in namespace `fictional-namespace`).",
    "Define a namespace-scoped Role in that namespace whose rules list only the specific verbs and resource type the fictional workload actually needs (for example, `get`, `list`, `watch` on `configmaps`) — no wildcards.",
    "Create a RoleBinding in the same namespace binding the fictional ServiceAccount to that Role.",
    "Before making any further change, run `kubectl auth can-i --list --as=system:serviceaccount:fictional-namespace:fictional-workload -n fictional-namespace` and record the exact set of allowed actions.",
    "Deliberately introduce the cluster-admin anti-pattern: create a ClusterRoleBinding binding the same fictional ServiceAccount to the built-in cluster-admin ClusterRole, as if it had been added to unblock a stuck deployment.",
    "Re-run the same `kubectl auth can-i --list --as=...` check (with and without `-n`, and against a second fictional namespace) and compare the result to the pre-change baseline — confirm the union of permissions, not just the new binding's own scope, is what actually changed.",
    "Remove the ClusterRoleBinding to cluster-admin, and confirm with `kubectl auth can-i` that the fictional ServiceAccount's effective permission has returned to exactly the original namespace-scoped baseline — not merely that the ClusterRoleBinding object itself is gone.",
  ],
  validation: [
    "Confirm the namespace-scoped Role's rules contain no `\"*\"` in `verbs`, `resources`, or `apiGroups` by inspecting `kubectl get role <name> -n fictional-namespace -o yaml` directly, rather than assuming the Role is narrow because it was written to be.",
    "Confirm the pre-anti-pattern `kubectl auth can-i --list` baseline matches exactly what the Role's rules should allow — no more, no less — before introducing the cluster-admin binding.",
    "Confirm that after introducing the ClusterRoleBinding to cluster-admin, the fictional ServiceAccount can perform an action in a second, unrelated fictional namespace it was never granted access to through any Role — this demonstrates RBAC's additive, no-deny-rule behavior concretely rather than asserting it.",
    "Confirm that after removing the ClusterRoleBinding, the same cross-namespace action is denied again — a removed binding is only actually a removed grant once verified against the API server's evaluation, not once the manifest is deleted.",
    "Where a specific behavior could not be tested directly in the lab (for example, a version-specific RBAC API detail this guide does not cover), record it explicitly as UNVERIFIED rather than assuming it behaves as described here.",
  ],
  rollback: [
    "If narrowing a real workload's Role breaks a legitimate call path the initial scoping missed, do not restore a wildcard grant or a cluster-admin binding as the fix — identify the specific missing verb and resource from the resulting denial and add only that, so the fix stays a deliberate, documented narrowing rather than a return to over-broad access.",
    "If a stuck workload genuinely needs emergency unblocking before the correct Role can be worked out, treat a temporary cluster-admin binding as an incident with a tracked expiry and a required follow-up to replace it — not as a resolved permission change.",
    "Keep the before/after Role and binding YAML on record for any real scoping change, so a later reviewer can distinguish 'this was narrowed deliberately, on this date, based on this evidence' from 'this was always this narrow.'",
  ],
};

export const article: KnowledgeArticle = {
  meta: {
    title: "Kubernetes RBAC Design Principles",
    slug: "kubernetes-rbac-design-principles",
    summary:
      "How Kubernetes RBAC's Role/ClusterRole and RoleBinding/ClusterRoleBinding object model actually scopes permission, why a namespace-scoped Role should be the default and a ClusterRole reserved for genuinely cluster-wide needs, three common RBAC anti-patterns (wildcard grants, convenience cluster-admin bindings, over-permissioned ServiceAccounts), and how to verify a subject's actual effective permission with kubectl auth can-i rather than trusting a Role's YAML alone.",
    pillar: "build-securely",
    primaryCategory: "container-kubernetes-security",
    contentType: "guide",
    difficulty: "intermediate",
    status: "published",
    tags: ["kubernetes", "access-control", "least-privilege"],
    audience: ["practitioner", "security-engineer"],
    estimatedReadingMinutes: 13,
    publishedAt: "2026-09-04",
    lastReviewedAt: "2026-09-04",
    labRequired: false,
    authorizedLabOnly: false,
    vendorNeutral: true,
    evidenceState: "UNVERIFIED",
    privacyReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    technicalReview: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
    publicationApproval: { status: "approved", reviewer: "Ravi Teja Thota", reviewedAt: "2026-09-04" },
  },
  sections,
  module: module_,
  diagram,
};
