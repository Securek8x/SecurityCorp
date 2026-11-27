import Link from "next/link";
import type {Metadata} from "next";
import {Shell} from "@/components/site-shell";
import {ogImages,twitterImages} from "@/lib/seo";
import {certifications,verifiableUrl,profile} from "@/lib/profile";
import {personJsonLd,breadcrumbJsonLd} from "@/lib/json-ld";
import {JsonLd} from "@/components/json-ld";
import {aboutPhoto} from "@/lib/site-photos";

export const metadata: Metadata = {
  title: "About",
  description: "Ravi Teja Thota — security engineer writing SecurityCorp. Background, certifications, and the evidence standard behind the publication.",
  alternates: {canonical: "/about"},
  openGraph: {type: "profile", url: "https://securitycorp.net/about", siteName: "SecurityCorp", title: "About | SecurityCorp", description: "Ravi Teja Thota — security engineer writing SecurityCorp.", images: ogImages("Ravi Teja Thota — About SecurityCorp")},
  twitter: {card: "summary_large_image", title: "About | SecurityCorp", description: "Ravi Teja Thota — security engineer writing SecurityCorp.", images: twitterImages("Ravi Teja Thota — About SecurityCorp")},
};

/* Selected work: existing, published pages only. Each link is a route that
   already exists in this build (checked by the route-integrity script). */
const selectedWork = [
  {href:"/projects/fail-closed-file-intake",title:"Fail-Closed File Intake",note:"Case study: a staged scanning pipeline where every ambiguous outcome quarantines the file."},
  {href:"/guides/vpn-bound-container-stack",title:"Proving a container can only reach the internet through a VPN",note:"Guide: namespace sharing, egress checks, and a kill-switch test."},
  {href:"/knowledge/designing-fail-closed-security-automation",title:"Designing Fail-Closed Security Automation",note:"Deep dive: why automation drifts toward fail-open, and how to build it to deny by default."},
  {href:"/knowledge/docker-to-k3s-migration-zero-change",title:"Planning a Zero-Change Docker-to-k3s Migration",note:"Deep dive: preserving ports, paths, credentials, and recovery behavior during a migration."},
];

export default function About(){return <Shell current="/about"><JsonLd data={personJsonLd()} /><JsonLd data={breadcrumbJsonLd([{name:"Home",url:"https://securitycorp.net/"},{name:"About",url:"https://securitycorp.net/about/"}])} />
<main className="pub-wrap about-page">
  <div className="about-hero">
    {/* eslint-disable-next-line @next/next/no-img-element -- static export, images.unoptimized */}
    <figure className="about-photo"><img src={aboutPhoto.src} srcSet={aboutPhoto.srcSet} sizes="(max-width: 900px) 100vw, 480px" alt={aboutPhoto.alt} width={aboutPhoto.width} height={aboutPhoto.height} fetchPriority="high" /></figure>
    <div className="about-body">
      <p className="pub-kicker">About</p>
      <h1>Ravi Teja Thota</h1>
      <p className="about-role">{profile.role} · {profile.education}</p>
      <p>I work across cloud, containers, and offensive testing, on the operational details that decide whether a control holds up under pressure.</p>
      <p>SecurityCorp is where I write that work up. Each piece separates what was observed from what is only designed, and private details are generalized before anything is published.</p>
      <h2>Selected work</h2>
      <ul className="pub-list">
        {selectedWork.map((w)=><li key={w.href}><Link href={w.href} className="pub-entry"><h3>{w.title}</h3><p>{w.note}</p></Link></li>)}
      </ul>
      <h2>Certifications</h2>
      <ul className="about-certs">
        {certifications.map((c)=>{const url=verifiableUrl(c);return <li key={c.name}>{url?<a href={url} rel="noreferrer noopener" target="_blank">{c.name}</a>:c.name}</li>})}
      </ul>
    </div>
  </div>
</main></Shell>}
