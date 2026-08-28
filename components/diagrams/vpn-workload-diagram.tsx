const MAIN_ROUTE = "M170,90 H210 M400,90 H430 M600,90 H630";
const FAILURE_ROUTE = "M515,120 V220";

export default function VpnWorkloadDiagram() {
  return (
    <figure className="arch-diagram diagram-sequence" data-motion="once" data-motion-duration="2400">
      <svg
        className="arch-diagram-svg"
        viewBox="0 0 900 300"
        width="100%"
        role="img"
        aria-labelledby="vpn-diagram-title vpn-diagram-desc"
      >
        <title id="vpn-diagram-title">VPN-bound workload egress flow</title>
        <desc id="vpn-diagram-desc">
          Application shares the VPN container’s network namespace, which routes through the VPN tunnel to the
          internet. If the tunnel drops, the flow branches to a kill-switch block instead of falling back to the
          host’s normal route. An animated sequence draws this architecture flow and a documented failure path
          when the diagram enters view; the finished diagram is fully visible either way.
        </desc>
        <defs>
          <marker id="vpn-arrow-cyan" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--diagram-line)" />
          </marker>
          <marker id="vpn-arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--diagram-failure)" />
          </marker>
        </defs>

        {/* main flow connectors */}
        <path
          className="flow-path"
          d={MAIN_ROUTE}
          markerEnd="url(#vpn-arrow-cyan)"
          style={{ "--path-length": 100 } as React.CSSProperties}
        />
        <circle
          className="flow-packet flow-packet-cyan flow-packet-once"
          r="4.5"
          style={{ offsetPath: `path("${MAIN_ROUTE}")`, "--flow-duration": "1100ms", "--flow-delay": "150ms" } as React.CSSProperties}
        />

        {/* failure branch: tunnel -> kill-switch block */}
        <path
          className="flow-path flow-path-failure"
          d={FAILURE_ROUTE}
          markerEnd="url(#vpn-arrow-amber)"
          style={{ "--path-length": 100, "--draw-duration": "700ms", "--draw-delay": "1050ms" } as React.CSSProperties}
        />
        <circle
          className="flow-packet flow-packet-once"
          r="4.5"
          fill="var(--diagram-failure)"
          style={{ offsetPath: `path("${FAILURE_ROUTE}")`, "--flow-duration": "900ms", "--flow-delay": "1150ms" } as React.CSSProperties}
        />
        <text x="530" y="175" fontSize="13" fill="var(--diagram-failure)" fontFamily="Arial, Helvetica, sans-serif">
          on drop
        </text>

        {/* Application */}
        <g>
          <rect x="10" y="60" width="160" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-node-border)" strokeWidth="1.5" />
          <text x="90" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Application
          </text>
        </g>

        {/* Shared network namespace (trust boundary, focusable) */}
        <g tabIndex={0} role="group" aria-label="Shared network namespace — the workload has no independent network path that could bypass the tunnel">
          <title>Trust boundary: the workload shares the VPN container’s namespace instead of owning a separate interface.</title>
          <rect
            className="flow-pulse-once"
            x="210" y="55" width="190" height="70" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-line)" strokeWidth="2"
            style={{ "--pulse-delay": "550ms" } as React.CSSProperties}
          />
          <text x="305" y="83" textAnchor="middle" fontSize="13" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Shared network
          </text>
          <text x="305" y="101" textAnchor="middle" fontSize="13" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            namespace
          </text>
        </g>

        {/* VPN tunnel — the decision point the sequence pauses on before the failure branch */}
        <g>
          <rect
            className="flow-pulse-once"
            x="430" y="60" width="170" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-node-border)" strokeWidth="1.5"
            style={{ "--pulse-delay": "850ms" } as React.CSSProperties}
          />
          <text x="515" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            VPN tunnel
          </text>
        </g>

        {/* Internet — the validated safe outcome of the normal path */}
        <g>
          <rect
            className="flow-node-safe flow-pulse-once"
            x="630" y="60" width="150" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--go)" strokeWidth="2"
            style={{ "--pulse-delay": "1200ms" } as React.CSSProperties}
          />
          <text x="705" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Internet
          </text>
        </g>

        {/* Kill-switch block (failure outcome, focusable) */}
        <g tabIndex={0} role="group" aria-label="Kill-switch block — if the tunnel drops, outbound traffic is blocked rather than falling back to the host's route">
          <title>No silent fallback: a dropped tunnel blocks egress instead of quietly using the host’s normal gateway.</title>
          <rect
            className="flow-pulse-once"
            x="425" y="220" width="180" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-failure)" strokeWidth="2"
            style={{ "--pulse-delay": "1950ms" } as React.CSSProperties}
          />
          <text x="515" y="247" textAnchor="middle" fontSize="13" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Kill-switch
          </text>
          <text x="515" y="265" textAnchor="middle" fontSize="13" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            block
          </text>
        </g>
      </svg>
      <figcaption>
        Application → shared network namespace → VPN tunnel → internet. If the tunnel drops, the flow branches to a
        kill-switch block instead of falling back to the host&apos;s normal route.
      </figcaption>
    </figure>
  );
}
