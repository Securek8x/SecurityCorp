import Link from "next/link";
import type { KnowledgeArticle } from "@/lib/knowledge-content";
import { findKnowledgeArticle } from "@/lib/knowledge-content";
import { pillarById, categoryById } from "@/lib/taxonomy";
import type { ContentModule } from "@/lib/knowledge-content-types";
import { InteractiveFlowDiagram } from "@/components/diagrams/interactive-flow-diagram";

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

/** A section with no content doesn't render at all — never an empty
 * heading or placeholder text. */
function TextSection({ heading, id, paragraphs }: { heading: string; id: string; paragraphs?: string[] }) {
  if (!paragraphs || paragraphs.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{heading}</h2>
      {paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </section>
  );
}

function ListSection({ heading, id, items }: { heading: string; id: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{heading}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function renderModule(module: ContentModule | undefined) {
  if (!module) return null;
  switch (module.kind) {
    case "guide":
      return (
        <>
          <ListSection heading="Requirements" id="mod-requirements" items={module.requirements} />
          <ListSection heading="Procedure" id="mod-procedure" items={module.procedure} />
          <ListSection heading="Validation" id="mod-validation" items={module.validation} />
          <ListSection heading="Rollback" id="mod-rollback" items={module.rollback} />
        </>
      );
    case "lab":
      return (
        <>
          <TextSection heading="Authorization statement" id="mod-authorization" paragraphs={module.authorizationStatement ? [module.authorizationStatement] : undefined} />
          <ListSection heading="Safety boundaries" id="mod-safety" items={module.safetyBoundaries} />
          <ListSection heading="Setup" id="mod-setup" items={module.setup} />
          <ListSection heading="Exercise" id="mod-exercise" items={module.exercise} />
          <ListSection heading="Expected results" id="mod-expected" items={module.expectedResults} />
          <ListSection heading="Cleanup" id="mod-cleanup" items={module.cleanup} />
        </>
      );
    case "detection":
      return (
        <>
          <TextSection heading="Detection hypothesis" id="mod-hypothesis" paragraphs={module.hypothesis ? [module.hypothesis] : undefined} />
          <ListSection heading="Required data sources" id="mod-data-sources" items={module.requiredDataSources} />
          <ListSection heading="Detection logic" id="mod-logic" items={module.detectionLogic} />
          <ListSection heading="Test cases" id="mod-test-cases" items={module.testCases} />
          <ListSection heading="False-positive analysis" id="mod-fp" items={module.falsePositiveAnalysis} />
          <ListSection heading="Tuning guidance" id="mod-tuning" items={module.tuningGuidance} />
          <ListSection heading="MITRE ATT&CK mapping" id="mod-mitre" items={module.mitreMapping} />
        </>
      );
    case "playbook":
      return (
        <>
          <TextSection heading="Trigger" id="mod-trigger" paragraphs={module.trigger ? [module.trigger] : undefined} />
          <TextSection heading="Severity" id="mod-severity" paragraphs={module.severity ? [module.severity] : undefined} />
          <ListSection heading="Triage" id="mod-triage" items={module.triage} />
          <ListSection heading="Decision points" id="mod-decisions" items={module.decisionPoints} />
          <ListSection heading="Escalation" id="mod-escalation" items={module.escalation} />
          <ListSection heading="Containment" id="mod-containment" items={module.containment} />
          <ListSection heading="Recovery" id="mod-recovery" items={module.recovery} />
        </>
      );
    case "field-note":
      return (
        <>
          <TextSection heading="Observation" id="mod-observation" paragraphs={module.observation ? [module.observation] : undefined} />
          <TextSection heading="Evidence" id="mod-fn-evidence" paragraphs={module.evidence ? [module.evidence] : undefined} />
          <TextSection heading="Lesson" id="mod-lesson" paragraphs={module.lesson ? [module.lesson] : undefined} />
          <TextSection heading="Application" id="mod-application" paragraphs={module.application ? [module.application] : undefined} />
        </>
      );
    case "deep-dive":
      return (
        <>
          <ListSection heading="Architecture" id="mod-architecture" items={module.architecture} />
          <ListSection heading="Trust boundaries" id="mod-trust-boundaries" items={module.trustBoundaries} />
          <ListSection heading="Alternatives" id="mod-alternatives" items={module.alternatives} />
          <ListSection heading="Tradeoffs" id="mod-tradeoffs" items={module.tradeoffs} />
        </>
      );
    case "checklist":
      if (!module.items || module.items.length === 0) return null;
      return (
        <section aria-labelledby="mod-checklist">
          <h2 id="mod-checklist">Checklist</h2>
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
        </section>
      );
    case "case-study":
      return (
        <>
          <TextSection heading="Sanitized context" id="mod-context" paragraphs={module.sanitizedContext ? [module.sanitizedContext] : undefined} />
          <ListSection heading="Timeline" id="mod-timeline" items={module.timeline} />
          <ListSection heading="Findings" id="mod-findings" items={module.findings} />
          <ListSection heading="Response" id="mod-response" items={module.response} />
          <ListSection heading="Lessons learned" id="mod-lessons" items={module.lessonsLearned} />
        </>
      );
    case "tool-review":
      return (
        <>
          <TextSection heading="Use case" id="mod-use-case" paragraphs={module.useCase ? [module.useCase] : undefined} />
          <ListSection heading="Evaluation criteria" id="mod-criteria" items={module.evaluationCriteria} />
          <ListSection heading="Results" id="mod-results" items={module.results} />
          <ListSection heading="Limitations" id="mod-tool-limitations" items={module.limitations} />
          <ListSection heading="Security considerations" id="mod-security-considerations" items={module.securityConsiderations} />
        </>
      );
    default:
      return null;
  }
}

export function KnowledgeArticleShell({ article }: { article: KnowledgeArticle }) {
  const { meta, sections, module } = article;
  const pillar = pillarById.get(meta.pillar);
  const category = categoryById.get(meta.primaryCategory);
  const related = (sections.relatedSlugs ?? []).map(findKnowledgeArticle).filter((a): a is KnowledgeArticle => Boolean(a));
  const next = sections.nextSlug ? findKnowledgeArticle(sections.nextSlug) : undefined;

  return (
    <article className="knowledge-article">
      <header className="knowledge-article-header">
        <p className="article-meta">
          <span>{CONTENT_TYPE_LABEL[meta.contentType]}</span>
          {pillar && <span>{pillar.name}</span>}
          {category && <span>{category.name}</span>}
        </p>
        <h1>{meta.title}</h1>
        <p>{meta.summary}</p>
        <dl className="knowledge-article-facts">
          <div>
            <dt>Difficulty</dt>
            <dd>{meta.difficulty}</dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd>{meta.estimatedReadingMinutes} min</dd>
          </div>
          <div>
            <dt>Evidence state</dt>
            <dd>{EVIDENCE_LABEL[meta.evidenceState]}</dd>
          </div>
          {meta.publishedAt && (
            <div>
              <dt>Published</dt>
              <dd>
                <time dateTime={meta.publishedAt}>{meta.publishedAt}</time>
              </dd>
            </div>
          )}
          {meta.lastReviewedAt && (
            <div>
              <dt>Last reviewed</dt>
              <dd>
                <time dateTime={meta.lastReviewedAt}>{meta.lastReviewedAt}</time>
              </dd>
            </div>
          )}
        </dl>
      </header>

      <TextSection heading="Executive summary" id="sec-executive-summary" paragraphs={sections.executiveSummary} />
      <ListSection heading="What you will learn" id="sec-what-you-will-learn" items={sections.whatYouWillLearn} />
      <ListSection heading="Intended audience" id="sec-intended-audience" items={sections.intendedAudience} />
      <ListSection heading="Prerequisites" id="sec-prerequisites" items={sections.prerequisites} />
      <TextSection heading="Problem or security question" id="sec-problem" paragraphs={sections.problem} />
      <TextSection heading="Threat model or relevant risk" id="sec-threat-model" paragraphs={sections.threatModel} />
      <TextSection heading="Main technical content" id="sec-main-content" paragraphs={sections.mainContent} />

      {article.diagram && <InteractiveFlowDiagram spec={article.diagram} />}

      {renderModule(module)}

      <TextSection heading="Validation or evidence" id="sec-validation" paragraphs={sections.validationEvidence} />
      <TextSection heading="Limitations" id="sec-limitations" paragraphs={sections.limitations} />
      <ListSection heading="Defensive recommendations" id="sec-defensive-recommendations" items={sections.defensiveRecommendations} />
      <ListSection heading="Key takeaways" id="sec-key-takeaways" items={sections.keyTakeaways} />
      <ListSection heading="References" id="sec-references" items={sections.references} />

      {related.length > 0 && (
        <section aria-labelledby="sec-related">
          <h2 id="sec-related">Related content</h2>
          <ul>
            {related.map((r) => (
              <li key={r.meta.slug}>
                <Link href={`/knowledge/${r.meta.slug}/`}>{r.meta.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {next && (
        <section aria-labelledby="sec-next">
          <h2 id="sec-next">Next recommended article</h2>
          <Link href={`/knowledge/${next.meta.slug}/`}>{next.meta.title}</Link>
        </section>
      )}
    </article>
  );
}
