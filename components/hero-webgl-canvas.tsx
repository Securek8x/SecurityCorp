"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useTabHidden } from "@/components/motion-controller";

type Tone = "cyan" | "violet" | "safe" | "warning";
type Node = { pos: THREE.Vector3; tone: Tone };
type Route = { a: number; b: number; tone: Tone };
const COLOR: Record<Tone, number> = { cyan: 0x00e5ff, violet: 0x8b5cf6, safe: 0x33ff99, warning: 0xf5b942 };

function seeded(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
function geometry(points: number[]) { const value = new THREE.BufferGeometry(); value.setAttribute("position", new THREE.Float32BufferAttribute(points, 3)); return value; }

// A fixed, deliberately synthetic topology. It models no actual people,
// systems, locations, or traffic and keeps the hero copy's side uncluttered.
function topology(): { nodes: Node[]; routes: Route[] } {
  const next = seeded(87213), nodes: Node[] = [], ranges: Array<[number, number]> = [];
  const counts = [10, 10, 9], depths = [-104, -24, 68]; let offset = 0;
  counts.forEach((count, layer) => { ranges.push([offset, offset + count]); for (let i = 0; i < count; i += 1) { const angle = i / count * Math.PI * 2 + next() * .32, radius = 56 + next() * 86, signal = next(); nodes.push({ pos: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * .68, depths[layer]), tone: signal > .955 ? "warning" : signal > .9 ? "safe" : signal > .7 ? "violet" : "cyan" }); } offset += count; });
  const routes: Route[] = [];
  ranges.forEach(([from, to]) => { for (let i = from; i < to; i += 1) routes.push({ a: i, b: i + 1 < to ? i + 1 : from, tone: i % 4 === 0 ? "violet" : "cyan" }); });
  const link = seeded(87214);
  for (let layer = 0; layer < ranges.length - 1; layer += 1) { const [a0, a1] = ranges[layer], [b0, b1] = ranges[layer + 1]; for (let i = 0; i < 5; i += 1) routes.push({ a: a0 + Math.floor(link() * (a1 - a0)), b: b0 + Math.floor(link() * (b1 - b0)), tone: "violet" }); }
  return { nodes, routes };
}

export default function HeroWebglCanvas({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const hostRef = useRef<HTMLDivElement>(null); const [broken, setBroken] = useState(false); const [ready, setReady] = useState(false);
  const tabHidden = useTabHidden(); const tabHiddenRef = useRef(tabHidden);
  useEffect(() => { tabHiddenRef.current = tabHidden; }, [tabHidden]);
  useEffect(() => {
    const host = hostRef.current, hero = containerRef.current; if (!host || !hero) return;
    const heroSection = hero.closest<HTMLElement>(".hero") ?? hero; let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" }); } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- an external WebGL constructor failed; retain the SVG fallback.
      setBroken(true); return;
    }
    if (!renderer.getContext()) { setBroken(true); return; }
    renderer.setClearColor(0x000000, 0); host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(39, 1, 1, 1000); camera.position.set(16, -4, 382);
    const { nodes, routes } = topology(), world = new THREE.Group(), boundary = new THREE.Group(); scene.add(world); world.add(boundary);
    const materials: THREE.Material[] = [];
    const meshMaterial = (tone: Tone, opacity: number, additive = false) => { const item = new THREE.MeshBasicMaterial({ color: COLOR[tone], transparent: true, opacity, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !additive }); item.userData.tone = tone; materials.push(item); return item; };
    const lineMaterial = (tone: Tone, opacity: number) => { const item = new THREE.LineBasicMaterial({ color: COLOR[tone], transparent: true, opacity, depthWrite: false }); item.userData.tone = tone; materials.push(item); return item; };
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(40, 2), meshMaterial("cyan", .32)); (core.material as THREE.MeshBasicMaterial).wireframe = true; boundary.add(core);
    const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(28, 1), meshMaterial("violet", .12)); (inner.material as THREE.MeshBasicMaterial).wireframe = true; boundary.add(inner);
    const scan = new THREE.Mesh(new THREE.CircleGeometry(37, 32, -.4, .8), meshMaterial("cyan", .09, true)); scan.rotation.x = -Math.PI / 2; scan.position.y = 1; boundary.add(scan);
    const groups = new Map<Tone, number[]>(); (["cyan", "violet", "safe", "warning"] as Tone[]).forEach((tone) => groups.set(tone, [])); routes.forEach((route) => groups.get(route.tone)?.push(...nodes[route.a].pos.toArray(), ...nodes[route.b].pos.toArray()));
    const routeLines = new Map<Tone, THREE.LineSegments>(); (["cyan", "violet"] as Tone[]).forEach((tone) => { const line = new THREE.LineSegments(geometry(groups.get(tone) ?? []), lineMaterial(tone, tone === "cyan" ? .29 : .21)); world.add(line); routeLines.set(tone, line); });
    const gridPoints: number[] = []; for (let x = -180; x <= 180; x += 30) gridPoints.push(x, -116, -160, x, -116, 120); for (let z = -160; z <= 120; z += 28) gridPoints.push(-180, -116, z, 180, -116, z);
    const grid = new THREE.LineSegments(geometry(gridPoints), lineMaterial("cyan", .1)); grid.rotation.x = -.17; world.add(grid);
    const tickPoints: number[] = []; for (let x = -172; x <= 172; x += 43) tickPoints.push(x, 112, -140, x + 11, 112, -140, x, 112, -140, x, 105, -140);
    const ticks = new THREE.LineSegments(geometry(tickPoints), lineMaterial("violet", .24)); world.add(ticks);
    const nodeGeometry = new THREE.SphereGeometry(2.55, 12, 12), glowGeometry = new THREE.SphereGeometry(7.5, 12, 12), ringGeometry = new THREE.RingGeometry(3.6, 4.3, 20), packetGeometry = new THREE.SphereGeometry(1.7, 10, 10);
    const nodeMeshes: THREE.Mesh[] = [], glows: THREE.Mesh[] = [];
    nodes.forEach((node) => { const dot = new THREE.Mesh(nodeGeometry, meshMaterial(node.tone, .92)); dot.position.copy(node.pos); world.add(dot); nodeMeshes.push(dot); const glow = new THREE.Mesh(glowGeometry, meshMaterial(node.tone, node.tone === "cyan" ? .11 : .08, true)); glow.position.copy(node.pos); world.add(glow); glows.push(glow); });
    const activeRoutes = routes.filter((route) => route.tone === "cyan" || route.tone === "violet");
    const packets = [0, 3, 7, 12, 17].map((routeIndex, index) => { const route = activeRoutes[routeIndex % activeRoutes.length], tone: Tone = index === 3 ? "safe" : route.tone, dot = new THREE.Mesh(packetGeometry, meshMaterial(tone, .95, true)), ring = new THREE.Mesh(ringGeometry, meshMaterial(tone, 0, true)); world.add(dot); ring.position.copy(nodes[route.b].pos); world.add(ring); return { dot, ring, a: nodes[route.a].pos, b: nodes[route.b].pos, phase: index / 5, speed: .00012 + index * .000025 }; });
    const particleGeometry = new THREE.BufferGeometry(), particlePositions = new Float32Array(78 * 3), particleRandom = seeded(44190); for (let i = 0; i < particlePositions.length; i += 3) { particlePositions[i] = particleRandom() * 360 - 180; particlePositions[i + 1] = particleRandom() * 210 - 105; particlePositions[i + 2] = -160 + particleRandom() * 220; } particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3)); const particleMaterial = new THREE.PointsMaterial({ color: COLOR.cyan, size: 1.25, transparent: true, opacity: .17, depthWrite: false }); particleMaterial.userData.tone = "cyan"; materials.push(particleMaterial); const particles = new THREE.Points(particleGeometry, particleMaterial); world.add(particles);
    const applyTheme = () => { const styles = getComputedStyle(document.documentElement); const colors: Record<Tone, string> = { cyan: styles.getPropertyValue("--acid").trim(), violet: styles.getPropertyValue("--accent2").trim(), safe: styles.getPropertyValue("--go").trim(), warning: styles.getPropertyValue("--warn").trim() }; materials.forEach((item) => { const tone = item.userData.tone as Tone | undefined; if (!tone) return; const colored = item as THREE.MeshBasicMaterial | THREE.LineBasicMaterial | THREE.PointsMaterial; colored.color.set(colors[tone]); }); };
    applyTheme(); const themeObserver = new MutationObserver(applyTheme); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }, projected = new THREE.Vector3();
    const onPointerMove = (event: PointerEvent) => { if (event.pointerType !== "mouse" && event.pointerType !== "pen") return; const rect = hero.getBoundingClientRect(); pointer.tx = (event.clientX - rect.left) / rect.width * 2 - 1; pointer.ty = (event.clientY - rect.top) / rect.height * 2 - 1; }, onPointerLeave = () => { pointer.tx = 0; pointer.ty = 0; };
    hero.addEventListener("pointermove", onPointerMove, { passive: true }); hero.addEventListener("pointerleave", onPointerLeave, { passive: true });
    let inView = true; const observer = new IntersectionObserver((entries) => { inView = entries.some((entry) => entry.isIntersecting); }, { threshold: .1 }); observer.observe(hero);
    const resize = () => { const rect = host.getBoundingClientRect(), width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height)); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }; const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); let dprQuery: MediaQueryList | null = null; const watchDpr = () => { dprQuery?.removeEventListener("change", watchDpr); dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`); dprQuery.addEventListener("change", watchDpr); resize(); }; window.visualViewport?.addEventListener("resize", resize); watchDpr();
    let cancelled = false, rafId = 0; const clock = new THREE.Clock(), onContextLost = (event: Event) => { event.preventDefault(); cancelled = true; setBroken(true); }; renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    const frame = () => { if (cancelled) return; rafId = requestAnimationFrame(frame); if (!inView || tabHiddenRef.current) { clock.getDelta(); return; } const dt = Math.min(clock.getDelta(), .05), time = clock.elapsedTime; pointer.x += (pointer.tx - pointer.x) * .045; pointer.y += (pointer.ty - pointer.y) * .045; heroSection.style.setProperty("--pointer-x", pointer.x.toFixed(3)); heroSection.style.setProperty("--pointer-y", pointer.y.toFixed(3)); camera.position.x = 16 + Math.sin(time * .035) * 7 + pointer.x * 13; camera.position.y = -4 + Math.cos(time * .03) * 5 - pointer.y * 9; camera.lookAt(0, -8, 0); world.rotation.y = pointer.x * .035; world.rotation.x = pointer.y * .018; boundary.rotation.y += dt * .075; boundary.rotation.x += dt * .022; scan.rotation.z += dt * .13; particles.position.y = time * -2.2 % 20 - 10;
      nodes.forEach((node, index) => { projected.copy(node.pos).project(camera); const near = Math.max(0, 1 - Math.hypot(projected.x - pointer.x, projected.y - pointer.y) / .42); glows[index].scale.setScalar(1 + near * .75); (glows[index].material as THREE.MeshBasicMaterial).opacity = (node.tone === "cyan" ? .1 : .07) + near * .26; nodeMeshes[index].scale.setScalar(1 + near * .3); }); packets.forEach((packet, index) => { packet.phase = (packet.phase + packet.speed * dt * 1000) % 1; packet.dot.position.lerpVectors(packet.a, packet.b, packet.phase); const arrival = Math.max(0, 1 - Math.abs(packet.phase - .96) / .04); packet.ring.scale.setScalar(1 + arrival * 4.5); (packet.ring.material as THREE.MeshBasicMaterial).opacity = arrival * .34; if (index === 1) (routeLines.get("cyan")!.material as THREE.LineBasicMaterial).opacity = .29 + Math.max(0, 1 - Math.abs(packet.phase - .5) / .28) * .23; }); (routeLines.get("violet")!.material as THREE.LineBasicMaterial).opacity = .18 + Math.max(0, Math.sin(time * .18)) * .16; renderer.render(scene, camera); };
    rafId = requestAnimationFrame(frame); setReady(true);
    return () => { cancelled = true; cancelAnimationFrame(rafId); observer.disconnect(); themeObserver.disconnect(); resizeObserver.disconnect(); dprQuery?.removeEventListener("change", watchDpr); window.visualViewport?.removeEventListener("resize", resize); hero.removeEventListener("pointermove", onPointerMove); hero.removeEventListener("pointerleave", onPointerLeave); renderer.domElement.removeEventListener("webglcontextlost", onContextLost); heroSection.style.removeProperty("--pointer-x"); heroSection.style.removeProperty("--pointer-y"); [core.geometry, inner.geometry, scan.geometry, nodeGeometry, glowGeometry, ringGeometry, packetGeometry, particleGeometry, grid.geometry, ticks.geometry, ...Array.from(routeLines.values()).map((line) => line.geometry)].forEach((item) => item.dispose()); materials.forEach((item) => item.dispose()); renderer.dispose(); renderer.domElement.remove(); };
  }, [containerRef]);
  return <div ref={hostRef} className="hero-webgl-host" aria-hidden="true" data-state={broken ? "broken" : ready ? "ready" : "loading"} />;
}
