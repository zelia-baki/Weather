import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import axiosInstance from '../../axiosInstance';

// =============================================================================
//  src/components/Shop/ShopLanding.jsx — "The journey of one cherry"
//
//  One object, centre stage, studio-lit on cream. As the visitor scrolls it
//  becomes the next thing it would become in real life:
//
//      cherry  →  green bean  →  roasted bean  →  cup
//
//  Each stage brings its own proof panel (plot, canopy check, grade, cup score)
//  so the spectacle always carries a selling argument.
//
//  Raw three.js, no model file. Studio reflections come from RoomEnvironment,
//  which ships with three — nothing to download.
//
//  Sections: 1 tokens · 2 objects · 3 three.js lifecycle · 4 UI atoms · 5 page
// =============================================================================

// ── 1. Tokens ────────────────────────────────────────────────────────────────
const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const LINE = 'rgba(20,35,26,0.12)';

const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };
const mono = { fontFamily: "'JetBrains Mono', monospace" };

const STAGES = [
  {
    key: 'cherry',
    eyebrow: 'Stage one · On the branch',
    title: 'It starts as a fruit.',
    body: 'Picked ripe, by hand, on a plot whose boundary we hold as GPS coordinates. Nothing around it was cleared to make room.',
    facts: [['Plot', 'geolocated'], ['Canopy 2020', 'intact'], ['Picking', 'selective, by hand']],
  },
  {
    key: 'green',
    eyebrow: 'Stage two · After the wash',
    title: 'Inside, two green seeds.',
    body: 'Pulped, fermented and dried on raised beds. Moisture is measured before the lot is accepted — out of range, and it does not travel.',
    facts: [['Moisture', '10.5 – 12 %'], ['Drying', 'raised beds'], ['Screening', 'by size and defect']],
  },
  {
    key: 'roast',
    eyebrow: 'Stage three · Under the heat',
    title: 'Twelve minutes change everything.',
    body: 'The roast is the only step where the farmer is not in the room — which is why everything before it is documented.',
    facts: [['Profile', 'medium'], ['Rest', '7 days'], ['Batch', 'traceable to lot']],
  },
  {
    key: 'cup',
    eyebrow: 'Stage four · In the cup',
    title: 'And the forest is still standing.',
    body: 'That is the whole promise. Every lot in the shop carries the record that proves it.',
    facts: [['EUDR', 'due diligence filed'], ['Forest lost', '0 ha'], ['Traceable', 'to the plot']],
  },
];

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const qualityTier = () => {
  if (typeof window === 'undefined') return 'low';
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'static';
  const cores = navigator.hardwareConcurrency || 4;
  if (window.innerWidth < 760 || cores <= 4) return 'low';
  return 'high';
};

// ── 2. The four objects ──────────────────────────────────────────────────────

/** Ripe coffee cherry: glossy skin, small stem, a hint of a crease. */
const buildCherry = () => {
  const group = new THREE.Group();

  const skin = new THREE.MeshPhysicalMaterial({
    color: 0xc4241c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12,
    sheen: 0.5, sheenColor: new THREE.Color(0xff8a7a),
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), skin);
  body.scale.set(1, 1.12, 1);
  group.add(body);

  // The dimple where the flower was.
  const dimple = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x5a1109, roughness: 0.8 }),
  );
  dimple.position.set(0, -1.08, 0);
  group.add(dimple);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 0.75, 10),
    new THREE.MeshStandardMaterial({ color: 0x4c6b2a, roughness: 0.75 }),
  );
  stem.position.set(0.05, 1.42, 0);
  stem.rotation.z = 0.22;
  group.add(stem);

  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 12),
    new THREE.MeshStandardMaterial({ color: 0x3f7a36, roughness: 0.6, side: THREE.DoubleSide }),
  );
  leaf.scale.set(1, 0.08, 0.45);
  leaf.position.set(0.42, 1.68, 0);
  leaf.rotation.set(0, 0.4, -0.5);
  group.add(leaf);

  return group;
};

/** Green bean: flat-bottomed oval with the signature centre cut. */
const buildBean = (roasted) => {
  const group = new THREE.Group();

  const material = roasted
    ? new THREE.MeshPhysicalMaterial({
        color: 0x4a2612, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.4,
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0x9bab62, roughness: 0.62, clearcoat: 0.18,
      });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), material);
  body.scale.set(1, 1.32, 0.68);
  group.add(body);

  // The centre cut: a dark groove carved by a flattened torus.
  const cut = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.1, 10, 40, Math.PI * 1.1),
    new THREE.MeshStandardMaterial({ color: roasted ? 0x2a1407 : 0x6f7f45, roughness: 0.9 }),
  );
  cut.scale.set(1, 1.5, 0.3);
  cut.position.z = 0.62;
  cut.rotation.z = Math.PI / 2 - 0.55;
  group.add(cut);

  const cutBack = cut.clone();
  cutBack.position.z = -0.62;
  group.add(cutBack);

  return group;
};

/** Ceramic cup, turned on a lathe, with a dark surface of coffee. */
const buildCup = () => {
  const group = new THREE.Group();

  const profile = [];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // A soft bell: wide at the rim, tucked in at the foot.
    const radius = 0.52 + Math.pow(t, 1.5) * 0.62;
    profile.push(new THREE.Vector2(radius, t * 1.5 - 0.75));
  }
  profile.push(new THREE.Vector2(1.08, 0.78));          // rim thickness
  profile.push(new THREE.Vector2(1.0, 0.74));
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    profile.push(new THREE.Vector2((0.52 + Math.pow(t, 1.5) * 0.62) - 0.07, t * 1.5 - 0.72));
  }

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xf3efe6, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.15,
    side: THREE.DoubleSide,
  });
  const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), ceramic);
  group.add(cup);

  const saucer = new THREE.Mesh(
    new THREE.CylinderGeometry(1.65, 1.5, 0.1, 64),
    ceramic,
  );
  saucer.position.y = -0.82;
  group.add(saucer);

  const liquid = new THREE.Mesh(
    new THREE.CircleGeometry(1.02, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x331a0c, roughness: 0.08, metalness: 0.15, clearcoat: 1,
    }),
  );
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 0.58;
  group.add(liquid);

  // Crema ring: the detail that makes the cup read as real.
  const crema = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.01, 64),
    new THREE.MeshStandardMaterial({ color: 0xb98a4f, roughness: 0.8, transparent: true, opacity: 0.85 }),
  );
  crema.rotation.x = -Math.PI / 2;
  crema.position.y = 0.585;
  group.add(crema);

  return group;
};

/** Steam above the cup, and the burst released at each transformation. */
const buildParticles = (count, { size, color, opacity }) => {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = Math.random() * 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    seeds[i] = Math.random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size, map: texture, transparent: true, opacity, depthWrite: false, sizeAttenuation: true,
  }));
  points.userData.seeds = seeds;
  return points;
};

// ── 3. three.js lifecycle ────────────────────────────────────────────────────
const useProductScene = (mountRef, progressRef, onReady) => {
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const tier = qualityTier();
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.2, 8.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === 'low' ? 1.4 : 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Studio reflections: this is what separates "3D shape" from "product shot".
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const key = new THREE.DirectionalLight(0xfff6e8, 2.2);
    key.position.set(4, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe9ff, 0.8);
    fill.position.set(-6, 1, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.6);
    rim.position.set(-2, 3, -6);
    scene.add(rim);

    // The four objects live in one pivot; only one is visible at a time.
    const pivot = new THREE.Group();
    scene.add(pivot);

    const objects = [buildCherry(), buildBean(false), buildBean(true), buildCup()];
    objects.forEach((object, i) => {
      object.visible = i === 0;
      object.traverse(child => {
        if (child.material) {
          child.material.transparent = true;
          child.userData.baseOpacity = child.material.opacity ?? 1;
        }
      });
      pivot.add(object);
    });

    // Contact shadow: a soft dark ellipse under the object, nothing more.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    const sgrad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sgrad.addColorStop(0, 'rgba(20,35,26,0.38)');
    sgrad.addColorStop(1, 'rgba(20,35,26,0)');
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -2.1;
    shadow.scale.setScalar(0.55);
    scene.add(shadow);

    const steam = buildParticles(tier === 'low' ? 60 : 140, {
      size: 0.3, color: 'rgba(255,255,255,0.75)', opacity: 0,
    });
    steam.position.y = 1.2;
    scene.add(steam);

    const burst = buildParticles(tier === 'low' ? 70 : 160, {
      size: 0.14, color: 'rgba(169,120,79,0.95)', opacity: 0,
    });
    scene.add(burst);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointerMove = (event) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!mount.clientWidth) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frame;
    let elapsed = 0;
    let smoothed = 0;
    let intro = 0;
    let announced = false;
    let lastStage = 0;
    let burstLife = 0;

    const setOpacity = (object, value) => {
      object.traverse(child => {
        if (child.material) child.material.opacity = (child.userData.baseOpacity ?? 1) * value;
      });
    };

    const render = () => {
      frame = requestAnimationFrame(render);
      try {
        const delta = Math.min(clock.getDelta(), 0.05);
        elapsed += delta;

        intro = Math.min(1, intro + delta / 1.8);
        const introEase = 1 - Math.pow(1 - intro, 3);
        if (!announced && intro > 0.2) { announced = true; onReady?.(); }

        smoothed = lerp(smoothed, progressRef.current, 0.08);
        pointer.x = lerp(pointer.x, pointer.tx, 0.05);
        pointer.y = lerp(pointer.y, pointer.ty, 0.05);

        // Scroll maps onto four stages; the fraction inside a stage drives the
        // cross-fade, so one object is always dissolving into the next.
        const span = 1 / (STAGES.length - 1);
        const position = clamp01(smoothed) / span;
        const stage = Math.min(STAGES.length - 1, Math.floor(position));
        const blend = clamp01(position - stage);
        const next = Math.min(STAGES.length - 1, stage + 1);

        if (stage !== lastStage) { lastStage = stage; burstLife = 1; }

        objects.forEach((object, i) => {
          let visibility = 0;
          if (i === stage) visibility = 1 - blend;
          else if (i === next && next !== stage) visibility = blend;
          object.visible = visibility > 0.01;
          if (!object.visible) return;
          setOpacity(object, visibility * introEase);
          // The outgoing shape shrinks away, the incoming one grows in.
          const scale = lerp(0.72, 1, visibility) * lerp(0.86, 1, introEase);
          object.scale.setScalar(scale * (i === 3 ? 0.95 : 1));
          object.position.y = (1 - visibility) * (i === stage ? -0.35 : 0.35);
        });

        pivot.rotation.y = elapsed * 0.32 + pointer.x * 0.35;
        pivot.rotation.x = -0.08 + pointer.y * 0.14;
        pivot.position.y = Math.sin(elapsed * 0.9) * 0.08 + lerp(1.6, 0, introEase);

        shadow.material.opacity = 0.9 * introEase;
        shadow.scale.setScalar(0.55 + Math.sin(elapsed * 0.9) * 0.02);

        // Steam only above the cup.
        const steamStrength = stage === 3 ? blend * 0 + (stage === 3 ? 1 : 0) : (next === 3 ? blend : 0);
        steam.material.opacity = lerp(steam.material.opacity, steamStrength * 0.45, 0.05);
        if (steam.material.opacity > 0.01) {
          const array = steam.geometry.attributes.position.array;
          const seeds = steam.userData.seeds;
          for (let i = 0; i < seeds.length; i++) {
            array[i * 3 + 1] += (0.5 + (i % 4) * 0.12) * delta;
            array[i * 3] += Math.sin(elapsed * 1.2 + seeds[i]) * 0.004;
            if (array[i * 3 + 1] > 3.4) array[i * 3 + 1] = 0;
          }
          steam.geometry.attributes.position.needsUpdate = true;
        }

        // Burst released at each transformation.
        if (burstLife > 0) {
          burstLife = Math.max(0, burstLife - delta * 1.1);
          burst.material.opacity = burstLife * 0.8;
          burst.scale.setScalar(1 + (1 - burstLife) * 2.4);
          burst.rotation.y = elapsed * 0.6;
        } else {
          burst.material.opacity = 0;
        }

        camera.position.z = lerp(9.6, 8.4, introEase);
        renderer.render(scene, camera);
      } catch (err) {
        console.error('[ShopLanding] render failed:', err);
        cancelAnimationFrame(frame);
        onReady?.();
      }
    };

    if (tier === 'static') {
      renderer.render(scene, camera);
      onReady?.();
    } else {
      render();
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const list = Array.isArray(obj.material) ? obj.material : [obj.material];
          list.forEach(m => { m.map?.dispose(); m.dispose(); });
        }
      });
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [mountRef, progressRef, onReady]);
};

// ── 4. UI atoms ──────────────────────────────────────────────────────────────

/** Headline revealed word by word from behind a mask. */
const RevealTitle = ({ text, play, style }) => (
  <h1 style={{ ...style, margin: 0 }}>
    {text.split(' ').map((word, i) => (
      <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
        <span style={{
          display: 'inline-block',
          transform: play ? 'translateY(0)' : 'translateY(104%)',
          transition: `transform .9s cubic-bezier(.22,1,.36,1) ${i * 70}ms`,
        }}>
          {word}&nbsp;
        </span>
      </span>
    ))}
  </h1>
);

const PrimaryButton = ({ children, onClick, to }) => {
  const [hover, setHover] = useState(false);
  const style = {
    ...sans, display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '15px 30px', borderRadius: 100, border: 'none', cursor: 'pointer',
    fontSize: 13.5, fontWeight: 700, letterSpacing: 0.4, textDecoration: 'none',
    background: hover ? '#12a04a' : GREEN, color: '#f7faf5',
    boxShadow: `0 10px ${hover ? 34 : 20}px rgba(22,128,60,0.3)`,
    transform: hover ? 'translateY(-2px)' : 'none',
    transition: 'all .3s cubic-bezier(.4,0,.2,1)',
  };
  const handlers = {
    'data-hover': true,
    onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true), onBlur: () => setHover(false),
  };
  return to
    ? <Link to={to} style={style} {...handlers}>{children}</Link>
    : <button type="button" onClick={onClick} style={style} {...handlers}>{children}</button>;
};

/** Small dot cursor that grows over anything clickable. Desktop only. */
const Cursor = () => {
  const dot = useRef(null);
  const [enabled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches);

  useEffect(() => {
    if (!enabled) return undefined;
    let raf;
    const position = { x: -100, y: -100, tx: -100, ty: -100, scale: 1, tScale: 1 };

    const onMove = (event) => {
      position.tx = event.clientX;
      position.ty = event.clientY;
      position.tScale = event.target.closest?.('[data-hover], a, button') ? 2.6 : 1;
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      position.x = lerp(position.x, position.tx, 0.22);
      position.y = lerp(position.y, position.ty, 0.22);
      position.scale = lerp(position.scale, position.tScale, 0.18);
      if (dot.current) {
        dot.current.style.transform =
          `translate(${position.x}px, ${position.y}px) translate(-50%,-50%) scale(${position.scale})`;
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    loop();
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={dot} style={{
      position: 'fixed', top: 0, left: 0, width: 10, height: 10, borderRadius: '50%',
      border: `1px solid ${CLAY}`, background: 'rgba(169,120,79,0.18)',
      pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
    }}/>
  );
};

/** Very light film grain over the whole page: the cheapest premium cue there is. */
const Grain = () => (
  <div style={{
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, opacity: 0.045,
    mixBlendMode: 'multiply',
    backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>`
        .replace('%23', '#'),
    )}")`,
  }}/>
);

// ── Reveal on scroll ─────────────────────────────────────────────────────────
const useReveal = (delay = 0) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); observer.disconnect(); }
    }, { threshold: 0.18 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, {
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : 'translateY(26px)',
    transition: `opacity .9s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .9s cubic-bezier(.22,1,.36,1) ${delay}ms`,
  }];
};

/** Endless strip of lot attributes: movement without noise. */
const Marquee = ({ words }) => (
  <div style={{ overflow: 'hidden', borderTop: `1px solid ${LINE}`,
    borderBottom: `1px solid ${LINE}`, padding: '14px 0', margin: '0 0 56px' }}>
    <div style={{ display: 'flex', gap: 46, width: 'max-content', animation: 'nkMarquee 34s linear infinite' }}>
      {[...words, ...words].map((word, i) => (
        <span key={i} style={{ ...mono, fontSize: 11.5, letterSpacing: 2.4,
          textTransform: 'uppercase', color: i % 2 ? CLAY : 'rgba(20,35,26,0.42)',
          whiteSpace: 'nowrap' }}>
          {word}
        </span>
      ))}
    </div>
  </div>
);

/** Editorial lot card: image zoom, overlay on hover, index number, moving rule. */
/** Lot card: large image, generous white space, one quiet movement on hover. */
const LotCard = ({ lot, index }) => {
  const [hover, setHover] = useState(false);
  const [ref, reveal] = useReveal(index * 90);

  return (
    <Link ref={ref} to={`/shop/${lot.id}`} data-hover
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)} onBlur={() => setHover(false)}
      style={{ ...reveal, textDecoration: 'none', display: 'block' }}>

      {/* Image, no frame: the photograph is the card */}
      <div style={{ aspectRatio: '4 / 5', background: '#eee9de',
        overflow: 'hidden', borderRadius: 4 }}>
        {lot.images?.[0] ? (
          <img src={lot.images[0]} alt={lot.name} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              transform: hover ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 1.2s cubic-bezier(.22,1,.36,1)' }}/>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', ...serif, fontSize: 64, color: 'rgba(20,35,26,0.1)' }}>
            {lot.name?.[0] ?? 'N'}
          </div>
        )}
      </div>

      <div style={{ paddingTop: 18 }}>
        <div style={{ ...sans, fontSize: 11, letterSpacing: 1.6, color: CLAY,
          textTransform: 'uppercase', marginBottom: 8 }}>
          {lot.origin_country || lot.category}
        </div>

        <h3 style={{ ...serif, fontSize: 25, color: INK, fontWeight: 500,
          margin: 0, lineHeight: 1.15 }}>
          {lot.name}
        </h3>

        <div style={{ ...mono, fontSize: 14, color: 'rgba(20,35,26,0.7)', marginTop: 10 }}>
          {Number(lot.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          <span style={{ fontSize: 11.5, color: 'rgba(20,35,26,0.45)' }}> {lot.currency} / {lot.unit}</span>
        </div>
      </div>
    </Link>
  );
};

// ── 5. Page ──────────────────────────────────────────────────────────────────
const ShopLanding = () => {
  const mountRef = useRef(null);
  const progressRef = useRef(0);
  const sceneRef = useRef(null);
  const navigate = useNavigate();

  const [lots, setLots] = useState([]);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  const handleReady = useCallback(() => setReady(true), []);
  useProductScene(mountRef, progressRef, handleReady);

  useEffect(() => {
    axiosInstance.get('/api/ecommerce/products')
      .then(res => setLots(res.data ?? []))
      .catch(() => setLots([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 4000);   // never a blank screen
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const node = sceneRef.current;
      if (!node) return;
      const travel = node.offsetHeight - window.innerHeight;
      const value = clamp01(-node.getBoundingClientRect().top / Math.max(travel, 1));
      progressRef.current = value;
      setProgress(value);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const span = 1 / (STAGES.length - 1);
  const rawStage = clamp01(progress) / span;
  const stageIndex = Math.min(STAGES.length - 1, Math.round(rawStage));
  const stage = STAGES[stageIndex];

  return (
    <div style={{ background: BG, cursor: 'auto' }}>
      <Grain />
      <Cursor />

      {/* ── Stage: the object and its proof panel ───────────────────── */}
      <section ref={sceneRef} style={{ height: '420vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: BG }}>

          {/* Warm pool of light behind the object */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 55% at 50% 42%, rgba(255,247,232,0.95) 0%, rgba(247,244,238,0) 70%)',
          }}/>

          <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />

          {/* Opening curtain */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 8, background: BG,
            opacity: ready ? 0 : 1, pointerEvents: ready ? 'none' : 'auto',
            transition: 'opacity 1.2s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ ...mono, fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: CLAY }}>
              Nkusu
            </span>
          </div>

          {/* Floating nav */}
          <nav style={{
            position: 'absolute', top: 24, left: 0, right: 0, zIndex: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 clamp(24px, 5vw, 64px)',
            opacity: ready ? 1 : 0, transition: 'opacity 1s ease .3s',
          }}>
            <div>
              <div style={{ ...serif, fontSize: 24, color: INK, lineHeight: 1 }}>Nkusu</div>
              <div style={{ ...sans, fontSize: 9.5, letterSpacing: 2.5, color: CLAY,
                textTransform: 'uppercase' }}>Verified origin</div>
            </div>
            <div style={{ display: 'flex', gap: 26, alignItems: 'center' }}>
              {[['Shop', '/shop'], ['Auctions', '/auctions'], ['Our story', '/shop/ourstory']].map(([label, to]) => (
                <Link key={to} to={to} data-hover style={{ ...sans, fontSize: 13,
                  color: 'rgba(20,35,26,0.62)', textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          </nav>

          {/* Left column: headline, then the stage story */}
          <div style={{
            position: 'absolute', left: 'clamp(24px, 5vw, 72px)', top: '50%',
            transform: 'translateY(-50%)', maxWidth: 420, zIndex: 4,
          }}>
            <div style={{ opacity: 1 - clamp01(progress * 6), pointerEvents: progress > 0.1 ? 'none' : 'auto' }}>
              <div style={{ ...mono, fontSize: 10.5, letterSpacing: 3.4, textTransform: 'uppercase',
                color: GREEN, marginBottom: 18,
                opacity: ready ? 1 : 0, transition: 'opacity .8s ease .5s' }}>
                Coffee &amp; cocoa · Traced to the plot
              </div>
              <RevealTitle
                text="From this fruit to your cup, nothing is lost."
                play={ready}
                style={{ ...serif, fontSize: 'clamp(36px, 4.4vw, 60px)', lineHeight: 1.05,
                  color: INK, fontWeight: 500 }}
              />
              <p style={{ ...sans, fontSize: 15, lineHeight: 1.75, color: 'rgba(20,35,26,0.66)',
                margin: '22px 0 30px', opacity: ready ? 1 : 0,
                transition: 'opacity .9s ease .9s' }}>
                Follow one cherry through every step we document — and see what
                the premium actually pays for.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap',
                opacity: ready ? 1 : 0, transition: 'opacity .9s ease 1.1s' }}>
                <PrimaryButton onClick={() => navigate('/shop')}>Shop the lots →</PrimaryButton>
              </div>
            </div>

            {/* Stage story, swapped as the object transforms */}
            <div key={stage.key} style={{
              position: 'absolute', top: 0, left: 0, width: '100%',
              opacity: clamp01((progress - 0.06) * 8),
              animation: 'nkFadeUp .7s cubic-bezier(.22,1,.36,1)',
            }}>
              <div style={{ ...mono, fontSize: 10.5, letterSpacing: 3, textTransform: 'uppercase',
                color: CLAY, marginBottom: 16 }}>
                {stage.eyebrow}
              </div>
              <h2 style={{ ...serif, fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: 1.1,
                color: INK, fontWeight: 500, margin: 0 }}>
                {stage.title}
              </h2>
              <p style={{ ...sans, fontSize: 15, lineHeight: 1.75, color: 'rgba(20,35,26,0.66)',
                margin: '18px 0 24px' }}>
                {stage.body}
              </p>
              <div style={{ borderTop: `1px solid ${LINE}` }}>
                {stage.facts.map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: `1px solid ${LINE}` }}>
                    <span style={{ ...sans, fontSize: 12.5, color: 'rgba(20,35,26,0.5)' }}>{label}</span>
                    <span style={{ ...mono, fontSize: 12, color: INK }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right rail: the four stages as a progress track */}
          <div style={{
            position: 'absolute', right: 'clamp(24px, 4vw, 54px)', top: '50%',
            transform: 'translateY(-50%)', zIndex: 4,
            display: 'flex', flexDirection: 'column', gap: 22,
            opacity: ready ? 1 : 0, transition: 'opacity 1s ease 1.2s',
          }}>
            {STAGES.map((s, i) => {
              const active = i === stageIndex;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12,
                  justifyContent: 'flex-end' }}>
                  <span style={{ ...sans, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
                    color: active ? INK : 'rgba(20,35,26,0.35)',
                    transition: 'color .4s ease' }}>
                    {['Cherry', 'Green bean', 'Roasted', 'Cup'][i]}
                  </span>
                  <span style={{
                    width: active ? 26 : 8, height: 2, borderRadius: 2,
                    background: active ? GREEN : 'rgba(20,35,26,0.22)',
                    transition: 'all .45s cubic-bezier(.22,1,.36,1)',
                  }}/>
                </div>
              );
            })}
          </div>

          {/* Scroll hint */}
          <div style={{
            position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            ...sans, fontSize: 10.5, letterSpacing: 2.4, textTransform: 'uppercase',
            color: 'rgba(20,35,26,0.4)', zIndex: 4,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            opacity: ready ? 1 - clamp01(progress * 8) : 0, transition: 'opacity .8s ease 1.4s',
          }}>
            Scroll
            <span style={{ width: 1, height: 28,
              background: 'linear-gradient(rgba(20,35,26,0.35), transparent)' }}/>
          </div>
        </div>
      </section>

      {/* ── The lots ────────────────────────────────────────────────── */}
            {/* ── The lots ────────────────────────────────────────────────── */}
      <section style={{ padding: '130px 24px 140px', background: BG }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ maxWidth: 560, marginBottom: 64 }}>
            <div style={{ ...mono, fontSize: 10.5, letterSpacing: 3, color: GREEN,
              textTransform: 'uppercase', marginBottom: 18 }}>
              Available now
            </div>
            <h2 style={{ ...serif, fontSize: 'clamp(32px, 4.2vw, 50px)', color: INK,
              fontWeight: 500, margin: 0, lineHeight: 1.06 }}>
              Every lot carries the record you just followed.
            </h2>
          </div>

          {lots.length === 0 ? (
            <p style={{ ...sans, color: 'rgba(20,35,26,0.45)' }}>
              New lots arrive with every harvest.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '56px 36px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {lots.slice(0, 3).map((lot, i) => (
                <LotCard key={lot.id} lot={lot} index={i} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 72, paddingTop: 36, borderTop: `1px solid ${LINE}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: 20, flexWrap: 'wrap' }}>
            <p style={{ ...sans, fontSize: 14, color: 'rgba(20,35,26,0.55)', margin: 0 }}>
              Each lot is geolocated, checked against the 2020 canopy and documented for EUDR.
            </p>
            <PrimaryButton to="/shop">Browse every lot →</PrimaryButton>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes nkFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
       
      `}</style>
    </div>
  );
};

export default ShopLanding;