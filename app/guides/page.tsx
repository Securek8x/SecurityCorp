import type {Metadata} from "next";import {Shell} from "@/components/site-shell";import {articles} from "@/lib/content";import {GuidesFilter} from "@/components/guides-filter";import {ogImages,twitterImages} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Guides",
  description: "Reproducible security patterns, failure cases, and the evidence that separates \"configured\" from \"proven.\"",
  alternates: {canonical: "/guides"},
  openGraph: {type: "website", url: "https://securitycorp.net/guides", siteName: "SecurityCorp", title: "Guides | SecurityCorp", description: "Reproducible security patterns, failure cases, and the evidence that separates \"configured\" from \"proven.\"", images: ogImages("Guides | SecurityCorp")},
  twitter: {card: "summary_large_image", title: "Guides | SecurityCorp", description: "Reproducible security patterns, failure cases, and the evidence that separates \"configured\" from \"proven.\"", images: twitterImages("Guides | SecurityCorp")},
};

export default function Guides(){return <Shell current="/guides"><main className="inner-page"><section className="page-intro grid-lines"><p className="section-label">Field notes / 001—003</p><h1>Security guides<br/>from <em>real systems.</em></h1><p>Reproducible patterns, failure cases, and the evidence that separates “configured” from “proven.”</p></section><GuidesFilter articles={articles} /></main></Shell>}
