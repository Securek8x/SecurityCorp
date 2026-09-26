"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
import type { ResolvedControlScenario, ScenarioEvidence } from "@/lib/control-under-test";
import { EvidenceKey, EvidenceMark, EvidenceUnavailableMark } from "@/components/evidence-mark";
import { FailurePathDiagram } from "@/components/diagrams/failure-path-diagram";

// The evidence mark comes from the authoritative project evidence record the
// scenario references (resolved server-side), never from prose. Unresolvable
// evidence reads "Evidence unavailable".
function Verdict({ evidence }: { evidence: ScenarioEvidence }) {
  return evidence.status === "resolved" ? <EvidenceMark maturity={evidence.maturity} /> : <EvidenceUnavailableMark />;
}

// The diagram's end node reads "safe" only for a recorded as-intended
// outcome — never because the evidence is Validated. A recorded failure is
// Validated evidence of a failure.
function safeOutcome(evidence: ScenarioEvidence): boolean {
  return evidence.status === "resolved" && evidence.outcome === "as-intended";
}

// Feature-detected, reduced-motion-respecting: a genuine no-op (instant
// swap, same as before) everywhere this isn't supported or isn't wanted —
// this is purely a progressive crossfade layered on identical state logic,
// never a second source of truth for what tab is selected.
function changeScenario(next: () => void) {
  const canTransition =
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canTransition) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(next);
  } else {
    next();
  }
}

export function ControlUnderTest({ scenarios }: { scenarios: ResolvedControlScenario[] }) {
  const [activeId, setActiveId] = useState(scenarios[0].id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  const activeIndex = scenarios.findIndex((s) => s.id === activeId);

  function focusTab(index: number) {
    const wrapped = (index + scenarios.length) % scenarios.length;
    changeScenario(() => setActiveId(scenarios[wrapped].id));
    tabRefs.current[wrapped]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { e.preventDefault(); focusTab(activeIndex + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); focusTab(activeIndex - 1); }
    else if (e.key === "Home") { e.preventDefault(); focusTab(0); }
    else if (e.key === "End") { e.preventDefault(); focusTab(scenarios.length - 1); }
  }

  return (
    <section className="cut" id="failure-lab" aria-labelledby="failure-lab-heading">
      <p className="section-label">Control under test</p>
      <h2 id="failure-lab-heading">What happens when it breaks.</h2>
      <p className="cut-lede">Pick a failure. See what the control does. Results come from recorded tests and documented designs — none of it is a live simulation.</p>
      <ol className="cut-steps" role="list">
        <li>Choose a failure condition.</li>
        <li>Compare the expected safe state with what the control does.</li>
        <li>Check the evidence behind the result:</li>
      </ol>
      <EvidenceKey />

      <div role="tablist" aria-label="Failure scenarios" className="cut-tabs" onKeyDown={onKeyDown}>
        {scenarios.map((s, i) => {
          return (
            <button
              key={s.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              id={`cut-tab-${s.id}`}
              aria-selected={s.id === activeId}
              aria-controls={`cut-panel-${s.id}`}
              tabIndex={s.id === activeId ? 0 : -1}
              className="cut-tab clip-corner-sm"
              onClick={() => changeScenario(() => setActiveId(s.id))}
            >
              {s.id === activeId && <CheckCircle2 size={14} aria-hidden="true" />}
              {s.control}
              <span className="cut-tab-verdict"><Verdict evidence={s.evidence} /></span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`cut-panel-${active.id}`}
        aria-labelledby={`cut-tab-${active.id}`}
        tabIndex={0}
        className="cut-panel"
      >
        <FailurePathDiagram key={active.id} scenario={active} safe={safeOutcome(active.evidence)} />
        <dl>
          <div>
            <dt>Failure injection</dt>
            <dd>{active.trigger}</dd>
          </div>
          <div>
            <dt>Expected safe state</dt>
            <dd>{active.expected}</dd>
          </div>
          <div>
            <dt>Observed result</dt>
            <dd>
              {active.evidence.status === "resolved" ? active.evidence.observed : "No verified evidence record is available."}{" "}
              <span className="cut-verdict"><Verdict evidence={active.evidence} /></span>
            </dd>
          </div>
          <div>
            <dt>Principle</dt>
            <dd className="cut-principle">{active.principle}</dd>
          </div>
        </dl>
        <Link href={active.href} className="text-link">
          Read the full test <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
