const MAIN_ROUTE = "M170,90 H200 M370,90 H400 M580,90 H610";
const ADMIN_ROUTE = "M495,120 V220";

export default function ReverseProxyDiagram() {
  return (
    <figure className="arch-diagram diagram-sequence" data-motion="once" data-motion-duration="2400">
      <svg
        className="arch-diagram-svg"
        viewBox="0 0 900 300"
        width="100%"
        role="img"
        aria-labelledby="proxy-diagram-title proxy-diagram-desc"
      >
        <title id="proxy-diagram-title">Private reverse proxy flow</title>
        <desc id="proxy-diagram-desc">
          Client resolves a hostname through internal DNS, which points to the private proxy, which forwards to the
          internal service. The proxy’s administration plane is a separate, restricted branch reached through a
          controlled management path rather than the public-facing listener — a deliberate separation, not a
          failure. An animated sequence draws this architecture flow when the diagram enters view; the finished
          diagram is fully visible either way.
        </desc>
        <defs>
          <marker id="proxy-arrow-cyan" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--diagram-line)" />
          </marker>
          <marker id="proxy-arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--diagram-failure)" />
          </marker>
        </defs>

        {/* main flow connectors */}
        <path
          className="flow-path"
          d={MAIN_ROUTE}
          markerEnd="url(#proxy-arrow-cyan)"
          style={{ "--path-length": 90 } as React.CSSProperties}
        />
        <circle
          className="flow-packet flow-packet-cyan flow-packet-once"
          r="4.5"
          style={{ offsetPath: `path("${MAIN_ROUTE}")`, "--flow-duration": "1200ms", "--flow-delay": "150ms" } as React.CSSProperties}
        />

        {/* admin-plane branch: private proxy -> restricted management (separation, not a failure) */}
        <path
          className="flow-path flow-path-failure"
          d={ADMIN_ROUTE}
          markerEnd="url(#proxy-arrow-amber)"
          style={{ "--path-length": 100, "--draw-duration": "700ms", "--draw-delay": "1350ms" } as React.CSSProperties}
        />
        <circle
          className="flow-packet flow-packet-once"
          r="4.5"
          fill="var(--diagram-failure)"
          style={{ offsetPath: `path("${ADMIN_ROUTE}")`, "--flow-duration": "900ms", "--flow-delay": "1450ms" } as React.CSSProperties}
        />
        <text x="510" y="175" fontSize="13" fill="var(--diagram-failure)" fontFamily="Arial, Helvetica, sans-serif">
          admin plane
        </text>

        {/* Client */}
        <g>
          <rect x="10" y="60" width="160" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-node-border)" strokeWidth="1.5" />
          <text x="90" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Client
          </text>
        </g>

        {/* Internal DNS */}
        <g>
          <rect
            className="flow-pulse-once"
            x="200" y="60" width="170" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-node-border)" strokeWidth="1.5"
            style={{ "--pulse-delay": "550ms" } as React.CSSProperties}
          />
          <text x="285" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Internal DNS
          </text>
        </g>

        {/* Private proxy (trust boundary, focusable) — the decision point the sequence pauses on */}
        <g tabIndex={0} role="group" aria-label="Private proxy — resolves internally, exposes no inbound ports on the router, forwards to internal services only">
          <title>Trust boundary: a friendly hostname does not require public reachability — the router exposes no inbound ports.</title>
          <rect
            className="flow-pulse-once"
            x="400" y="55" width="180" height="70" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-line)" strokeWidth="2"
            style={{ "--pulse-delay": "950ms" } as React.CSSProperties}
          />
          <text x="490" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Private proxy
          </text>
        </g>

        {/* Internal service — the validated safe outcome of the normal path */}
        <g>
          <rect
            className="flow-node-safe flow-pulse-once"
            x="610" y="60" width="170" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--go)" strokeWidth="2"
            style={{ "--pulse-delay": "1300ms" } as React.CSSProperties}
          />
          <text x="695" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Internal service
          </text>
        </g>

        {/* Restricted management (isolated admin plane, focusable) */}
        <g tabIndex={0} role="group" aria-label="Restricted management — the admin interface is bound to a controlled network, reached only through an authenticated tunnel">
          <title>The proxy’s public listeners and its administration interface carry different risk and are isolated accordingly.</title>
          <rect
            className="flow-pulse-once"
            x="400" y="220" width="190" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-failure)" strokeWidth="2"
            style={{ "--pulse-delay": "2250ms" } as React.CSSProperties}
          />
          <text x="495" y="247" textAnchor="middle" fontSize="13" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Restricted
          </text>
          <text x="495" y="265" textAnchor="middle" fontSize="13" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            management
          </text>
        </g>
      </svg>
      <figcaption>
        Client → internal DNS → private proxy → internal service. The proxy&apos;s administration plane is a
        separate, restricted branch reached through a controlled management path.
      </figcaption>
    </figure>
  );
}
