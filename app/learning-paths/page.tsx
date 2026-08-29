import type { Metadata } from "next";
import { Shell } from "@/components/site-shell";
import { ogImages, twitterImages } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Learning Paths",
  description: "Goal-oriented sequences of published SecurityCorp articles, once enough content exists to sequence.",
  alternates: { canonical: "/learning-paths" },
  openGraph: { type: "website", url: "https://securitycorp.net/learning-paths", siteName: "SecurityCorp", title: "Learning Paths | SecurityCorp", description: "Goal-oriented sequences of published SecurityCorp articles.", images: ogImages("Learning Paths | SecurityCorp") },
  twitter: { card: "summary_large_image", title: "Learning Paths | SecurityCorp", description: "Goal-oriented sequences of published SecurityCorp articles.", images: twitterImages("Learning Paths | SecurityCorp") },
};

// No progress tracking, accounts, or a database — a learning path is a
// curated, static sequence of already-published articles (see Bead
// securitycorp-source-4zl.59.2). This page is a placeholder until enough
// published content exists to sequence into a first real path.
export default function LearningPaths() {
  return (
    <Shell current="/learning-paths">
      <main className="inner-page">
        <section className="page-intro grid-lines">
          <p className="section-label">Learn Security / Learning Tracks</p>
          <h1>
            Learning paths,<br />
            <em>coming as content grows.</em>
          </h1>
          <p>A learning path sequences already-published, reviewed articles into a goal-oriented track with prerequisites and checkpoints — never a promise of a credential or outcome. None are published yet.</p>
        </section>
      </main>
    </Shell>
  );
}
