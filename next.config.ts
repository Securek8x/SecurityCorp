import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages serves this publication as static assets. Every guide
  // slug is generated at build time by generateStaticParams().
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
