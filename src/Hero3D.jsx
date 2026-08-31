import { useEffect, useRef } from "react";

// Interactive WebGL hero. Three.js is imported dynamically, so Vite code-splits
// it into its own chunk that loads only on the home page, never in the main
// bundle. If the user prefers reduced motion, this renders nothing and the
// static hero underneath stands on its own.
export default function Hero3D() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const wrap = wrapRef.current;
    if (!wrap) return;

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

      const width = () => wrap.clientWidth || window.innerWidth;
      const height = () => wrap.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width() / height(), 0.1, 100);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setSize(width(), height());
      renderer.setClearColor(0x000000, 0);
      wrap.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";

      const disposables = [];

      // --- core object: violet wireframe + teal point shell + faint mass ---
      const group = new THREE.Group();
      scene.add(group);

      const wireGeo = new THREE.IcosahedronGeometry(1.7, 1);
      const wireLineGeo = new THREE.WireframeGeometry(wireGeo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x7c6cff, transparent: true, opacity: 0.55 });
      group.add(new THREE.LineSegments(wireLineGeo, wireMat));
      disposables.push(wireGeo, wireLineGeo, wireMat);

      const ptsGeo = new THREE.IcosahedronGeometry(1.95, 4);
      const ptsMat = new THREE.PointsMaterial({ color: 0x4dd6c4, size: 0.02, transparent: true, opacity: 0.9, sizeAttenuation: true });
      group.add(new THREE.Points(ptsGeo, ptsMat));
      disposables.push(ptsGeo, ptsMat);

      const coreGeo = new THREE.IcosahedronGeometry(1.55, 1);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x7c6cff, transparent: true, opacity: 0.06 });
      group.add(new THREE.Mesh(coreGeo, coreMat));
      disposables.push(coreGeo, coreMat);

      // --- outer shell: a big, dim starfield that counter-rotates for depth ---
      const N = 900;
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        // random point on a sphere, radius 3.2 to 4.6
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 3.2 + Math.random() * 1.4;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      const shellGeo = new THREE.BufferGeometry();
      shellGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const shellMat = new THREE.PointsMaterial({ color: 0xb9b4ff, size: 0.014, transparent: true, opacity: 0.5, sizeAttenuation: true });
      const shell = new THREE.Points(shellGeo, shellMat);
      scene.add(shell);
      disposables.push(shellGeo, shellMat);

      // --- interaction state ---
      const mouse = { x: 0, y: 0 };
      let pop = 0; // click impulse, eases back to 0

      const onMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      };
      const onClick = () => { pop = 1; };
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("pointerdown", onClick, { passive: true });
      cleanups.push(() => window.removeEventListener("mousemove", onMove));
      cleanups.push(() => window.removeEventListener("pointerdown", onClick));

      const onResize = () => {
        camera.aspect = width() / height();
        camera.updateProjectionMatrix();
        renderer.setSize(width(), height());
      };
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));

      const onScroll = () => {
        const h = height() || 1;
        wrap.style.opacity = String(Math.max(0, 1 - window.scrollY / (h * 0.9)));
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));

      const clock = new THREE.Clock();
      const tick = () => {
        if (disposed) return;
        if (document.hidden) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const t = clock.getElapsedTime();
        pop *= 0.92; // decay the click impulse

        group.rotation.y += 0.0016 + pop * 0.05;
        group.rotation.x += (mouse.y * 0.4 - group.rotation.x) * 0.04;
        group.rotation.y += (mouse.x * 0.25) * 0.002;
        const s = 1 + Math.sin(t * 0.8) * 0.03 + pop * 0.12;
        group.scale.setScalar(s);
        group.position.y = Math.sin(t * 0.6) * 0.08;

        shell.rotation.y -= 0.0006;
        shell.rotation.x += 0.0002;

        camera.position.x += (mouse.x * 0.7 - camera.position.x) * 0.04;
        camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.04;
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
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        transition: "opacity 300ms ease",
      }}
    />
  );
}
