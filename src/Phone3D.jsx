import { useEffect, useRef } from "react";

/* A realistic floating 3D iPhone with PBR materials, an environment map for real
   reflections, a titanium rim + side buttons, rounded glass screen with a sheen,
   and a rear camera module.

   Two modes:
   - default: the phone floats, auto-rotates, and reacts to mouse + scroll.
   - showcase: driven by scroll progress from an ancestor [data-phone-track].
     The phone slides in from the left, then turns to swap through `screenshots`
     one at a time (the texture changes while it is edge-on), holding on each.

   Three.js is imported dynamically. Reduced motion renders a single frame. */
export default function Phone3D({
  screenshot,
  screenshots = [],
  showcase = false,
  autoCycle = false,
  label = "",
  sub = "",
  accent = "#ff6b35",
  accent2 = "#ffc93c",
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

      const width = () => wrap.clientWidth || 360;
      const height = () => wrap.clientHeight || 480;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, width() / height(), 0.1, 100);
      camera.position.set(0, 0, 4.8);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width(), height());
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.86;
      wrap.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";

      const disposables = [];
      const smooth = (x) => x * x * (3 - 2 * x);
      const clamp01 = (x) => Math.min(1, Math.max(0, x));

      // ---- environment map for realistic reflections ----
      let envTex = null;
      try {
        const { RoomEnvironment } = await import(
          "three/examples/jsm/environments/RoomEnvironment.js"
        );
        const pmrem = new THREE.PMREMGenerator(renderer);
        envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTex;
        pmrem.dispose();
      } catch {
        /* lights still give a decent look */
      }

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 0.95);
      key.position.set(-2, 3, 4);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.35);
      fill.position.set(3, -1, 2);
      scene.add(fill);
      const rim = new THREE.PointLight(0xffffff, 0.18, 40);
      rim.position.set(3, 1, 2.5);
      scene.add(rim);

      const roundedRect = (w, h, r) => {
        const s = new THREE.Shape();
        const x = -w / 2, y = -h / 2;
        s.moveTo(x + r, y);
        s.lineTo(x + w - r, y);
        s.quadraticCurveTo(x + w, y, x + w, y + r);
        s.lineTo(x + w, y + h - r);
        s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        s.lineTo(x + r, y + h);
        s.quadraticCurveTo(x, y + h, x, y + h - r);
        s.lineTo(x, y + r);
        s.quadraticCurveTo(x, y, x + r, y);
        return s;
      };
      const roundedPlane = (w, h, r) => {
        const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 24);
        g.computeBoundingBox();
        const bb = g.boundingBox;
        const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y;
        const p = g.attributes.position;
        const uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) {
          uv[i * 2] = (p.getX(i) - bb.min.x) / sx;
          uv[i * 2 + 1] = (p.getY(i) - bb.min.y) / sy;
        }
        g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        return g;
      };

      const W = 1.34, H = 2.88, DEPTH = 0.085, BEV = 0.022, RAD = 0.3;

      const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(W, H, RAD), {
        depth: DEPTH, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV,
        bevelSegments: 4, curveSegments: 24,
      });
      bodyGeo.center();
      // matte, modern natural-titanium look (not glossy / cartoony)
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0a0a0e, metalness: 0.0, roughness: 0.55, clearcoat: 0.12,
        clearcoatRoughness: 0.6, envMapIntensity: 0.3,
      });
      const titaniumMat = new THREE.MeshStandardMaterial({
        color: 0x83868c, metalness: 1, roughness: 0.7, envMapIntensity: 0.4,
      });
      const body = new THREE.Mesh(bodyGeo, [glassMat, titaniumMat]);
      disposables.push(bodyGeo, glassMat, titaniumMat);

      const frontZ = DEPTH / 2 + BEV;
      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      // ---- build the list of screen textures ----
      const texList = [];
      const loader = new THREE.TextureLoader();
      const addImg = (url) => {
        const tx = loader.load(url, () => renderOnce());
        tx.colorSpace = THREE.SRGBColorSpace;
        tx.anisotropy = maxAniso;
        texList.push(tx);
        disposables.push(tx);
      };
      if (screenshots && screenshots.length) screenshots.forEach(addImg);
      else if (screenshot) addImg(screenshot);
      else {
        const cw = 512, ch = 1100;
        const cv = document.createElement("canvas");
        cv.width = cw; cv.height = ch;
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#0b0b12"; ctx.fillRect(0, 0, cw, ch);
        const g = ctx.createRadialGradient(cw * 0.5, ch * 0.34, 30, cw * 0.5, ch * 0.34, ch * 0.62);
        g.addColorStop(0, accent);
        g.addColorStop(0.45, "rgba(255,107,53,0.28)");
        g.addColorStop(1, "rgba(11,11,18,0)");
        ctx.globalAlpha = 0.75; ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch); ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "500 26px -apple-system, system-ui, sans-serif";
        ctx.fillText("9:41", 40, 62);
        ctx.fillStyle = "#f6f3ec";
        ctx.font = "700 82px 'Space Grotesk', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label || "", cw / 2, ch * 0.5);
        if (sub) {
          ctx.fillStyle = "rgba(246,243,236,0.72)";
          ctx.font = "400 34px 'Inter', system-ui, sans-serif";
          ctx.fillText(sub, cw / 2, ch * 0.5 + 58);
        }
        ctx.textAlign = "left";
        for (let i = 0; i < 4; i++) {
          const y = ch * 0.66 + i * 76;
          ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(48, y, cw - 96, 52);
          ctx.fillStyle = i === 0 ? accent2 : "rgba(255,255,255,0.32)"; ctx.fillRect(48, y, 10, 52);
        }
        const t = new THREE.CanvasTexture(cv);
        t.colorSpace = THREE.SRGBColorSpace;
        texList.push(t); disposables.push(t);
      }

      const screenGeo = roundedPlane(W - 0.16, H - 0.16, RAD - 0.08);
      const screenMat = new THREE.MeshBasicMaterial({ map: texList[0], toneMapped: false });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.z = frontZ + 0.006;
      disposables.push(screenGeo, screenMat);
      const setTex = (i) => {
        const t = texList[Math.max(0, Math.min(texList.length - 1, i))];
        if (t && screenMat.map !== t) { screenMat.map = t; screenMat.needsUpdate = true; }
      };

      // glass sheen
      const sheenCv = document.createElement("canvas");
      sheenCv.width = 256; sheenCv.height = 512;
      const sctx = sheenCv.getContext("2d");
      const sg = sctx.createLinearGradient(0, 0, 256, 512);
      sg.addColorStop(0, "rgba(255,255,255,0.16)");
      sg.addColorStop(0.35, "rgba(255,255,255,0.03)");
      sg.addColorStop(0.5, "rgba(255,255,255,0)");
      sctx.fillStyle = sg; sctx.fillRect(0, 0, 256, 512);
      const sheenTex = new THREE.CanvasTexture(sheenCv);
      const sheenMat = new THREE.MeshBasicMaterial({
        map: sheenTex, transparent: true, opacity: 0.04,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      });
      const sheenGeo = roundedPlane(W - 0.16, H - 0.16, RAD - 0.08);
      const sheen = new THREE.Mesh(sheenGeo, sheenMat);
      sheen.position.z = frontZ + 0.008;
      disposables.push(sheenTex, sheenMat, sheenGeo);

      const islandGeo = roundedPlane(0.38, 0.11, 0.055);
      const islandMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const island = new THREE.Mesh(islandGeo, islandMat);
      island.position.set(0, H / 2 - 0.22, frontZ + 0.012);
      disposables.push(islandGeo, islandMat);

      // rear camera module
      const backZ = -frontZ;
      const camGroup = new THREE.Group();
      const plateGeo = new THREE.ExtrudeGeometry(roundedRect(0.62, 0.62, 0.16), {
        depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 12,
      });
      plateGeo.center();
      const plateMat = new THREE.MeshPhysicalMaterial({ color: 0x121218, metalness: 0.3, roughness: 0.3, clearcoat: 0.6, envMapIntensity: 1 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.rotation.y = Math.PI;
      plate.position.set(-W / 2 + 0.44, H / 2 - 0.5, backZ - 0.03);
      camGroup.add(plate);
      disposables.push(plateGeo, plateMat);
      const lensGlass = new THREE.MeshPhysicalMaterial({ color: 0x05050a, metalness: 0.2, roughness: 0.28, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.4 });
      const lensRing = new THREE.MeshStandardMaterial({ color: 0x33333b, metalness: 1, roughness: 0.62, envMapIntensity: 0.4 });
      for (const [lx, ly] of [[-0.12, 0.12], [0.12, 0.12], [0, -0.12]]) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.06, 24), lensRing);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(-W / 2 + 0.44 + lx, H / 2 - 0.5 + ly, backZ - 0.06);
        const glass = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), lensGlass);
        glass.position.set(-W / 2 + 0.44 + lx, H / 2 - 0.5 + ly, backZ - 0.095);
        glass.rotation.y = Math.PI;
        camGroup.add(ring, glass);
      }
      disposables.push(lensGlass, lensRing);

      // side buttons
      const btnMat = new THREE.MeshStandardMaterial({ color: 0x83868c, metalness: 1, roughness: 0.7, envMapIntensity: 0.4 });
      const sideX = W / 2 + BEV - 0.01;
      const mkBtn = (h, x, y) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, 0.1), btnMat);
        m.position.set(x, y, 0);
        return m;
      };
      disposables.push(btnMat);

      const phone = new THREE.Group();
      phone.add(
        body, screen, sheen, island, camGroup,
        mkBtn(0.52, sideX, 0.28), mkBtn(0.34, -sideX, 0.5), mkBtn(0.34, -sideX, 0.1), mkBtn(0.18, -sideX, 0.86)
      );
      phone.rotation.x = -0.05;
      scene.add(phone);

      const mouse = { x: 0, y: 0 };
      const onMove = (e) => {
        const r = wrap.getBoundingClientRect();
        mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      cleanups.push(() => window.removeEventListener("mousemove", onMove));

      const onResize = () => {
        camera.aspect = width() / height();
        camera.updateProjectionMatrix();
        renderer.setSize(width(), height());
        renderOnce();
      };
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));

      const track = showcase ? wrap.closest("[data-phone-track]") : null;
      const trackProgress = () => {
        if (!track) return 0;
        const r = track.getBoundingClientRect();
        const denom = r.height - window.innerHeight;
        return denom > 0 ? clamp01(-r.top / denom) : 0;
      };
      const inlineScroll = () => {
        const r = wrap.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        return Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / vh)) * 2;
      };

      function renderOnce() { renderer.render(scene, camera); }

      // showcase driver: phone is already in place; each transition is a full
      // 360 turn that swaps the screen to the next shot while it faces away.
      const driveShowcase = (p) => {
        const n = texList.length;
        phone.position.x = 0;
        phone.position.y = 0;
        phone.rotation.x = 0;                   // straight on, no tilt
        if (n <= 1) {
          phone.rotation.y = 0;
          setTex(0);
          return;
        }
        const slots = 2 * n - 1;               // hold, trans, hold, trans, ... hold
        const s = Math.min(slots - 1, Math.floor(p * slots));
        const local = p * slots - s;
        if (s % 2 === 0) {
          setTex(s / 2);
          phone.rotation.y = 0;                 // resting: face straight ahead
        } else {
          const i = (s - 1) / 2;
          setTex(local < 0.5 ? i : i + 1);      // swap while turned away (~180)
          phone.rotation.y = smooth(local) * Math.PI * 2; // full spin
        }
      };

      if (reduce) {
        phone.position.x = 0;
        phone.rotation.set(0, 0, 0);           // straight on
        setTex(0);
        renderOnce();
        return;
      }

      const clock = new THREE.Clock();
      const tick = () => {
        if (disposed) return;
        if (document.hidden) { raf = requestAnimationFrame(tick); return; }
        const t = clock.getElapsedTime();
        if (showcase) {
          driveShowcase(trackProgress());
        } else if (autoCycle && texList.length > 1) {
          // hold each screen, then a full 360 turn that swaps to the next
          // screenshot while the phone faces away
          const HOLD = 3.2, SPIN = 1.5, period = HOLD + SPIN;
          const n = texList.length;
          const k = Math.floor(t / period);
          const local = t - k * period;
          const idx = k % n;
          if (local < HOLD) {
            setTex(idx);
            phone.rotation.y = Math.sin(t * 0.5) * 0.08 + mouse.x * 0.15;
          } else {
            const f = smooth((local - HOLD) / SPIN);
            setTex(f < 0.5 ? idx : (idx + 1) % n);
            phone.rotation.y = f * Math.PI * 2;
          }
          phone.rotation.x = mouse.y * 0.06;
          phone.position.y = Math.sin(t * 0.7) * 0.03;
        } else {
          // face straight ahead, only a subtle sway + mouse parallax
          phone.rotation.y = Math.sin(t * 0.5) * 0.1 + mouse.x * 0.18;
          phone.rotation.x = mouse.y * 0.08;
          phone.position.y = Math.sin(t * 0.7) * 0.04;
          setTex(0);
        }
        rim.position.x = Math.cos(t * 0.5) * 2.8;
        rim.position.y = Math.sin(t * 0.5) * 1.4 + 0.6;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        disposables.forEach((d) => d.dispose && d.dispose());
        if (envTex) envTex.dispose();
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
  }, [screenshot, JSON.stringify(screenshots), showcase, autoCycle, label, sub, accent, accent2]);

  return (
    <div ref={wrapRef} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
  );
}
