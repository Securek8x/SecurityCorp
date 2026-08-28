"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useTabHidden } from "@/components/motion-controller";

// Deterministic seeded RNG (mulberry32) — the lattice below is generated
// from a fixed seed, so the topology is identical on every load. This is
// a deliberately designed layout expressed as generator code, not a
// per-visit random scene: three depth layers, a central "trust boundary"
// core, and a fixed set of edges/packet routes chosen by hand from the
// generated node list.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type NodeSpec = { pos: THREE.Vector3; role: "cyan" | "violet" | "safe" | "controlled" };

const SEED = 87213;
const LAYER_Z = [-90, 0, 95];
const NODES_PER_LAYER = [10, 9, 9]; // 28 nodes total — within the 30–40 budget

function buildLattice(): { nodes: NodeSpec[]; edges: [number, number, "cyan" | "violet"][] } {
  const rand = mulberry32(SEED);
  const nodes: NodeSpec[] = [];
  LAYER_Z.forEach((z, layerIndex) => {
    const count = NODES_PER_LAYER[layerIndex];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.4;
      const radius = 55 + rand() * 70;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.72; // slightly flattened, reads better under a wide hero
      const roll = rand();
      const role: NodeSpec["role"] = roll > 0.93 ? "safe" : roll > 0.86 ? "controlled" : roll > 0.72 ? "violet" : "cyan";
      nodes.push({ pos: new THREE.Vector3(x, y, z), role });
    }
  });

  // Connections: each node links to its nearest neighbor(s) within the same
  // layer (keeps it readable, not a fully-meshed blob) plus a sparse set of
  // cross-layer links toward the core — capped well under the 60–80 budget.
  const edges: [number, number, "cyan" | "violet"][] = [];
  const perLayerRanges: [number, number][] = [];
  let offset = 0;
  for (const count of NODES_PER_LAYER) {
    perLayerRanges.push([offset, offset + count]);
    offset += count;
  }
  for (const [start, end] of perLayerRanges) {
    for (let i = start; i < end; i++) {
      const next = i + 1 < end ? i + 1 : start;
      edges.push([i, next, "cyan"]);
    }
  }
  // sparse cross-layer links (violet, secondary)
  const rand2 = mulberry32(SEED + 1);
  for (let layer = 0; layer < perLayerRanges.length - 1; layer++) {
    const [aStart, aEnd] = perLayerRanges[layer];
    const [bStart, bEnd] = perLayerRanges[layer + 1];
    const linkCount = 4;
    for (let i = 0; i < linkCount; i++) {
      const a = aStart + Math.floor(rand2() * (aEnd - aStart));
      const b = bStart + Math.floor(rand2() * (bEnd - bStart));
      edges.push([a, b, "violet"]);
    }
  }
  return { nodes, edges };
}

const COLOR = {
  cyan: 0x00e5ff,
  violet: 0x8b5cf6,
  safe: 0x33ff99,
  controlled: 0xf5b942,
};

export default function HeroWebglCanvas({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [broken, setBroken] = useState(false);
  const [ready, setReady] = useState(false);
  const tabHidden = useTabHidden();
  const tabHiddenRef = useRef(tabHidden);
  useEffect(() => {
    tabHiddenRef.current = tabHidden;
  }, [tabHidden]);

  useEffect(() => {
    const host = canvasHostRef.current;
    const heroEl = containerRef.current;
    if (!host || !heroEl) return;
    // Preserve the narrowed element for closures below; React may clear the
    // ref during unmount while cleanup is still being assembled.
    const canvasHost = host;
    const heroSection = heroEl.closest<HTMLElement>(".hero") ?? heroEl;

    // These setBroken calls detect synchronous WebGL-context failure from an
    // external API (the constructor can throw, or return a null context) —
    // not state derivable at render time, so the usual "compute during
    // render" lint guidance doesn't apply to this specific external check.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBroken(true);
      return;
    }
    const gl = renderer.getContext();
    if (!gl) {
      setBroken(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 1000);
    camera.position.set(0, 0, 340);

    renderer.setClearColor(0x000000, 0);
    canvasHost.appendChild(renderer.domElement);

    const { nodes, edges } = buildLattice();

    // core "trust boundary" structure
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(34, 1),
      new THREE.MeshBasicMaterial({ color: COLOR.cyan, wireframe: true, transparent: true, opacity: 0.5 })
    );
    scene.add(core);

    // edges (two LineSegments buffers: cyan primary, violet secondary)
    function buildEdgeGeometry(role: "cyan" | "violet") {
      const positions: number[] = [];
      for (const [a, b, edgeRole] of edges) {
        if (edgeRole !== role) continue;
        positions.push(nodes[a].pos.x, nodes[a].pos.y, nodes[a].pos.z, nodes[b].pos.x, nodes[b].pos.y, nodes[b].pos.z);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      return geo;
    }
    const cyanEdges = new THREE.LineSegments(buildEdgeGeometry("cyan"), new THREE.LineBasicMaterial({ color: COLOR.cyan, transparent: true, opacity: 0.35 }));
    const violetEdges = new THREE.LineSegments(buildEdgeGeometry("violet"), new THREE.LineBasicMaterial({ color: COLOR.violet, transparent: true, opacity: 0.28 }));
    scene.add(cyanEdges, violetEdges);

    // nodes — a small sphere plus a larger, dim, additive-blended sphere
    // behind it for a soft glow without a postprocessing bloom pass.
    const nodeMeshes: THREE.Mesh[] = [];
    const glowMeshes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(2.6, 18, 18);
    const glowGeo = new THREE.SphereGeometry(6, 14, 14);
    for (const n of nodes) {
      const color = COLOR[n.role];
      const mesh = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color }));
      mesh.position.copy(n.pos);
      const glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.copy(n.pos);
      scene.add(mesh, glow);
      nodeMeshes.push(mesh);
      glowMeshes.push(glow);
    }

    // a small number of packets relaying along fixed cyan edges toward the core
    const cyanEdgeList = edges.filter(([, , r]) => r === "cyan");
    const packetRoutes = [0, Math.floor(cyanEdgeList.length / 3), Math.floor((cyanEdgeList.length * 2) / 3)]
      .filter((i) => i < cyanEdgeList.length)
      .map((i) => cyanEdgeList[i]);
    const packets = packetRoutes.map((route, i) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), new THREE.MeshBasicMaterial({ color: COLOR.cyan }));
      scene.add(mesh);
      return { mesh, a: nodes[route[0]].pos, b: nodes[route[1]].pos, phase: i / packetRoutes.length, speed: 0.00022 };
    });

    // --- pointer parallax: refs only, no React state, updated in the rAF loop ---
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    function onPointerMove(e: PointerEvent) {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const rect = heroEl!.getBoundingClientRect();
      pointerTarget.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerTarget.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    }
    function onPointerLeave() {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
    }
    heroEl.addEventListener("pointermove", onPointerMove, { passive: true });
    heroEl.addEventListener("pointerleave", onPointerLeave, { passive: true });

    // --- lifecycle: pause offscreen, pause hidden tab ---
    let inView = true;
    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
    }, { threshold: 0.1 });
    io.observe(heroEl);

    function resize() {
      // The canvas is visually displayed within this negatively-inset host,
      // not across the full hero. Keeping the drawing buffer, CSS box, and
      // camera projection tied to this exact rectangle prevents CSS scaling
      // from softening or aliasing the lattice.
      const rect = canvasHost.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasHost);
    // Resolution media queries change when browser zoom or a display DPR
    // changes without necessarily changing the host's CSS dimensions.
    let dprMediaQuery: MediaQueryList | null = null;
    function watchDevicePixelRatio() {
      dprMediaQuery?.removeEventListener("change", watchDevicePixelRatio);
      dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprMediaQuery.addEventListener("change", watchDevicePixelRatio);
      resize();
    }
    window.visualViewport?.addEventListener("resize", resize);
    watchDevicePixelRatio();

    function onContextLost(e: Event) {
      e.preventDefault();
      cancelled = true;
      setBroken(true);
    }
    function onContextRestored() {
      // A lost-then-restored context mid-session is rare for a decorative
      // scene; simplest safe behavior is to keep showing the SVG fallback
      // (already crossfaded back in via `broken`) rather than rebuild state.
    }
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    let cancelled = false;
    let rafId = 0;
    const clock = new THREE.Clock();
    function frame() {
      if (cancelled) return;
      rafId = requestAnimationFrame(frame);
      if (!inView || tabHiddenRef.current) return;
      const dt = clock.getDelta();

      pointer.x += (pointerTarget.x - pointer.x) * 0.06;
      pointer.y += (pointerTarget.y - pointer.y) * 0.06;
      // Direct style mutation, not React state — read by the scope card's
      // CSS transform (app/globals.css) via custom-property inheritance.
      heroSection.style.setProperty("--pointer-x", pointer.x.toFixed(3));
      heroSection.style.setProperty("--pointer-y", pointer.y.toFixed(3));

      const t = clock.elapsedTime;
      // slow autonomous camera drift + restrained pointer-responsive offset
      camera.position.x = Math.sin(t * 0.05) * 12 + pointer.x * 18;
      camera.position.y = Math.cos(t * 0.04) * 8 - pointer.y * 14;
      camera.lookAt(0, 0, 0);

      core.rotation.y += dt * 0.08;
      core.rotation.x += dt * 0.02;

      // brighten nodes nearest the pointer (screen-space projection, cheap at 28 nodes)
      const ndc = new THREE.Vector3();
      for (let i = 0; i < nodeMeshes.length; i++) {
        ndc.copy(nodes[i].pos).project(camera);
        const dx = ndc.x - pointer.x;
        const dy = ndc.y - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = Math.max(0, 1 - dist / 0.45);
        const mat = glowMeshes[i].material as THREE.MeshBasicMaterial;
        mat.opacity = 0.14 + near * 0.35;
        nodeMeshes[i].scale.setScalar(1 + near * 0.5);
      }

      for (const p of packets) {
        p.phase = (p.phase + p.speed * dt * 1000) % 1;
        p.mesh.position.lerpVectors(p.a, p.b, p.phase);
      }

      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(frame);
    setReady(true);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      heroSection.style.removeProperty("--pointer-x");
      heroSection.style.removeProperty("--pointer-y");
      io.disconnect();
      resizeObserver.disconnect();
      dprMediaQuery?.removeEventListener("change", watchDevicePixelRatio);
      window.visualViewport?.removeEventListener("resize", resize);
      heroEl.removeEventListener("pointermove", onPointerMove);
      heroEl.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      nodeGeo.dispose();
      glowGeo.dispose();
      cyanEdges.geometry.dispose();
      violetEdges.geometry.dispose();
      core.geometry.dispose();
      (core.material as THREE.Material).dispose();
      (cyanEdges.material as THREE.Material).dispose();
      (violetEdges.material as THREE.Material).dispose();
      for (const m of nodeMeshes) (m.material as THREE.Material).dispose();
      for (const m of glowMeshes) (m.material as THREE.Material).dispose();
      for (const p of packets) {
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === canvasHost) canvasHost.removeChild(renderer.domElement);
    };
  }, [containerRef]);

  return (
    <div
      ref={canvasHostRef}
      className="hero-webgl-host"
      aria-hidden="true"
      data-state={broken ? "broken" : ready ? "ready" : "loading"}
    />
  );
}
