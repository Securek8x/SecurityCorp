import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldAlert, Lightbulb, FlaskConical, Info } from "lucide-react";
import { Shell } from "@/components/site-shell";
import { CopyCodeButton } from "@/components/copy-code-button";
import { ReadingProgress } from "@/components/reading-progress";
import { ArticleToc } from "@/components/article-toc";
import { HeadingLink } from "@/components/heading-link";
import { ShareButton } from "@/components/share-button";
import MalwareIntakeDiagram from "@/components/diagrams/malware-intake-diagram";
import VpnWorkloadDiagram from "@/components/diagrams/vpn-workload-diagram";
import ReverseProxyDiagram from "@/components/diagrams/reverse-proxy-diagram";
import { articles, type Callout } from "@/lib/content";
import { ogImages, twitterImages } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { JsonLd } from "@/components/json-ld";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

function isoDate(date: string) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function slugify(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const calloutMeta: Record<Callout["kind"], { label: string; icon: typeof Info }> = {
  operational: { label: "Operational note", icon: Info },
  warning: { label: "Warning", icon: ShieldAlert },
  assumption: { label: "Assumption", icon: Lightbulb },
  evidence: { label: "Evidence", icon: FlaskConical },
};

const articleDiagrams: Record<string, () => React.ReactNode> = {
  "malware-gate-for-automated-downloads": () => <MalwareIntakeDiagram />,
  "vpn-bound-container-stack": () => <VpnWorkloadDiagram />,
  "reverse-proxy-home-lab": () => <ReverseProxyDiagram />,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  const url = `https://securitycorp.net/guides/${article.slug}`;
  const published = isoDate(article.date);
  return {
    title: article.title,
    description: article.dek,
    alternates: { canonical: `/guides/${article.slug}` },
    openGraph: {
      type: "article",
      url,
      siteName: "SecurityCorp",
      title: article.title,
      description: article.dek,
      publishedTime: published,
      authors: ["Ravi Teja Thota"],
      tags: [article.category],
      images: ogImages(article.title),
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.dek, images: twitterImages(article.title) },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = articles.findIndex((a) => a.slug === slug);
  const article = articles[index];
  if (!article) notFound();

  const prev = index > 0 ? articles[index - 1] : undefined;
  const next = index < articles.length - 1 ? articles[index + 1] : undefined;
  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 2);
  const tocSections = article.sections.map((s, i) => ({ id: slugify(s.heading), label: s.heading, number: String(i + 1).padStart(2, "0") }));
  const Diagram = articleDiagrams[article.slug];

  return (
    <Shell current="/guides">
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "https://securitycorp.net/" },
          { name: "Guides", url: "https://securitycorp.net/guides/" },
          { name: article.title, url: `https://securitycorp.net/guides/${article.slug}/` },
        ])}
      />
      <ReadingProgress />
      <main className="article-page">
        <Link href="/guides" className="back">
          <ArrowLeft size={15} aria-hidden="true" /> All field notes
        </Link>
        <article>
          <header>
            <p className="section-label">{article.category} / {article.number}</p>
            <h1>{article.title}</h1>
            <p className="dek">{article.dek}</p>
            <div className="byline">
              <span>By Ravi Teja Thota</span>
              <span>Published {article.date}</span>
              {article.lastReviewed !== article.date && <span>Last reviewed {article.lastReviewed}</span>}
              <span>{article.read} read</span>
              <span>{article.level}</span>
            </div>
            <ShareButton title={article.title} />
          </header>

          <p className="lead">{article.intro}</p>

          {article.prerequisites.length > 0 && (
            <aside className="prereq-box" aria-labelledby="prereq-heading">
              <strong id="prereq-heading">What you should know first</strong>
              <ul>
                {article.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </aside>
          )}

          <ArticleToc sections={tocSections} />

          {Diagram && <Diagram />}

          {article.sections.map((s, i) => {
            const CalloutIcon = s.callout ? calloutMeta[s.callout.kind].icon : null;
            const headingId = slugify(s.heading);
            return (
              <section key={s.heading} id={headingId}>
                <span className="step">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h2>
                    {s.heading} <HeadingLink id={headingId} />
                  </h2>
                  {s.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {s.code && (
                    <div className="code-block">
                      <CopyCodeButton code={s.code} />
                      <pre>
                        <code>{s.code}</code>
                      </pre>
                    </div>
                  )}
                  {s.callout && CalloutIcon && (
                    <div className={`callout callout-${s.callout.kind}`}>
                      <strong>
                        <CalloutIcon size={13} aria-hidden="true" /> {calloutMeta[s.callout.kind].label}
                      </strong>
                      <p>{s.callout.text}</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}

          <aside className="closing-note">
            <strong>Operational note</strong>
            <p>
              Adapt these patterns to your own threat model. Test in an isolated environment, preserve a rollback
              path, and never publish real credentials or private infrastructure details.
            </p>
          </aside>
        </article>

        <nav className="article-pager" aria-label="Article navigation">
          {prev ? (
            <Link href={`/guides/${prev.slug}`} className="pager-link pager-prev">
              <ArrowLeft size={15} aria-hidden="true" />
              <span>
                <em>Previous</em>
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/guides/${next.slug}`} className="pager-link pager-next">
              <span>
                <em>Next</em>
                {next.title}
              </span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </nav>

        {related.length > 0 && (
          <section className="related-guides">
            <p className="section-label">Related guides</p>
            <div className="related-grid">
              {related.map((a) => (
                <Link href={`/guides/${a.slug}`} className="related-card" key={a.slug}>
                  <span className="article-no">{a.number}</span>
                  <h3>{a.title}</h3>
                  <p>{a.dek}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </Shell>
  );
}
