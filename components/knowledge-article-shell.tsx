import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { KnowledgeArticle } from "@/lib/knowledge-content";
import { findKnowledgeArticle } from "@/lib/knowledge-content";
import { pillarById, categoryById } from "@/lib/taxonomy";
import { tagLabel } from "@/lib/knowledge-tags";
import type { ContentModule } from "@/lib/knowledge-content-types";
import { InteractiveFlowDiagram } from "@/components/diagrams/interactive-flow-diagram";
import { ArticleToc } from "@/components/article-toc";
import { HeadingLink } from "@/components/heading-link";
import { ShareButton } from "@/components/share-button";

const CONTENT_TYPE_LABEL: Record<string, string> = {
  guide: "Guide",
  lab: "Lab",
  detection: "Detection",
  playbook: "Playbook",
  "field-note": "Field Note",
  "deep-dive": "Deep Dive",
  checklist: "Checklist",
  "case-study": "Case Study",
  "tool-review": "Tool Review",
};

const EVIDENCE_LABEL: Record<string, string> = {
  VALIDATED: "VALIDATED",
  "DESIGN ONLY": "DESIGN ONLY",
  UNVERIFIED: "UNVERIFIED",
};

/** One entry in the numbered section list — same shell/typography the guide
 * template uses for `.article-page article>section`. A block with no
 * content is simply never added, so no empty heading ever renders. */
type Block = { id: string; heading: string; node: React.ReactNode };

function textBlock(id: string, heading: string, paragraphs: string[] | undefined): Block | null {
  if (!paragraphs || paragraphs.length === 0) return null;
  return { id, heading, node: paragraphs.map((p) => <p key={p}>{p}</p>) };
}

function listBlock(id: string, heading: string, items: string[] | undefined): Block | null {
  if (!items || items.length === 0) return null;
  return {
    id,
    heading,
    node: (
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ),
  };
}

/** Structured, per-content-type module sections — each becomes its own
 * numbered top-level section, same as the prose blocks above. */
function moduleBlocks(module: ContentModule | undefined): Block[] {
  if (!module) return [];
  switch (module.kind) {
    case "guide":
      return [
        listBlock("mod-requirements", "Requirements", module.requirements),
        listBlock("mod-procedure", "Procedure", module.procedure),
        listBlock("mod-validation", "Validation", module.validation),
        listBlock("mod-rollback", "Rollback", module.rollback),
      ].filter((b): b is Block => b !== null);
    case "lab":
      return [
        textBlock("mod-authorization", "Authorization statement", module.authorizationStatement ? [module.authorizationStatement] : undefined),
        listBlock("mod-safety", "Safety boundaries", module.safetyBoundaries),
        listBlock("mod-setup", "Setup", module.setup),
        listBlock("mod-exercise", "Exercise", module.exercise),
        listBlock("mod-expected", "Expected results", module.expectedResults),
        listBlock("mod-cleanup", "Cleanup", module.cleanup),
      ].filter((b): b is Block => b !== null);
    case "detection":
      return [
        textBlock("mod-hypothesis", "Detection hypothesis", module.hypothesis ? [module.hypothesis] : undefined),
        listBlock("mod-data-sources", "Required data sources", module.requiredDataSources),
        listBlock("mod-logic", "Detection logic", module.detectionLogic),
        listBlock("mod-test-cases", "Test cases", module.testCases),
        listBlock("mod-fp", "False-positive analysis", module.falsePositiveAnalysis),
        listBlock("mod-tuning", "Tuning guidance", module.tuningGuidance),
        listBlock("mod-mitre", "MITRE ATT&CK mapping", module.mitreMapping),
      ].filter((b): b is Block => b !== null);
    case "playbook":
      return [
        textBlock("mod-trigger", "Trigger", module.trigger ? [module.trigger] : undefined),
        textBlock("mod-severity", "Severity", module.severity ? [module.severity] : undefined),
        listBlock("mod-triage", "Triage", module.triage),
        listBlock("mod-decisions", "Decision points", module.decisionPoints),
        listBlock("mod-escalation", "Escalation", module.escalation),
        listBlock("mod-containment", "Containment", module.containment),
        listBlock("mod-recovery", "Recovery", module.recovery),
      ].filter((b): b is Block => b !== null);
    case "field-note":
      return [
        textBlock("mod-observation", "Observation", module.observation ? [module.observation] : undefined),
        textBlock("mod-fn-evidence", "Evidence", module.evidence ? [module.evidence] : undefined),
        textBlock("mod-lesson", "Lesson", module.lesson ? [module.lesson] : undefined),
        textBlock("mod-application", "Application", module.application ? [module.application] : undefined),
      ].filter((b): b is Block => b !== null);
    case "deep-dive":
      return [
        listBlock("mod-architecture", "Architecture", module.architecture),
        listBlock("mod-trust-boundaries", "Trust boundaries", module.trustBoundaries),
        listBlock("mod-alternatives", "Alternatives", module.alternatives),
        listBlock("mod-tradeoffs", "Tradeoffs", module.tradeoffs),
      ].filter((b): b is Block => b !== null);
    case "checklist":
      if (!module.items || module.items.length === 0) return [];
      return [
        {
          id: "mod-checklist",
          heading: "Checklist",
          node: (
            <table>
              <thead>
                <tr>
                  <th>Control</th>
                  <th>Verification method</th>
                  <th>Required evidence</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {module.items.map((item) => (
                  <tr key={item.control}>
                    <td>{item.control}</td>
                    <td>{item.verificationMethod}</td>
                    <td>{item.requiredEvidence}</td>
                    <td>{item.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        },
      ];
    case "case-study":
      return [
        textBlock("mod-context", "Sanitized context", module.sanitizedContext ? [module.sanitizedContext] : undefined),
        listBlock("mod-timeline", "Timeline", module.timeline),
        listBlock("mod-findings", "Findings", module.findings),
        listBlock("mod-response", "Response", module.response),
        listBlock("mod-lessons", "Lessons learned", module.lessonsLearned),
      ].filter((b): b is Block => b !== null);
    case "tool-review":
      return [
        textBlock("mod-use-case", "Use case", module.useCase ? [module.useCase] : undefined),
        listBlock("mod-criteria", "Evaluation criteria", module.evaluationCriteria),
        listBlock("mod-results", "Results", module.results),
        listBlock("mod-tool-limitations", "Limitations", module.limitations),
        listBlock("mod-security-considerations", "Security considerations", module.securityConsiderations),
      ].filter((b): b is Block => b !== null);
    default:
      return [];
  }
}

export function KnowledgeArticleShell({ article }: { article: KnowledgeArticle }) {
  const { meta, sections, module } = article;
  const pillar = pillarById.get(meta.pillar);
  const category = categoryById.get(meta.primaryCategory);
  const related = (sections.relatedSlugs ?? []).map(findKnowledgeArticle).filter((a): a is KnowledgeArticle => Boolean(a));
  const next = sections.nextSlug ? findKnowledgeArticle(sections.nextSlug) : undefined;

  const [lead, ...restOfSummary] = sections.executiveSummary ?? [];

  const blocks: Block[] = [
    restOfSummary.length > 0 ? { id: "sec-executive-summary", heading: "Executive summary", node: restOfSummary.map((p) => <p key={p}>{p}</p>) } : null,
    listBlock("sec-what-you-will-learn", "What you will learn", sections.whatYouWillLearn),
    listBlock("sec-intended-audience", "Intended audience", sections.intendedAudience),
    textBlock("sec-problem", "Problem or security question", sections.problem),
    textBlock("sec-threat-model", "Threat model or relevant risk", sections.threatModel),
    textBlock("sec-main-content", "Main technical content", sections.mainContent),
    ...moduleBlocks(module),
    textBlock("sec-validation", "Validation or evidence", sections.validationEvidence),
    textBlock("sec-limitations", "Limitations", sections.limitations),
    listBlock("sec-defensive-recommendations", "Defensive recommendations", sections.defensiveRecommendations),
    listBlock("sec-key-takeaways", "Key takeaways", sections.keyTakeaways),
    listBlock("sec-references", "References", sections.references),
  ].filter((b): b is Block => b !== null);

  const tocSections = blocks.map((b, i) => ({ id: b.id, label: b.heading, number: String(i + 1).padStart(2, "0") }));

  return (
    <>
      <Link href="/knowledge" className="back">
        <ArrowLeft size={15} aria-hidden="true" /> All knowledge articles
      </Link>
      <article>
        <header>
          <p className="section-label">
            {CONTENT_TYPE_LABEL[meta.contentType]}
            {pillar && ` / ${pillar.name}`}
            {category && ` / ${category.name}`}
          </p>
          <h1>{meta.title}</h1>
          <p className="dek">{meta.summary}</p>
          <div className="byline">
            <span>By Ravi Teja Thota</span>
            {meta.publishedAt && <span>Published {meta.publishedAt}</span>}
            {meta.lastReviewedAt && meta.lastReviewedAt !== meta.publishedAt && <span>Last reviewed {meta.lastReviewedAt}</span>}
            <span>{meta.estimatedReadingMinutes} min read</span>
            <span>{meta.difficulty}</span>
            <span>{EVIDENCE_LABEL[meta.evidenceState]}</span>
          </div>
          {meta.tags.length > 0 && (
            <div className="tags">
              {meta.tags.map((t) => (
                <span key={t}>{tagLabel(t)}</span>
              ))}
            </div>
          )}
          <ShareButton title={meta.title} label="Share this article" />
        </header>

        {lead && <p className="lead">{lead}</p>}

        {sections.prerequisites && sections.prerequisites.length > 0 && (
          <aside className="prereq-box" aria-labelledby="prereq-heading">
            <strong id="prereq-heading">What you should know first</strong>
            <ul>
              {sections.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </aside>
        )}

        <ArticleToc sections={tocSections} />

        {article.diagram && <InteractiveFlowDiagram spec={article.diagram} />}

        {blocks.map((b, i) => (
          <section key={b.id} id={b.id}>
            <span className="step">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2>
                {b.heading} <HeadingLink id={b.id} />
              </h2>
              {b.node}
            </div>
          </section>
        ))}
      </article>

      {next && (
        <nav className="article-pager" aria-label="Article navigation">
          <span />
          <Link href={`/knowledge/${next.meta.slug}`} className="pager-link pager-next">
            <span>
              <em>Next</em>
              {next.meta.title}
            </span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      )}

      {related.length > 0 && (
        <section className="related-guides">
          <p className="section-label">Related content</p>
          <div className="related-grid">
            {related.map((a) => (
              <Link href={`/knowledge/${a.meta.slug}`} className="related-card" key={a.meta.slug}>
                <h3>{a.meta.title}</h3>
                <p>{a.meta.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
