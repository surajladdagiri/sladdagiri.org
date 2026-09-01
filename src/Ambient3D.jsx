import { useEffect, useRef } from "react";

/* A subtle, fixed full-viewport 3D backdrop that sits behind page content.
   `variant="particles"` is a drifting point field; `variant="network"` adds
   faint lines between nearby points (a constellation). Reacts to scroll and the
   mouse. pointer-events none, low opacity, so it never fights readability.
   Three.js is imported dynamically. Reduced motion renders a single frame.

   Place as the first child of a page whose root background is transparent, and
   give the page's content wrapper position:relative; zIndex:1 so it sits on top. */
export default function Ambient3D({
  color = "#ff6b35",
  color2 = "#ffc93c",
  variant = "particles",
  opacity = 0.5,
}) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let disposed = false;
    const cleanups = [];

    (async () => {
      let THREE;
      try {
        THREE = await import("three");
      } catch {
        return;
      }
      if (disposed || !wrapRef.current) return;

      const width = () => window.innerWidth;
      const height = () => window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width() / height(), 0.1, 100);
      camera.position.z = 9;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width(), height());
      renderer.setClearColor(0x000000, 0);
      wrap.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";

      const disposables = [];
      const isNet = variant === "network";
      const N = isNet ? 150 : 1100;

      const pos = new Float32Array(N * 3);
      const spread = 16;
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread * 1.6;
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.7;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

      const cA = new THREE.Color(color);
      const cB = new THREE.Color(color2);
      const col = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const m = Math.random();
        col[i * 3] = cA.r + (cB.r - cA.r) * m;
        col[i * 3 + 1] = cA.g + (cB.g - cA.g) * m;
        col[i * 3 + 2] = cA.b + (cB.b - cA.b) * m;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

      const ptMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: isNet ? 0.12 : 0.05,
        transparent: true,
        opacity: isNet ? 0.9 : 0.85,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, ptMat);
      const group = new THREE.Group();
      group.add(points);
      disposables.push(geo, ptMat);

      if (isNet) {
        // connect nearby points with faint lines
        const segs = [];
        const maxD = 3.2;
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            const dx = pos[i * 3] - pos[j * 3];
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
            if (dx * dx + dy * dy + dz * dz < maxD * maxD) {
              segs.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
            }
          }
        }
        const lgeo = new THREE.BufferGeometry();
        lgeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs), 3));
        const lmat = new THREE.LineBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.14,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        group.add(new THREE.LineSegments(lgeo, lmat));
        disposables.push(lgeo, lmat);
      }

      scene.add(group);

      const mouse = { x: 0, y: 0 };
      const onMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      cleanups.push(() => window.removeEventListener("mousemove", onMove));

      const onResize = () => {
        camera.aspect = width() / height();
        camera.updateProjectionMatrix();
        renderer.setSize(width(), height());
        renderer.render(scene, camera);
      };
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));

      if (reduce) {
        group.rotation.set(0.1, 0.2, 0);
        renderer.render(scene, camera);
        return;
      }

      const clock = new THREE.Clock();
      const tick = () => {
        if (disposed) return;
        if (document.hidden) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const t = clock.getElapsedTime();
        const sy = window.scrollY || 0;
        group.rotation.y = t * 0.03 + mouse.x * 0.2;
        group.rotation.x = mouse.y * 0.12 + sy * 0.00035;
        group.position.y = sy * 0.0016; // gentle parallax drift with scroll
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.03;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        disposables.forEach((d) => d.dispose && d.dispose());
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      });
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
    };
  }, [color, color2, variant]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity }}
    />
  );
}
