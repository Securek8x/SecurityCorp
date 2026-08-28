import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/site-shell";
import { projects } from "@/lib/content";
import MalwareIntakeDiagram from "@/components/diagrams/malware-intake-diagram";
import { EvidencePanel, type Evidence } from "@/components/evidence-panel";
import { CaseTimeline, type TimelineStage } from "@/components/case-timeline";

const diagrams: Record<string, () => React.ReactNode> = {
  "fail-closed-file-intake": () => <MalwareIntakeDiagram />,
};

const timelines: Record<string, TimelineStage[]> = {
  "fail-closed-file-intake": [
    { stage: "Initial assumption", summary: "A successful move command was assumed to mean the file was safely in its final location." },
    { stage: "First implementation", summary: "The intake used an explicit state machine, but the release step trusted the move operation's reported success." },
    { stage: "Failure discovered", summary: "Testing showed a move could report success without the destination file actually existing under load — an ambiguous outcome the design didn't account for." },
    { stage: "Root cause", summary: "The release step checked the move command's return code, not the actual state of the destination." },
    { stage: "Control added", summary: "A verification step was added: confirm the destination exists and matches the expected size before a release counts as complete, with a bounded retry policy." },
    { stage: "Validation", summary: "Incomplete transfers, a scanner outage, a known-bad test file, and two workers racing the same item were all tested against the new verification step.", detail: "Every one of these was tested deliberately, not assumed safe — see the full failure-path testing in the guide." },
    { stage: "Current state", summary: "Validated: every ambiguous outcome now leaves the file quarantined rather than released. Scan latency under heavy load remains a known, bounded limitation." },
  ],
};

function toEvidence(p: (typeof projects)[number]): Evidence | null {
  if (!p.caseStudy) return null;
  return {
    control: p.caseStudy.architecture,
    claim: p.caseStudy.problem,
    test: p.caseStudy.validation,
    expected: "Every ambiguous or failed condition leaves the system in its safe state, never the exposed one.",
    observed: p.caseStudy.evidence,
    result: p.status === "Validated" ? "passed" : p.status === "Design" ? "planned" : "partial",
    limitations: [p.caseStudy.limitations],
  };
}

export function generateStaticParams() {
  return projects.filter((p) => p.slug).map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  const url = `https://securitycorp.net/projects/${slug}`;
  return {
    title: project.title,
    description: project.text,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: { type: "website", url, title: `${project.title} | SecurityCorp`, description: project.text, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title: `${project.title} | SecurityCorp`, description: project.text },
  };
}

export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project || !project.caseStudy) notFound();
  const cs = project.caseStudy;
  const evidence = toEvidence(project);
  const Diagram = diagrams[slug];
  const stages = timelines[slug];

  return (
    <Shell current="/projects">
      <main className="article-page project-detail">
        <Link href="/projects" className="back">
          <ArrowLeft size={15} aria-hidden="true" /> All projects
        </Link>
        <article>
          <header>
            <p className="section-label">{project.status} / {project.index}</p>
            <h1>{project.title}</h1>
            <p className="dek">{project.text}</p>
          </header>

          <p className="lead">{cs.problem}</p>

          <section>
            <span className="step">01</span>
            <div>
              <h2>Threat model</h2>
              <p>{cs.threatModel}</p>
            </div>
          </section>

          <section>
            <span className="step">02</span>
            <div>
              <h2>Trust boundary</h2>
              <p>{cs.trustBoundary}</p>
            </div>
          </section>

          <section>
            <span className="step">03</span>
            <div>
              <h2>Architecture</h2>
              <p>{cs.architecture}</p>
              {Diagram && <Diagram />}
            </div>
          </section>

          <section>
            <span className="step">04</span>
            <div>
              <h2>Failure modes discovered</h2>
              <ul className="failure-list">
                {cs.failureModes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <span className="step">05</span>
            <div>
              <h2>Controls implemented</h2>
              <ul className="failure-list">
                {cs.controls.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <span className="step">06</span>
            <div>
              <h2>Lessons learned</h2>
              <p>{cs.lessons}</p>
            </div>
          </section>
        </article>

        {stages && <CaseTimeline stages={stages} />}
        {evidence && <EvidencePanel evidence={evidence} />}

        {project.guideSlug && (
          <nav className="article-pager" aria-label="Related reading">
            <Link href={`/guides/${project.guideSlug}`} className="pager-link pager-next full-width">
              <span>
                <em>Related guide</em>
                Read the full write-up
              </span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </nav>
        )}
      </main>
    </Shell>
  );
}
