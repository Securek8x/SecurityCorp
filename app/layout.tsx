import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ogImages, twitterImages } from "@/lib/seo";
import { websiteJsonLd } from "@/lib/json-ld";
import { JsonLd } from "@/components/json-ld";

// Self-hosted at build time by next/font — no runtime request to Google Fonts,
// no render-blocking network dependency, subset to latin to keep payload small.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-sans-nf",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono-nf",
  display: "swap",
});

// Runs synchronously in <head>, before first paint, so the resolved theme is
// already applied by the time anything is visible — no light/dark flash.
// Reads localStorage only; no network, no eval, no user-controlled code path.
// Dark is the default first-visit theme regardless of OS preference; only an
// explicit stored choice switches it to light.
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("securitycorp-theme");var r=(s==="light"||s==="dark")?s:"dark";var d=document.documentElement;d.setAttribute("data-theme",r);d.setAttribute("data-theme-preference",r);d.style.colorScheme=r}catch(e){}})();`;

const siteUrl = "https://securitycorp.net";
const siteDescription =
  "Practical cybersecurity guides, hands-on lab projects, and field notes by security engineer Ravi Teja Thota.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "SecurityCorp — Security is a practice", template: "%s | SecurityCorp" },
  description: siteDescription,
  authors: [{ name: "Ravi Teja Thota" }],
  alternates: {
    canonical: "/",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "SecurityCorp",
    locale: "en_US",
    title: "SecurityCorp — Security is a practice",
    description: siteDescription,
    images: ogImages("SecurityCorp — Security is a practice"),
  },
  twitter: {
    card: "summary_large_image",
    title: "SecurityCorp — Security is a practice",
    description: siteDescription,
    images: twitterImages("SecurityCorp — Security is a practice"),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#070b12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="alternate" type="application/rss+xml" title="SecurityCorp — RSS feed" href="/rss.xml" />
        <JsonLd data={websiteJsonLd()} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
