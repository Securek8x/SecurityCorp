import type {Metadata} from "next";
import {Shell} from "@/components/site-shell";
import {GuidesFilter} from "@/components/guides-filter";
import {publicationEntries} from "@/lib/publication-index";
import {ogImages,twitterImages} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Guides",
  description: "Reproducible security patterns, failure cases, and the evidence that separates \"configured\" from \"proven.\"",
  alternates: {canonical: "/guides"},
  openGraph: {type: "website", url: "https://securitycorp.net/guides", siteName: "SecurityCorp", title: "Guides | SecurityCorp", description: "Reproducible security patterns, failure cases, and the evidence that separates \"configured\" from \"proven.\"", images: ogImages("Guides | SecurityCorp")},
  twitter: {card: "summary_large_image", title: "Guides | SecurityCorp", description: "Reproducible security patterns, failure cases, and the evidence that separates \"configured\" from \"proven.\"", images: twitterImages("Guides | SecurityCorp")},
};

export default function Guides(){return <Shell current="/guides"><main className="inner-page">
  <section className="page-intro"><h1>Guides</h1><p>Reproducible patterns, failure cases, and the evidence that separates “configured” from “proven.” Newest first.</p></section>
  <GuidesFilter entries={publicationEntries()} />
</main></Shell>}
