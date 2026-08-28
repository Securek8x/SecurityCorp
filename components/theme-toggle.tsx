"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type ThemePreference = "light" | "dark";
const STORAGE_KEY = "securitycorp-theme";

function apply(pref: ThemePreference) {
  const root = document.documentElement;
  root.setAttribute("data-theme", pref);
  root.setAttribute("data-theme-preference", pref);
  root.style.colorScheme = pref;
}

function readDocumentPreference(): ThemePreference {
  const current = document.documentElement.getAttribute("data-theme-preference");
  return current === "light" || current === "dark" ? current : "dark";
}

function subscribeToMount() {
  return () => {};
}

export function ThemeToggle() {
  // The head initializer owns the pre-paint state. Wait for it before rendering
  // a selected button so static markup never briefly claims the wrong choice.
  const [selectedPref, setSelectedPref] = useState<ThemePreference | null>(null);
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  const transitionTimer = useRef<number | undefined>(undefined);
  const pref = selectedPref ?? (mounted ? readDocumentPreference() : "dark");

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  function toggle() {
    const next: ThemePreference = pref === "dark" ? "light" : "dark";
    const root = document.documentElement;
    window.clearTimeout(transitionTimer.current);
    root.classList.add("theme-transition");
    setSelectedPref(next);
    apply(next);
    transitionTimer.current = window.setTimeout(() => root.classList.remove("theme-transition"), 250);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private browsing, disabled storage) — the
      // choice just won't persist across visits; the current palette still works.
    }
  }

  if (!mounted) return null;

  const isDark = pref === "dark";
  const Icon = isDark ? Moon : Sun;
  return <button className="theme-toggle" type="button" aria-pressed={isDark} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} onClick={toggle}><Icon size={15} aria-hidden="true" />{isDark ? "Dark" : "Light"}</button>;
}
