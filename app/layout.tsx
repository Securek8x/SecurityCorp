import type { Metadata, Viewport } from "next";
import "./globals.css";

// Runs synchronously in <head>, before first paint, so the resolved theme is
// already applied by the time anything is visible — no light/dark flash.
// Reads localStorage only; no network, no eval, no user-controlled code path.
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("securitycorp-theme");var r=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var d=document.documentElement;d.setAttribute("data-theme",r);d.setAttribute("data-theme-preference",r);d.style.colorScheme=r}catch(e){}})();`;

const siteUrl = "https://securitycorp.net";
const siteDescription =
  "Practical cybersecurity guides, hands-on lab projects, and field notes by security engineer Ravi Teja Thota.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "SecurityCorp — Security is a practice", template: "%s | SecurityCorp" },
  description: siteDescription,
  authors: [{ name: "Ravi Teja Thota" }],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "SecurityCorp",
    title: "SecurityCorp — Security is a practice",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "SecurityCorp — Security is a practice",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#080b12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
