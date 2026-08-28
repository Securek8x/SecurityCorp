export default function ReverseProxyDiagram() {
  return (
    <figure className="arch-diagram">
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
          controlled management path rather than the public-facing listener.
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
        <path d="M170,90 H200" stroke="var(--diagram-line)" strokeWidth="2" markerEnd="url(#proxy-arrow-cyan)" fill="none" />
        <path d="M370,90 H400" stroke="var(--diagram-line)" strokeWidth="2" markerEnd="url(#proxy-arrow-cyan)" fill="none" />
        <path d="M580,90 H610" stroke="var(--diagram-line)" strokeWidth="2" markerEnd="url(#proxy-arrow-cyan)" fill="none" />

        {/* admin-plane branch: private proxy -> restricted management */}
        <path
          d="M495,120 V220"
          stroke="var(--diagram-failure)"
          strokeWidth="2"
          strokeDasharray="6 5"
          markerEnd="url(#proxy-arrow-amber)"
          fill="none"
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
          <rect x="200" y="60" width="170" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-node-border)" strokeWidth="1.5" />
          <text x="285" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Internal DNS
          </text>
        </g>

        {/* Private proxy (trust boundary, focusable) */}
        <g tabIndex={0} role="group" aria-label="Private proxy — resolves internally, exposes no inbound ports on the router, forwards to internal services only">
          <title>Trust boundary: a friendly hostname does not require public reachability — the router exposes no inbound ports.</title>
          <rect x="400" y="55" width="180" height="70" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-line)" strokeWidth="2" />
          <text x="490" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Private proxy
          </text>
        </g>

        {/* Internal service */}
        <g>
          <rect x="610" y="60" width="170" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-node-border)" strokeWidth="1.5" />
          <text x="695" y="95" textAnchor="middle" fontSize="14" fill="var(--diagram-node-text)" fontFamily="Arial, Helvetica, sans-serif">
            Internal service
          </text>
        </g>

        {/* Restricted management (isolated admin plane, focusable) */}
        <g tabIndex={0} role="group" aria-label="Restricted management — the admin interface is bound to a controlled network, reached only through an authenticated tunnel">
          <title>The proxy’s public listeners and its administration interface carry different risk and are isolated accordingly.</title>
          <rect x="400" y="220" width="190" height="60" rx="6" fill="var(--diagram-node-bg)" stroke="var(--diagram-failure)" strokeWidth="2" />
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
