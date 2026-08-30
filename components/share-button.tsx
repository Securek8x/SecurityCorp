"use client";
import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title, label = "Share this guide" }: { title: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled the native share sheet, or it failed — fall through to copy-link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      // Clipboard API unavailable — nothing more to do; the URL bar itself is still shareable.
    }
  }

  return (
    <button type="button" className="share-btn outline-link" onClick={handleShare}>
      {status === "copied" ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}
      {status === "copied" ? "Link copied" : label}
    </button>
  );
}
