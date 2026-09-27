import Link from "next/link";
import type {Metadata} from "next";
import {ArrowDown,ArrowRight,ArrowUpRight,BookOpen,ClipboardList} from "lucide-react";
import {buildSystemsUnderTest} from "@/lib/systems-under-test";
import {SystemsUnderTest} from "@/components/systems-under-test";
import {ContentDate} from "@/components/content-date";
import {Shell} from "@/components/site-shell";
import {articles,projects} from "@/lib/content";
import {buildLog,buildLogEventLabel,formatBuildLogDate} from "@/lib/build-log";
import {publishedKnowledgeArticles} from "@/lib/knowledge-content";
import {latestSiteUpdate,utcToday} from "@/lib/site-updated";
import {controlScenarios,resolveControlScenarios} from "@/lib/control-under-test";
import {ControlUnderTest} from "@/components/control-under-test";
import {HeroVisual} from "@/components/hero-visual";
import {ogImages,twitterImages} from "@/lib/seo";
import {homepageCertifications} from "@/lib/profile";
import {CertificationItem} from "@/components/certification";

// Build-log event types have their own glyphs — none shared with the
// evidence-maturity marks, so an event never reads as an evidence level.
const eventIcon = {publication:BookOpen,plan:ClipboardList} as const;

export const metadata: Metadata = {
  title: "SecurityCorp — Security is a practice",
  description: "Hands-on security guides, honest lab notes, and defensive systems built to fail safely. Field notes from a practitioner, not a listicle.",
  alternates: {canonical: "/"},
  openGraph: {type: "website", url: "https://securitycorp.net", siteName: "SecurityCorp", title: "SecurityCorp — Security is a practice", description: "Hands-on security guides, honest lab notes, and defensive systems built to fail safely.", images: ogImages("SecurityCorp — Security is a practice")},
  twitter: {card: "summary_large_image", title: "SecurityCorp — Security is a practice", description: "Hands-on security guides, honest lab notes, and defensive systems built to fail safely.", images: twitterImages("SecurityCorp — Security is a practice")},
};

// Derived at build time from published content; see lib/site-updated.ts.
const siteUpdated = latestSiteUpdate({guides:articles,publishedKnowledge:publishedKnowledgeArticles,buildLog,today:utcToday()});

export default function Home(){return <Shell current="/"><main>
<section className="hero grid-lines"><div className="hero-kicker entrance" style={{"--d":"0ms"} as React.CSSProperties}>Independent security field notes</div><div className="hero-copy"><h1 className="entrance" style={{"--d":"70ms"} as React.CSSProperties}>Security is a<br/><em>practice.</em></h1><p className="entrance" style={{"--d":"140ms"} as React.CSSProperties}>Hands-on guides, honest lab notes, and defensive systems built to fail safely. Written for engineers, learners, and the relentlessly curious.</p><Link href="/guides" className="primary-link primary-link-terminal entrance" style={{"--d":"210ms"} as React.CSSProperties}>Explore the field notes <ArrowRight size={17} aria-hidden="true"/></Link><a href="#failure-lab" className="hero-failure-link">Pick a failure. See what the control does. <ArrowDown size={17} aria-hidden="true"/></a></div><HeroVisual /><div className="scope-card clip-corner entrance" style={{"--d":"280ms"} as React.CSSProperties}><p className="mono-label">CURRENT SCOPE / 04</p><ul><li><span>01</span>Container & Kubernetes security</li><li><span>02</span>Detection engineering</li><li><span>03</span>Secure self-hosting</li><li><span>04</span>Cloud & identity</li></ul>{siteUpdated&&<div className="signal entrance" style={{"--d":"350ms"} as React.CSSProperties}><i/>Updated <ContentDate value={siteUpdated.date}/><span className="sr-only"> — the latest date among published guides, published knowledge articles, and recorded build-log events</span></div>}</div></section>
<ControlUnderTest scenarios={resolveControlScenarios(controlScenarios,projects)} />
<section className="latest"><div className="section-head"><div><h2>Guides from the lab</h2></div><Link href="/guides">View all guides <ArrowUpRight size={15} aria-hidden="true"/></Link></div><div className="article-list">{articles.map(a=><Link href={`/guides/${a.slug}`} className="article-row record-trace" key={a.slug}><span className="article-no">{a.number}</span><div><div className="article-meta"><span>{a.category}</span><span><ContentDate value={a.publishedAt}/></span><span>{a.read} read</span><span>{a.level}</span></div><h3>{a.title}</h3><p>{a.dek}</p></div><ArrowUpRight className="row-arrow" aria-hidden="true"/></Link>)}</div></section>
<section className="projects-preview" aria-labelledby="systems-under-test-heading"><div className="section-head light"><div><p className="section-label">Selected builds</p><h2 id="systems-under-test-heading">Systems under test.</h2></div><p className="head-copy">Each system and the evidence behind it: what is only designed, what is documented, and what has a recorded observation.</p></div><SystemsUnderTest model={buildSystemsUnderTest(projects)}/><Link href="/projects" className="outline-link">Open the project index <ArrowRight size={16} aria-hidden="true"/></Link></section>
<section className="build-log" aria-labelledby="build-log-heading"><p className="section-label">Publication activity</p><h2 id="build-log-heading">Build log.</h2><p className="head-copy">What changed, and when — publications and plans, not a live system feed.</p><div className="build-log-track" data-motion="once" data-motion-duration="2200"><div className="build-log-circuit-line" aria-hidden="true"/><ol role="list">{buildLog.map((entry)=>{const Icon=eventIcon[entry.type];const when=entry.date.precision==="day"?<ContentDate value={entry.date.value}/>:<time dateTime={String(entry.date.value)}>{formatBuildLogDate(entry.date)}</time>;return <li key={entry.title} className="build-log-row"><span className="build-log-node" aria-hidden="true"/><span className="build-log-date">{when}</span><span className="build-log-type"><Icon size={13} strokeWidth={1.75} aria-hidden="true"/>{buildLogEventLabel[entry.type]}</span><span className="build-log-what">{entry.href?<Link href={entry.href}>{entry.title}</Link>:entry.title}</span></li>})}</ol></div></section>
<section className="author-strip"><div><p className="section-label">Your operator</p><h2>Ravi Teja Thota</h2><p>Writes SecurityCorp from the point where architecture diagrams meet inconvenient reality — Kubernetes, cloud, and detection engineering, tested before they&apos;re published.</p></div><div className="credentials">{homepageCertifications.map(c=><CertificationItem key={c.name} cert={c}/>)}</div><Link href="/about" className="text-link">More about the author <ArrowRight size={15}/></Link></section>
</main></Shell>}
