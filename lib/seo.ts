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
