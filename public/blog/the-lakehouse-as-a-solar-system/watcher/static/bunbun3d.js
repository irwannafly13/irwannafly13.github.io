// The Watcher · Commander Bun Bun
// Trino's mascot as a full astronaut, built procedurally (no external model files). The model faces +z (the
// page turns the hub toward the camera) and is about 80 units tall, origin near the middle of the suit.
//   idle - zero-g float, drifting limbs, ear sway and twitches, blinks, an occasional wave, blinking lamps
//   work - (models running) the jetpack fires, the datapad comes out with SQL scrolling on it, and the
//          transmitter in the other paw is aimed at the table being written and fires query bolts at it
// Bun Bun's right paw is on the viewer's left (x < 0): it holds the transmitter; the left paw holds the datapad.

export function buildBunBun(THREE, { glowTex }) {
  const root = new THREE.Group();          // added to the Trino hub by the page
  const body = new THREE.Group();          // the astronaut (floats / leans inside root)
  body.position.y = -4; root.add(body); root.scale.setScalar(.95);
  const parts = [];                        // solid meshes: pickable, faded by setFade
  const glowMats = [];                     // additive effect materials: update() sets their opacity

  // ── materials ────────────────────────────────────────────────────────────────────────────
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .05, emissive: color, emissiveIntensity: .12, ...o });
  const lamp = color => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1, roughness: .3 });
  const M = {
    suit: std("#f3f3f6"),
    trim: std("#dd00a1", { emissiveIntensity: .35 }),                       // Trino pink
    grey: std("#515151", { roughness: .4, metalness: .35, emissiveIntensity: .05 }),
    dish: std("#9a9aa2", { roughness: .35, metalness: .5, emissiveIntensity: .05, side: THREE.DoubleSide }),
    dark: std("#10110e", { roughness: .25, emissiveIntensity: 0 }),
    fur: std("#ffffff", { roughness: .85, emissiveIntensity: .18 }),
    ear: std("#f9d8d2", { emissiveIntensity: .25 }),
    nose: std("#ff7fc8", { emissiveIntensity: .45 }),
    visor: new THREE.MeshStandardMaterial({ color: "#8accce", emissive: "#dd00a1", emissiveIntensity: 0, roughness: .05, metalness: .2,
      transparent: true, opacity: .12, depthWrite: false }),
    shine: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .6, depthWrite: false }),
  };
  const glow = (color, size) => {
    const m = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    glowMats.push(m); const s = new THREE.Sprite(m); s.scale.setScalar(size); return s;
  };
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); parts.push(m); return m;
  };
  const pivot = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const ring = (r, tube, mat, parent, x, y, z, sz = 1) => {           // horizontal band (torus laid flat)
    const m = mesh(new THREE.TorusGeometry(r, tube, 8, 28), mat, parent, x, y, z);
    m.rotation.x = Math.PI / 2; m.scale.y = sz; return m;
  };
  const sphere = (r, mat, parent, x, y, z, seg = 20) => mesh(new THREE.SphereGeometry(r, seg, Math.ceil(seg * .75)), mat, parent, x, y, z);
  const capsule = (r, len, mat, parent, x, y, z) => mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat, parent, x, y, z);

  // ── torso, backpack, tail ───────────────────────────────────────────────────────────────
  capsule(9, 8, M.suit, body, 0, -8, 0).scale.set(1.05, 1, .9);
  ring(8.4, 2, M.trim, body, 0, 3.2, 0, .9);                          // neck collar
  ring(9.3, 1.3, M.trim, body, 0, -15, 0, .88);                       // belt
  mesh(new THREE.BoxGeometry(3.2, 2.6, 1.2), M.grey, body, 0, -15, 8.3);
  const panel = mesh(new THREE.BoxGeometry(9, 6, 2), M.grey, body, 0, -5, 7.3); panel.rotation.x = -.12;
  const chestLamps = ["#ff5fcf", "#63d4ff", "#8cff6a"].map((c, i) => sphere(.85, lamp(c), body, (i - 1) * 2.6, -4.6, 8.5, 10));
  mesh(new THREE.BoxGeometry(15, 17, 6), M.suit, body, 0, -6, -11);   // life-support pack
  mesh(new THREE.BoxGeometry(15.4, 2, 6.4), M.trim, body, 0, 1, -11);
  const nozzles = [-4.5, 4.5].map(x => {
    mesh(new THREE.CylinderGeometry(1.6, 2.4, 3.5, 14), M.grey, body, x, -16.2, -11);
    return new THREE.Vector3(x, -18, -11);
  });
  mesh(new THREE.CylinderGeometry(.35, .35, 12, 6), M.grey, body, 7, 8, -13);   // antenna
  const antennaTip = sphere(1.1, lamp("#dd00a1"), body, 7, 14.5, -13, 12);
  sphere(3.6, M.fur, body, 0, -21, -8.5);                             // tail

  // ── head: fur, face, ears, helmet ───────────────────────────────────────────────────────
  const head = pivot(body, 0, 13, 0);
  sphere(9.5, M.fur, head, 0, 0, 0, 32).scale.set(1, .95, .95);
  for (const s of [-1, 1]) sphere(3.2, M.fur, head, s * 2.6, -3.2, 7.2);   // muzzle puffs
  const eyes = [-1, 1].map(s => {
    const e = sphere(1.5, M.dark, head, s * 3.4, 1.4, 8.3, 14); e.scale.set(1, 1.25, .6);
    sphere(.45, M.shine, e, -.5, .6, 1.2, 8);
    return e;
  });
  sphere(1.1, M.nose, head, 0, -1.6, 9.4, 12).scale.set(1.3, 1, 1);
  for (const s of [-1, 1]) {                                           // "w" mouth
    const m = mesh(new THREE.TorusGeometry(.9, .2, 6, 12, Math.PI), M.dark, head, s * .9, -3.6, 9.6);
    m.rotation.z = Math.PI;
    for (const dy of [-.8, .8]) {                                      // whiskers
      const w = mesh(new THREE.CylinderGeometry(.12, .12, 7, 5), M.grey, head, s * 8, -2.2 + dy, 7);
      w.rotation.set(0, -s * .45, Math.PI / 2 + s * dy * .18);
    }
  }
  // ears: two segments each so the tip can flop and twitch; they poke out of sleeves in the helmet
  const ears = [-1, 1].map(s => {
    const lower = pivot(head, s * 4, 8, 0), upper = pivot(lower, 0, 11, 0);
    capsule(2.8, 9, M.fur, lower, 0, 5.5, 0).scale.z = .55;
    capsule(1.6, 7, M.ear, lower, 0, 6, 1.25).scale.z = .3;
    capsule(2.8, 8, M.fur, upper, 0, 5, 0).scale.z = .55;
    capsule(1.6, 6, M.ear, upper, 0, 5, 1.25).scale.z = .3;
    const sleeve = mesh(new THREE.TorusGeometry(3.4, .8, 8, 20), M.trim, head, s * 4, 12.2, 0);
    sleeve.rotation.x = Math.PI / 2;
    return { s, lower, upper };
  });
  mesh(new THREE.SphereGeometry(13, 36, 26), M.visor, head);          // glass bubble
  const shellMat = M.suit.clone(); shellMat.side = THREE.DoubleSide;     // white back of the helmet
  mesh(new THREE.SphereGeometry(13.4, 36, 26, Math.PI * 1.1, Math.PI * .8), shellMat, head);
  for (const s of [-1, 1]) {                                           // comm pods on the helmet sides
    const pod = mesh(new THREE.CylinderGeometry(3.4, 3.4, 2.6, 18), M.grey, head, s * 12.6, -1, 0); pod.rotation.z = Math.PI / 2;
    const cap = mesh(new THREE.CylinderGeometry(2.2, 2.2, .8, 16), M.trim, head, s * 14.1, -1, 0); cap.rotation.z = Math.PI / 2;
  }
  const helmetLamp = sphere(.9, lamp("#fff3c4"), head, -13.3, 2.6, 1.5, 10);
  const glint = sphere(1, M.shine, head, -6.4, 6.6, 10, 12); glint.scale.set(3.2, 1.1, .3); glint.rotation.z = .65;

  // ── limbs ───────────────────────────────────────────────────────────────────────────────
  function arm(s) {
    const shoulder = pivot(body, s * 10, -1, 0);
    sphere(4, M.suit, shoulder, 0, 0, 0);
    capsule(3, 5, M.suit, shoulder, 0, -5, 0);
    const elbow = pivot(shoulder, 0, -9.5, 0);
    ring(2.9, .7, M.grey, elbow, 0, 0, 0);
    capsule(2.8, 4.5, M.suit, elbow, 0, -4.5, 0);
    ring(2.9, 1, M.trim, elbow, 0, -8, 0);
    sphere(3.3, M.grey, elbow, 0, -10.5, 0).scale.set(1, 1.1, .9);
    return { s, shoulder, elbow, hand: pivot(elbow, 0, -11, 0) };
  }
  const armR = arm(-1), armL = arm(1);
  const legs = [-1, 1].map(s => {
    const hip = pivot(body, s * 4.5, -20, 0);
    capsule(3.6, 5, M.suit, hip, 0, -5, 0);
    ring(3.4, .8, M.trim, hip, 0, -10, 0);
    sphere(4.2, M.grey, hip, 0, -13, 1.2).scale.set(1, .75, 1.35);
    return { s, hip };
  });

  // ── tools ───────────────────────────────────────────────────────────────────────────────
  // Query transmitter: grip in the paw, barrel and a little dish along the arm's direction (-y)
  function transmitter(parent) {
    const g = pivot(parent);
    mesh(new THREE.BoxGeometry(1.8, 3.6, 2.2), M.grey, g, 0, -.5, 0);
    mesh(new THREE.CylinderGeometry(1.1, 1.4, 7, 12), M.suit, g, 0, -4.5, 1.3);
    ring(1.5, .45, M.trim, g, 0, -7.6, 1.3);
    mesh(new THREE.SphereGeometry(3, 18, 8, 0, Math.PI * 2, 0, .9), M.dish, g, 0, -11.2, 1.3);
    const tip = sphere(1, lamp("#ff5fcf"), g, 0, -9, 1.3, 10);
    return { g, tip };
  }
  const gun = transmitter(armR.hand);
  const holster = transmitter(body);                                   // idle: clipped to the hip
  holster.g.position.set(-10, -17, 3); holster.g.rotation.set(.2, 0, -.5); holster.g.scale.setScalar(.85);
  const flash = glow("#ff5fcf", 0); gun.g.add(flash); flash.position.set(0, -10.5, 1.3);

  // Datapad: frame + a screen of scrolling SQL-ish lines (canvas texture)
  const padCanvas = document.createElement("canvas"); padCanvas.width = 128; padCanvas.height = 256;
  {
    const g = padCanvas.getContext("2d");
    g.fillStyle = "#0b1020"; g.fillRect(0, 0, 128, 256);
    const cols = ["#ff5fcf", "#63d4ff", "#e8e8f0", "#e8e8f0", "#8cff6a"];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 6; y < 256; y += 10) {
      let x = 6 + (rnd() < .3 ? 10 : 0);
      while (x < 116) {
        const w = 8 + rnd() * 28; if (x + w > 122) break;
        g.fillStyle = cols[(rnd() * cols.length) | 0]; g.fillRect(x, y, w, 4); x += w + 5;
      }
    }
  }
  const padTex = new THREE.CanvasTexture(padCanvas);
  padTex.colorSpace = THREE.SRGBColorSpace; padTex.wrapT = THREE.RepeatWrapping; padTex.repeat.set(1, .5);
  const pad = pivot(body, 8.5, -3, 12.5);
  pad.rotation.set(-.45, -.3, .1);
  mesh(new THREE.BoxGeometry(9, 6.4, .8), M.grey, pad);
  mesh(new THREE.PlaneGeometry(8, 5.4), new THREE.MeshBasicMaterial({ map: padTex, toneMapped: false, transparent: true }), pad, 0, 0, .45);
  pad.scale.setScalar(0);

  // ── effects ─────────────────────────────────────────────────────────────────────────────
  const flameMat = new THREE.MeshBasicMaterial({ color: "#ff5fcf", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const coreMat = new THREE.MeshBasicMaterial({ color: "#fff0fa", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  glowMats.push(flameMat, coreMat);
  const flames = nozzles.map(p => {
    const g = pivot(body, p.x, p.y, p.z);
    const outer = new THREE.Mesh(new THREE.ConeGeometry(2.4, 24, 14, 1, true), flameMat), inner = new THREE.Mesh(new THREE.ConeGeometry(1.2, 12, 10, 1, true), coreMat);
    outer.rotation.x = inner.rotation.x = Math.PI;                    // tip points down
    outer.position.y = -12; inner.position.y = -6; g.add(outer, inner); g.rotation.x = -.25;
    return g;
  });
  const puffs = Array.from({ length: 26 }, () => {
    const s = glow(Math.random() < .5 ? "#dd00a1" : "#ffb3e6", 4); body.add(s);
    return { s, life: 0, v: new THREE.Vector3() };
  });
  const bolts = Array.from({ length: 6 }, () => {                     // each bolt: a head and a fading tail
    const trail = [0, 1, 2].map(k => { const s = glow(k ? "#ff5fcf" : "#ffffff", 7 - k * 1.6); root.add(s); return s; });
    return { trail, life: 0, from: new THREE.Vector3(), dir: new THREE.Vector3(), len: 0 };
  });

  // ── animation ───────────────────────────────────────────────────────────────────────────
  let fade = 1, dark = true, fireT = 0, recoil = 0, lookPad = 0, puffCarry = 0, nextBolt = 0;
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), aimAt = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), e1 = new THREE.Euler();
  const DOWN = new THREE.Vector3(0, -1, 0), AIM_DEFAULT = new THREE.Vector3(-.7, -.1, .7).normalize();
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ease = (cur, to, dt, ms) => cur + (to - cur) * Math.min(1, dt / ms);

  // work: 0 (idle) .. 1 (models running), eased by the page; target: world position of the table being written
  function update(dt, now, { work: w = 0, target = null } = {}) {
    const idle = 1 - w;
    // float: slow zero-g drift when idle, a fast hover jitter on the jetpack when working
    body.position.y = -4 + Math.sin(now / 1100) * 2.2 * idle + Math.sin(now / 230) * .7 * w;
    body.rotation.z = Math.sin(now / 1700) * .07 * idle;
    body.rotation.x = Math.sin(now / 2300) * .05 * idle + .1 * w;     // leans into the work

    // head: looks around when idle; at work it glances between the datapad and the target
    lookPad = ease(lookPad, (now % 3200) < 1500 ? 1 : 0, dt, 250);
    head.rotation.y = Math.sin(now / 2900) * .25 * idle + w * (lookPad * .35 - (1 - lookPad) * .3);
    head.rotation.x = Math.sin(now / 2100) * .06 * idle + w * lookPad * .28;
    head.rotation.z = Math.sin(now / 1900 + 1) * .06 * idle;
    const blink = (now % 3700) < 130 || (now % 11100) > 10850 && (now % 11100) < 10980;
    for (const e of eyes) e.scale.y = blink ? .15 : 1.25;

    // ears: lazy sway and a twitch now and then; at work they stand up straight
    for (const { s, lower, upper } of ears) {
      const tw = (now + (s > 0 ? 2600 : 0)) % 5300, twitch = tw < 320 ? Math.sin(tw / 320 * Math.PI * 3) * .35 : 0;
      lower.rotation.z = s * (-.14 * idle - .03 * w) + Math.sin(now / 900 + s) * .07 * idle;
      upper.rotation.x = (-.35 + Math.sin(now / 1300 + s * 2) * .12) * idle;
      upper.rotation.z = s * (-.15 * idle) + twitch * idle + Math.sin(now / 120 + s) * .03 * w;
    }

    // left paw: drifts when idle, holds the datapad up at work
    pad.scale.setScalar(1.35 * smooth(.25, .75, w));
    padTex.offset.y = (now / 2400) % 1;
    armL.shoulder.rotation.set(Math.sin(now / 1500) * .15 * idle - 1.05 * w, -.25 * w, .45 * idle + .2 * w);
    armL.elbow.rotation.set(-.2 * idle - .9 * w, 0, .25 * w);

    // right paw: an occasional wave when idle; at work it aims the transmitter at the target
    const wc = now % 10000, wave = smooth(7600, 8000, wc) * (1 - smooth(9400, 9800, wc));
    e1.set(Math.sin(now / 1600 + 2) * .15 * (1 - wave), 0, -.45 - 2.1 * wave);
    q1.setFromEuler(e1);
    armR.shoulder.getWorldPosition(v1); body.getWorldQuaternion(q2);
    if (!target) target = aimAt.copy(AIM_DEFAULT).applyQuaternion(q2).multiplyScalar(80).add(v1);   // no table: aim out front
    v2.copy(target).sub(v1).normalize().applyQuaternion(q2.invert());   // world -> body direction
    if (v2.z < .15) { v2.z = .15; v2.normalize(); }                    // never aim back through the body
    q2.setFromUnitVectors(DOWN, v2);
    armR.shoulder.quaternion.slerpQuaternions(q1, q2, smooth(0, .6, w));
    recoil = Math.max(0, recoil - dt / 160);
    armR.elbow.rotation.set(-.25 * recoil * w, 0, (-.25 + Math.sin(now / 140) * .55 * wave) * idle);
    gun.g.scale.setScalar(1.5 * smooth(.3, .7, w)); gun.g.position.y = recoil * 1.6;
    holster.g.scale.setScalar(.85 * (1 - smooth(.3, .7, w)));

    // legs: lazy paddling when idle, trailed back under the jetpack at work
    for (const { s, hip } of legs) {
      hip.rotation.x = Math.sin(now / 1300 + s * 1.6) * .2 * idle + .3 * w;
      hip.rotation.z = s * (.08 * idle + .04 * w);
    }

    // lamps
    chestLamps.forEach((m, i) => { m.material.emissiveIntensity = .25 + .9 * (Math.floor(now / (w > .5 ? 180 : 700)) % 3 === i ? 1 : 0); });
    antennaTip.material.emissiveIntensity = (now % (w > .5 ? 400 : 1600)) < 120 ? 1.6 : .2;
    helmetLamp.material.emissiveIntensity = .3 + 1.2 * w;
    M.visor.emissiveIntensity = (.05 + .12 * Math.sin(now / 200)) * w;

    // jetpack: flame cones flicker and pink puffs drift out of the nozzles
    flames.forEach((f, i) => f.scale.set(.6 + .4 * w, w * (.85 + .3 * Math.sin(now / 45 + i * 2)), .6 + .4 * w));
    flameMat.opacity = .75 * w * fade; coreMat.opacity = .9 * w * fade;
    puffCarry += w * w * 40 * dt / 1000;
    for (const p of puffs) {
      if (p.life <= 0 && puffCarry >= 1) {
        puffCarry -= 1; p.life = 1;
        const n = nozzles[(Math.random() * 2) | 0];
        p.s.position.set(n.x + (Math.random() - .5) * 2, n.y - 3, n.z);
        p.v.set((Math.random() - .5) * 12, -45 - Math.random() * 30, -8 - Math.random() * 8);
      }
      if (p.life > 0) {
        p.life = Math.max(0, p.life - dt / 650);
        p.s.position.addScaledVector(p.v, dt / 1000);
        p.s.scale.setScalar(4 + (1 - p.life) * 10);
      }
      p.s.material.opacity = p.life * p.life * .8 * fade;
    }
    puffCarry = Math.min(puffCarry, 3);

    // firing: a query bolt every ~0.65 s while working, from the transmitter tip toward the target
    fireT += dt;
    if (w > .6 && fireT >= nextBolt) {
      fireT = 0; nextBolt = 520 + Math.random() * 260; recoil = 1;
      const b = bolts.find(b => b.life <= 0);
      if (b) {
        gun.tip.getWorldPosition(v1); root.worldToLocal(b.from.copy(v1));
        root.worldToLocal(b.dir.copy(target)).sub(b.from);
        b.len = Math.min(90, b.dir.length()); b.dir.normalize(); b.life = 1;
      }
    }
    flash.scale.setScalar(4 + recoil * 10);
    flash.material.opacity = (recoil * .9 + .25 * w) * fade;
    for (const b of bolts) {
      if (b.life > 0) b.life = Math.max(0, b.life - dt / 420);
      const t = 1 - b.life;
      b.trail.forEach((s, k) => {
        s.position.copy(b.from).addScaledVector(b.dir, Math.max(0, t * b.len - k * 4));
        s.material.opacity = b.life > 0 ? (1 - k * .3) * Math.min(1, b.life * 2.5) * fade : 0;
      });
    }
  }

  function setTheme(isDark) {
    dark = isDark;
    for (const m of glowMats) { m.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending; m.needsUpdate = true; }
    for (const m of [M.suit, M.fur, shellMat]) m.emissiveIntensity = isDark ? .14 : .02;
    M.trim.emissiveIntensity = isDark ? .35 : .1;
  }
  // spotlight on something else: Bun Bun turns see-through (f = 1 restores it)
  let fadeMats = null;
  function setFade(f) {
    fade = f;
    if (!fadeMats) {
      fadeMats = new Map();
      for (const o of parts) for (const m of [].concat(o.material)) if (!glowMats.includes(m) && !fadeMats.has(m)) fadeMats.set(m, { o: m.opacity, t: m.transparent, d: m.depthWrite });
    }
    for (const [m, b] of fadeMats) { m.transparent = b.t || f < 1; m.opacity = b.o * f; m.depthWrite = b.d && f >= 1; }
  }

  return { root, parts, update, setTheme, setFade };
}
