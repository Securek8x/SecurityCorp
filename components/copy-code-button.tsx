"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (older browser, insecure context) — fail silently, code is still selectable.
    }
  }

  return (
    <button
      type="button"
      className="copy-code-btn"
      onClick={handleCopy}
      aria-label={copied ? "Code copied" : "Copy code to clipboard"}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
