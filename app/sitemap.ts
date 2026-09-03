import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap-entries";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
