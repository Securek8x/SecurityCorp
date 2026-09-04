const siteUrl = "https://securitycorp.net";

// Single source of truth for the social share image. Cloudflare Pages served
// the old extensionless `/opengraph-image` route as application/octet-stream
// instead of image/png — a real static .png file with an explicit MIME type
// on the metadata object avoids that entirely.
export function ogImages(alt: string) {
  return [
    {
      url: `${siteUrl}/opengraph-image.png`,
      secureUrl: `${siteUrl}/opengraph-image.png`,
      width: 1200,
      height: 630,
      type: "image/png",
      alt,
    },
  ];
}

export function twitterImages(alt: string) {
  return [{ url: `${siteUrl}/opengraph-image.png`, alt }];
}

// Per-page dynamic share images (securitycorp-source-wq4) — generated at
// build time by the matching app/**/[slug]/opengraph-image.tsx route.
// Same extensionless-static-file MIME-type issue as the comment above
// (Cloudflare Pages can't infer image/png from a route path with no
// extension) — public/_headers carries the actual fix (an explicit
// Content-Type override per path pattern); the `type` field here is a
// secondary hint for crawlers that respect declared metadata regardless
// of the served header. `path` is the same `/<section>/<slug>` prefix
// the corresponding page lives at (no trailing slash, no leading site
// origin) — callers pass e.g. `/knowledge/${slug}`.
export function pageOgImages(path: string, alt: string) {
  return [
    {
      url: `${siteUrl}${path}/opengraph-image`,
      secureUrl: `${siteUrl}${path}/opengraph-image`,
      width: 1200,
      height: 630,
      type: "image/png",
      alt,
    },
  ];
}

export function pageTwitterImages(path: string, alt: string) {
  return [{ url: `${siteUrl}${path}/opengraph-image`, alt }];
}
