import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Shell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Shell>
      <main className="inner-page not-found-page" tabIndex={-1}>
        <section className="page-intro grid-lines">
          <p className="section-label">404 / Not found</p>
          <h1>
            Nothing published<br />at this <em>address.</em>
          </h1>
          <p>
            The page you followed doesn&apos;t match anything on this site. It may
            have been renamed, retired, or never existed in the first place.
          </p>
        </section>
        <nav aria-label="Suggested pages" className="not-found-links">
          <Link href="/" className="primary-link">
            Back to the homepage <ArrowRight size={17} />
          </Link>
          <Link href="/guides" className="outline-link">
            Browse the guides
          </Link>
          <Link href="/projects" className="outline-link">
            View the project index
          </Link>
        </nav>
      </main>
    </Shell>
  );
}
