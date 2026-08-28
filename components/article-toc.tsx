"use client";
import { useEffect, useRef, useState } from "react";

export function ArticleToc({ sections }: { sections: { id: string; label: string; number: string }[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    observer.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActiveId(topMost.target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.current?.observe(el));
    return () => observer.current?.disconnect();
  }, [sections]);

  return (
    <nav className="toc" aria-label="Table of contents">
      <span className="mono-label">On this page</span>
      <ol>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={s.id === activeId ? "location" : undefined}>
              <span>{s.number}</span>
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
