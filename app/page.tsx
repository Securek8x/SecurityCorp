/* eslint-disable @next/next/no-img-element -- static export sets images.unoptimized, and the tiger must render with no image pipeline. */
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/site-shell";
import { ContentDate } from "@/components/content-date";
import { CertificationItem } from "@/components/certification";
import { articles, projects } from "@/lib/content";
import { observationRows, type ObservationRow } from "@/lib/evidence";
import { publishedKnowledgeArticles } from "@/lib/knowledge-content";
import { buildLog } from "@/lib/build-log";
import { latestSiteUpdate, utcToday } from "@/lib/site-updated";
import { homepageCertifications } from "@/lib/profile";
import { ogImages, twitterImages } from "@/lib/seo";

export const metadata: Metadata = {
  title: "SecurityCorp — Security is a practice",
  description: "Hands-on security guides and lab notes by Ravi Teja Thota. Kubernetes, detection engineering, and self-hosting, tested before they are published.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://securitycorp.net",
    siteName: "SecurityCorp",
    title: "SecurityCorp — Security is a practice",
    description: "Hands-on security guides and lab notes by Ravi Teja Thota.",
    images: ogImages("SecurityCorp — Security is a practice"),
  },
  twitter: {
    card: "summary_large_image",
    title: "SecurityCorp — Security is a practice",
    description: "Hands-on security guides and lab notes by Ravi Teja Thota.",
    images: twitterImages("SecurityCorp — Security is a practice"),
  },
};

const siteUpdated = latestSiteUpdate({
  guides: articles,
  publishedKnowledge: publishedKnowledgeArticles,
  buildLog,
  today: utcToday(),
});

const guides = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
const featured = guides[0];
const featuredCode = featured?.sections.find((section) => section.code);
const featuredProject = featured ? projects.find((project) => project.guideSlug === featured.slug) : undefined;
const featuredResults = featuredProject ? observationRows(featuredProject.evidence).filter((row) => row.kind === "recorded") : [];

type LabStatus = { label: string; tone: "pass" | "reported" | "open" };

function labStatus(row: ObservationRow): LabStatus {
  if (row.kind === "recorded" && row.outcome === "failed") return { label: "Failed", tone: "reported" };
  if (row.kind === "recorded") return { label: "Recorded", tone: "pass" };
  if (row.kind === "reported") return { label: "Reported", tone: "reported" };
  if (row.maturity === "design") return { label: "Design", tone: "open" };
  return { label: "No run claimed", tone: "open" };
}

const labRows = projects.flatMap((project) =>
  observationRows(project.evidence).map((row) => ({
    key: `${project.index}:${row.claim}`,
    system: project.title,
    href: project.slug ? `/projects/${project.slug}` : project.guideSlug ? `/guides/${project.guideSlug}` : undefined,
    claim: row.claim,
    status: labStatus(row),
  })),
);

export default function Home() {
  return (
    <Shell current="/">
      <main>
        <section className="home-hero">
          <div>
            <p className="home-kicker">
              <span>{articles.length} guides</span>
              {siteUpdated && (
                <span>
                  updated <ContentDate value={siteUpdated.date} />
                </span>
              )}
            </p>
            <h1>
              I break my
              <br />
              own lab.
              <br />
              <em>Then I write</em>
              <br />
              <em>it down.</em>
            </h1>
            <p className="home-lede">
              SecurityCorp is where I, <strong>Ravi Teja Thota</strong>, document Kubernetes, detection engineering, and self-hosting work. Every guide starts as something I built at home, tried to break on purpose, and fixed.
            </p>
            <div className="home-ctas">
              {featured && (
                <Link href={`/guides/${featured.slug}`} className="primary-link">
                  Read the latest guide <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
              <a href="#lab-tests" className="home-ghost">
                See the lab tests
              </a>
            </div>
          </div>
          <figure className="home-poster">
            <span className="home-poster-tag">Operator</span>
            <div className="home-poster-frame">
              <img src="/images/securitycorp-tiger-guardian.png" alt="" width={460} height={460} />
              <figcaption>
                <span>SC/TIGER</span>
                <span>{homepageCertifications.map((cert) => cert.name).join(" · ")}</span>
              </figcaption>
            </div>
          </figure>
        </section>

        {labRows.length > 0 && (
          <div className="home-ticker" role="region" aria-label="Lab test status">
            <ul className="home-ticker-track">
              {[0, 1].flatMap((copy) =>
                labRows.map((row) => (
                  <li key={`${copy}:${row.key}`} aria-hidden={copy === 1 || undefined} className={copy === 1 ? "home-ticker-dup" : undefined}>
                    {row.system} <b className={row.status.tone}>{row.status.label}</b>
                  </li>
                )),
              )}
            </ul>
          </div>
        )}

        {featured && (
          <section className="home-section" aria-labelledby="latest-heading">
            <div className="home-sec-head">
              <h2 id="latest-heading">
                Latest
                <br />
                <em>from the lab</em>
              </h2>
              <p>The newest guide, with the commands and results already published in it.</p>
            </div>
            <div className="home-featured">
              <div className="home-featured-copy">
                <div>
                  <p className="home-meta">
                    <span>{featured.category}</span>
                    <ContentDate value={featured.publishedAt} />
                    <span>{featured.read}</span>
                  </p>
                  <h3>{featured.title}</h3>
                  <p>{featured.dek}</p>
                </div>
                <Link href={`/guides/${featured.slug}`} className="text-link">
                  Read the guide <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
              {(featuredCode || featuredResults.length > 0) && (
                <div className="home-term">
                  <p className="home-term-bar">{featuredCode ? featuredCode.heading : "Recorded result"}</p>
                  {featuredCode && <pre>{featuredCode.code}</pre>}
                  {featuredResults.map((row) => (
                    <p key={row.claim} className="home-term-result">
                      <span>Recorded result</span>
                      {row.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="home-section" aria-labelledby="guides-heading">
          <div className="home-sec-head">
            <h2 id="guides-heading">Guides</h2>
            <Link href="/guides" className="text-link">
              All guides <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <ul className="home-guides">
            {guides.map((article) => (
              <li key={article.slug}>
                <Link href={`/guides/${article.slug}`}>
                  <ContentDate value={article.publishedAt} />
                  <span>
                    <h3>{article.title}</h3>
                    <p>{article.dek}</p>
                  </span>
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-section" id="lab-tests" aria-labelledby="lab-tests-heading">
          <div className="home-sec-head">
            <h2 id="lab-tests-heading">
              Lab <em>tests</em>
            </h2>
            <p>Each row is one published evidence record. The label says only how far that record goes.</p>
          </div>
          <div className="table-scroll">
            <table className="home-board">
              <thead>
                <tr>
                  <th scope="col">System</th>
                  <th scope="col">What was checked</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {labRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.href ? <Link href={row.href}>{row.system}</Link> : row.system}</td>
                    <td>{row.claim}</td>
                    <td>
                      <span className={`home-chip ${row.status.tone}`}>{row.status.label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="home-legend">
            <span>Recorded: an observed result is written down.</span>
            <span>Reported: described as tried, and the result was not written down.</span>
            <span>Design or no run claimed: nothing was recorded as run.</span>
          </p>
        </section>

        <section className="home-section home-author" aria-labelledby="author-heading">
          <div className="home-poster-frame home-author-mark">
            <img src="/images/securitycorp-tiger-guardian.png" alt="" width={220} height={220} />
          </div>
          <div>
            <h2 id="author-heading">
              Ravi Teja <em>Thota</em>
            </h2>
            <p>I work on Kubernetes, cloud, and detection engineering. My home lab is where I check whether a design holds up, and SecurityCorp is where I write up what I find.</p>
            <ul className="home-certs">
              {homepageCertifications.map((cert) => (
                <li key={cert.name}>
                  <CertificationItem cert={cert} />
                </li>
              ))}
            </ul>
            <Link href="/about" className="text-link">
              More about the author <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </Shell>
  );
}
