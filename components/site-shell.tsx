import Link from "next/link";
import { ArrowUpRight, Menu, Rss, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { profileLinks } from "@/lib/profile";

const NAV_LINKS = [
  { href: "/guides", label: "Guides" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];

export function Header({ current }: { current?: string }) {
  return (
    <header className="site-header">
      <div className="brand-group">
        <Link href="/" className="wordmark">
          <span className="mark clip-corner-sm">
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <span>
            SECURITY<span>CORP</span>
          </span>
        </Link>
        <span className="header-status signal">
          <i aria-hidden="true" />
          Publication active
        </span>
      </div>
      <input type="checkbox" id="nav-toggle" className="nav-toggle-input" />
      <label htmlFor="nav-toggle" className="nav-toggle-label">
        <Menu size={20} aria-hidden="true" />
        <span className="sr-only">Menu</span>
      </label>
      <nav aria-label="Main navigation" id="site-nav">
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={current === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <Link href="/about" className="field-link">
        Field notes <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
      <ThemeToggle />
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div>
        <div className="wordmark footer-mark">
          <span className="mark">
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <span>
            SECURITY<span>CORP</span>
          </span>
        </div>
        <p>Security engineering, documented in the open.</p>
      </div>
      <nav className="footer-links" aria-label="Footer">
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        {profileLinks.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener">
            {l.label}
          </a>
        ))}
        <a href="/rss.xml">
          <Rss size={13} aria-hidden="true" /> RSS
        </a>
      </nav>
      <p className="copyright">© 2026 Ravi Teja Thota</p>
    </footer>
  );
}

export function Shell({ children, current }: { children: React.ReactNode; current?: string }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header current={current} />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <Footer />
    </>
  );
}
