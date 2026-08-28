import Link from "next/link";import type {Metadata} from "next";import {ArrowUpRight,CheckCircle2,CircleDot} from "lucide-react";import {Shell} from "@/components/site-shell";import {projects} from "@/lib/content";import {ogImages,twitterImages} from "@/lib/seo";

const projectStatusIcon = {Validated:CheckCircle2,Operational:CheckCircle2,Design:CircleDot} as const;
const projectStatusClass = {Validated:"status-validated",Operational:"status-operational",Design:"status-design"} as const;

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected home-lab and engineering systems, documented around trust boundaries, test evidence, and safe failure.",
  alternates: {canonical: "/projects"},
  openGraph: {type: "website", url: "https://securitycorp.net/projects", siteName: "SecurityCorp", title: "Projects | SecurityCorp", description: "Selected home-lab and engineering systems, documented around trust boundaries, test evidence, and safe failure.", images: ogImages("Projects | SecurityCorp")},
  twitter: {card: "summary_large_image", title: "Projects | SecurityCorp", description: "Selected home-lab and engineering systems, documented around trust boundaries, test evidence, and safe failure.", images: twitterImages("Projects | SecurityCorp")},
};

export default function Projects(){return <Shell current="/projects"><main className="inner-page"><section className="page-intro grid-lines"><p className="section-label">Project index / 2026</p><h1>Security controls,<br/><em>under pressure.</em></h1><p>Selected systems from my home lab and engineering work, documented around trust boundaries, test evidence, and safe failure.</p></section><section className="project-index">{projects.map((p)=>{const StatusIcon=projectStatusIcon[p.status];return <article className="record-trace" key={p.index}><div className="project-number">{p.index}</div><div><div className={`status dark-status ${projectStatusClass[p.status]}`}><StatusIcon size={13} aria-hidden="true"/> {p.status}</div><h2>{p.title}</h2><p>{p.text}</p><dl className="project-facts"><div><dt>Problem</dt><dd>{p.problem}</dd></div><div><dt>Known limitation</dt><dd>{p.limitation}</dd></div></dl><div className="tags dark-tags">{p.tags.map(t=><span key={t}>{t}</span>)}</div>{p.slug?<Link href={`/projects/${p.slug}`} className="card-cta">View case study <ArrowUpRight size={13} aria-hidden="true"/></Link>:p.guideSlug?<Link href={`/guides/${p.guideSlug}`} className="card-cta">Read the guide <ArrowUpRight size={13} aria-hidden="true"/></Link>:null}</div></article>})}</section></main></Shell>}
