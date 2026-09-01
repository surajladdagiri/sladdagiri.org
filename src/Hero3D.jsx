import { useEffect, useRef } from "react";

// Full-frame WebGL hero. A large point cloud continuously morphs through a set
// of shapes on an autoplay loop, wrapped in a wide particle field that fills the
// whole viewport so there are no empty black gutters. Three.js is imported
// dynamically so Vite keeps it in a home-only chunk. Reduced motion renders
// nothing and the static hero underneath stands on its own.
export default function Hero3D({
  colorA = "#ff6b35",
  colorB = "#ffc93c",
  fieldColor = "#ffcf8a",
} = {}) {
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
      const camera = new THREE.PerspectiveCamera(55, width() / height(), 0.1, 100);
      camera.position.z = 5.4;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.setSize(width(), height());
      renderer.setClearColor(0x000000, 0);
      wrap.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";

      const disposables = [];

      // ---- shape targets: N points, each with a fixed identity (s,t) ----
      const N = 3200;
      const S = new Float32Array(N);
      const Tt = new Float32Array(N);
      const GA = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        S[i] = (i + 0.5) / N;
        Tt[i] = ((i * GA) % (2 * Math.PI)) / (2 * Math.PI);
      }
      const frac = (x) => x - Math.floor(x);

      const R = 2.15; // base radius so shapes fill a good chunk of the frame

      const makeSphere = () => {
        const a = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const theta = 2 * Math.PI * Tt[i];
          const phi = Math.acos(2 * S[i] - 1);
          a[i * 3] = R * Math.sin(phi) * Math.cos(theta);
          a[i * 3 + 1] = R * Math.cos(phi);
          a[i * 3 + 2] = R * Math.sin(phi) * Math.sin(theta);
        }
        return a;
      };
      const makeTorus = () => {
        const R1 = R * 0.72, R2 = R * 0.3;
        const a = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const u = 2 * Math.PI * S[i];
          const v = 2 * Math.PI * Tt[i];
          a[i * 3] = (R1 + R2 * Math.cos(v)) * Math.cos(u);
          a[i * 3 + 1] = R2 * Math.sin(v);
          a[i * 3 + 2] = (R1 + R2 * Math.cos(v)) * Math.sin(u);
        }
        return a;
      };
      const makeCube = () => {
        const H = R * 0.72;
        const a = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const face = Math.floor(Tt[i] * 6) % 6;
          const p = (S[i] * 2 - 1) * H;
          const q = (frac(Tt[i] * 6) * 2 - 1) * H;
          let x = 0, y = 0, z = 0;
          if (face === 0) { x = H; y = p; z = q; }
          else if (face === 1) { x = -H; y = p; z = q; }
          else if (face === 2) { x = p; y = H; z = q; }
          else if (face === 3) { x = p; y = -H; z = q; }
          else if (face === 4) { x = p; y = q; z = H; }
          else { x = p; y = q; z = -H; }
          a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
        }
        return a;
      };
      const makeHelix = () => {
        const rad = R * 0.62, hgt = R * 1.9, turns = 3;
        const a = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const strand = Tt[i] < 0.5 ? 0 : 1;
          const along = S[i];
          const ang = along * turns * 2 * Math.PI + strand * Math.PI;
          a[i * 3] = rad * Math.cos(ang);
          a[i * 3 + 1] = (along - 0.5) * hgt;
          a[i * 3 + 2] = rad * Math.sin(ang);
        }
        return a;
      };
      const makeKnot = () => {
        const sc = R * 0.5, tube = R * 0.16;
        const a = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
          const phi = 2 * Math.PI * S[i];
          const rr = 2 + Math.cos(3 * phi);
          const cx = sc * rr * Math.cos(2 * phi);
          const cy = sc * rr * Math.sin(2 * phi);
          const cz = sc * Math.sin(3 * phi) * 1.6;
          const ta = 2 * Math.PI * Tt[i];
          a[i * 3] = cx + tube * Math.cos(ta) * Math.cos(2 * phi);
          a[i * 3 + 1] = cy + tube * Math.cos(ta) * Math.sin(2 * phi);
          a[i * 3 + 2] = cz + tube * Math.sin(ta);
        }
        return a;
      };

      const SHAPES = [makeSphere(), makeKnot(), makeTorus(), makeCube(), makeHelix()];
      const L = SHAPES.length;

      // ---- morphing centerpiece cloud ----
      const geo = new THREE.BufferGeometry();
      const posArr = new Float32Array(N * 3);
      posArr.set(SHAPES[0]);
      geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
      const posAttr = geo.getAttribute("position");

      const cA = new THREE.Color(colorA);
      const cB = new THREE.Color(colorB);
      const colArr = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const m = S[i];
        colArr[i * 3] = cA.r + (cB.r - cA.r) * m;
        colArr[i * 3 + 1] = cA.g + (cB.g - cA.g) * m;
        colArr[i * 3 + 2] = cA.b + (cB.b - cA.b) * m;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(colArr, 3));

      const cloudMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.03,
        transparent: true,
        opacity: 0.95,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const cloud = new THREE.Points(geo, cloudMat);
      const group = new THREE.Group();
      group.add(cloud);
      scene.add(group);
      disposables.push(geo, cloudMat);

      const smooth = (x) => x * x * (3 - 2 * x);
      const applyMorph = (idx, next, e) => {
        const A = SHAPES[idx];
        const B = SHAPES[next];
        const arr = posAttr.array;
        for (let i = 0; i < N * 3; i++) arr[i] = A[i] + (B[i] - A[i]) * e;
        posAttr.needsUpdate = true;
      };


      // ---- interaction ----
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
      };
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));

      const HOLD = 2.4; // seconds a shape is held before morphing to the next
      const clock = new THREE.Clock();
      const tick = () => {
        if (disposed) return;
        if (document.hidden) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const t = clock.getElapsedTime();

        // autoplay morph loop through all shapes
        const phase = t / HOLD;
        const idx = Math.floor(phase) % L;
        const next = (idx + 1) % L;
        applyMorph(idx, next, smooth(frac(phase)));

        group.rotation.y = t * 0.16;
        group.rotation.x += (mouse.y * 0.3 - group.rotation.x) * 0.04;
        group.rotation.z = Math.sin(t * 0.25) * 0.08;
        const s = 1 + Math.sin(t * 0.7) * 0.02;
        group.scale.setScalar(s);


        camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.04;
        camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.04;
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
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  );
}
