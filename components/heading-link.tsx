"use client";
import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

export function HeadingLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — the heading anchor itself is still a normal in-page link.
    }
  }

  return (
    <button
      type="button"
      className="heading-link-btn"
      onClick={handleCopy}
      aria-label={copied ? "Link copied" : "Copy link to this section"}
    >
      {copied ? <Check size={13} /> : <LinkIcon size={13} />}
      <span aria-live="polite" className="sr-only">{copied ? "Link copied" : ""}</span>
    </button>
  );
}
