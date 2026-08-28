"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
import type { ControlScenario } from "@/lib/control-under-test";
import { FailurePathDiagram } from "@/components/diagrams/failure-path-diagram";

// The verdict badge is derived from the scenario's own "observed" text — never
// asserted independently — so the badge can't drift from the underlying claim.
function verdictOf(observed: string): { label: string; className: string } {
  return observed.toLowerCase().startsWith("validated")
    ? { label: "Validated", className: "cut-verdict-validated" }
    : { label: "Design only", className: "cut-verdict-design" };
}

export function ControlUnderTest({ scenarios }: { scenarios: ControlScenario[] }) {
  const [activeId, setActiveId] = useState(scenarios[0].id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  const activeIndex = scenarios.findIndex((s) => s.id === activeId);
  const activeVerdict = verdictOf(active.observed);

  function focusTab(index: number) {
    const wrapped = (index + scenarios.length) % scenarios.length;
    setActiveId(scenarios[wrapped].id);
    tabRefs.current[wrapped]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { e.preventDefault(); focusTab(activeIndex + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); focusTab(activeIndex - 1); }
    else if (e.key === "Home") { e.preventDefault(); focusTab(0); }
    else if (e.key === "End") { e.preventDefault(); focusTab(scenarios.length - 1); }
  }

  return (
    <section className="cut">
      <p className="section-label">Control under test</p>
      <h2>What happens when it breaks.</h2>
      <p className="cut-lede">Pick a failure condition. Every result below is either directly validated or documented as the intended design — none of it is a live simulation.</p>

      <div role="tablist" aria-label="Failure scenarios" className="cut-tabs" onKeyDown={onKeyDown}>
        {scenarios.map((s, i) => {
          const verdict = verdictOf(s.observed);
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
              onClick={() => setActiveId(s.id)}
            >
              {s.id === activeId && <CheckCircle2 size={14} aria-hidden="true" />}
              {s.control}
              <span className={`cut-tab-verdict ${verdict.className}`}>{verdict.label}</span>
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
        <FailurePathDiagram key={active.id} scenario={active} verdictClassName={activeVerdict.className} />
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
              {active.observed}{" "}
              <span className={`cut-verdict ${activeVerdict.className}`}>{activeVerdict.label}</span>
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
