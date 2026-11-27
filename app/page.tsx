import Link from "next/link";
import type {Metadata} from "next";
import {ArrowRight} from "lucide-react";
import {Shell} from "@/components/site-shell";
import {ContentDate} from "@/components/content-date";
import MalwareIntakeDiagram from "@/components/diagrams/malware-intake-diagram";
import {projects} from "@/lib/content";
import {latestEntries} from "@/lib/publication-index";
import {homeIntroPhoto} from "@/lib/site-photos";
import {ogImages,twitterImages} from "@/lib/seo";

export const metadata: Metadata = {
  title: "SecurityCorp — Security is a practice",
  description: "Hands-on security guides, honest lab notes, and defensive systems built to fail safely. Field notes from a practitioner, not a listicle.",
  alternates: {canonical: "/"},
  openGraph: {type: "website", url: "https://securitycorp.net", siteName: "SecurityCorp", title: "SecurityCorp — Security is a practice", description: "Hands-on security guides, honest lab notes, and defensive systems built to fail safely.", images: ogImages("SecurityCorp — Security is a practice")},
  twitter: {card: "summary_large_image", title: "SecurityCorp — Security is a practice", description: "Hands-on security guides, honest lab notes, and defensive systems built to fail safely.", images: twitterImages("SecurityCorp — Security is a practice")},
};

/* The featured case study is P-01. Its observed result is read from the
   project's checked evidence records (lib/content.ts) rather than restated
   here, so the homepage can only show a result that has a recorded
   observation. Today that is one record: the scanner outage. */
const caseStudy = projects.find((p) => p.index === "P-01");
const records = caseStudy && !("unavailable" in caseStudy.evidence) ? caseStudy.evidence.records : [];
const observed = records.find((r) => r.maturity === "validated" && r.observation.kind === "recorded");
const documentedCount = records.filter((r) => r.maturity === "documented").length;

export default function Home(){
  const latest = latestEntries(6);
  return <Shell current="/"><main>
    <section className={`pub-wrap home-intro${homeIntroPhoto ? "" : " no-photo"}`} aria-labelledby="home-title">
      <div>
        <h1 id="home-title">Security engineering notes, tested before they&apos;re published.</h1>
        <p>Practical guides on detection, containers, identity, and safe automation, written by a working security engineer. Each piece says what was observed and what is only designed.</p>
        <Link href="/guides" className="pub-cta">Browse the guides <ArrowRight size={17} aria-hidden="true"/></Link>
      </div>
      {homeIntroPhoto && (
        // eslint-disable-next-line @next/next/no-img-element -- static export, images.unoptimized
        <figure className="home-photo"><img src={homeIntroPhoto.src} alt={homeIntroPhoto.alt} width={homeIntroPhoto.width} height={homeIntroPhoto.height} fetchPriority="high" /></figure>
      )}
    </section>

    {caseStudy && <section className="pub-wrap home-section" aria-labelledby="case-study-heading">
      <div className="home-section-head"><h2 id="case-study-heading">Case study</h2><Link href={`/projects/${caseStudy.slug}`}>Full case study</Link></div>
      <div className="case-study">
        <div>
          <h3>A file intake gate that fails closed</h3>
          <p>Untrusted files wait in a staging area that downstream services cannot read. They are released only after the transfer completes, the scan passes, and the move is verified. Any ambiguous outcome, including a scanner timeout, quarantines the file instead of releasing it.</p>
          {observed && observed.observation.kind === "recorded" && <div className="case-result">
            <strong>Observed result</strong>
            <p>{observed.observation.result}</p>
            <p className="case-scope">One of {records.length} failure paths has a recorded result. The other {documentedCount} are documented, not yet recorded.</p>
          </div>}
          <div className="case-links">
            <Link href={`/projects/${caseStudy.slug}`}>Read the case study</Link>
            {caseStudy.guideSlug && <Link href={`/guides/${caseStudy.guideSlug}`}>Build the gate: the guide</Link>}
          </div>
        </div>
        <figure className="case-figure"><MalwareIntakeDiagram /></figure>
      </div>
    </section>}

    <section className="pub-wrap home-section" aria-labelledby="latest-heading">
      <div className="home-section-head"><h2 id="latest-heading">Latest guides</h2><Link href="/guides">All guides <ArrowRight size={15} aria-hidden="true"/></Link></div>
      <ul className="pub-list">
        {latest.map((e) => <li key={e.href}>
          <Link href={e.href} className="pub-entry">
            <h3>{e.title}</h3>
            <p>{e.summary}</p>
            <span className="pub-meta"><span>{e.topic}</span><span>{e.readMinutes} min read</span></span>
            <ContentDate value={e.publishedAt} className="pub-date"/>
          </Link>
        </li>)}
      </ul>
    </section>
  </main></Shell>}
