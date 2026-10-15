// The Watcher · Death Star: the alert & notification centre
// A procedurally built battle-station moon (no model files): a paneled sphere with city lights, an
// equatorial trench, and a concave superlaser dish with eight tributary emitters around a focus lens.
// Behaviour follows the alerts:
//   all quiet  -> slow idle spin, dish lens dim
//   warning    -> dish ring glows amber, emitters pulse
//   critical   -> the station turns its dish to the failing table, charges (tributary beams converge)
//                 and fires the main beam at it; onHit() lets the page flash the planet

export function buildDeathStar(THREE, { glowTex }) {
  const R = 60;
  const root = new THREE.Group();
  const pickables = [];
  const tag = o => { o.traverse(m => { if (m.isMesh) { m.userData.deathstar = true; pickables.push(m); } }); return o; };

  // ── surface textures (equirectangular): panels, latitude belts, the trench, city lights ──────
  const W = 2048, H = 1024;
  const rnd = (() => { let s = 1234567; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const surf = document.createElement("canvas"); surf.width = W; surf.height = H;
  const lights = document.createElement("canvas"); lights.width = W; lights.height = H;
  {
    const g = surf.getContext("2d"), l = lights.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#8b929b"); grad.addColorStop(.5, "#a2a9b2"); grad.addColorStop(1, "#7f868f");
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    l.fillStyle = "#000"; l.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) {                             // hull plates
      const w = 4 + rnd() * 34, h = 2 + rnd() * 14, x = rnd() * W, y = rnd() * H, v = 120 + rnd() * 70;
      g.fillStyle = `rgba(${v},${v + 4},${v + 10},${.35 + rnd() * .4})`; g.fillRect(x, y, w, h);
    }
    g.strokeStyle = "rgba(60,64,72,.55)"; g.lineWidth = 1;
    for (let y = 32; y < H; y += 32 + Math.floor(rnd() * 24)) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }   // belts
    for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.globalAlpha = .25; g.stroke(); g.globalAlpha = 1; }
    // equatorial trench: dark band with a lit wall
    const ty = H / 2;
    g.fillStyle = "#2b2f36"; g.fillRect(0, ty - 7, W, 14);
    g.fillStyle = "#5b616b"; g.fillRect(0, ty - 7, W, 2); g.fillRect(0, ty + 5, W, 2);
    for (let x = 0; x < W; x += 3) if (rnd() < .55) { l.fillStyle = `rgba(255,236,200,${.4 + rnd() * .6})`; l.fillRect(x, ty - 4 + rnd() * 8, 1.6, 1.4); }
    // city lights: clusters, denser near the trench and the belts
    for (let c = 0; c < 340; c++) {
      const cx = rnd() * W, cy = H * (.12 + rnd() * .76), n = 6 + rnd() * 40, sp = 4 + rnd() * 26;
      for (let k = 0; k < n; k++) { l.fillStyle = `rgba(255,${220 + rnd() * 35},${170 + rnd() * 60},${.35 + rnd() * .65})`; l.fillRect(cx + (rnd() - .5) * sp * 2, cy + (rnd() - .5) * sp * .6, 1.4, 1.2); }
    }
    // darken the poles a little
    const pole = g.createLinearGradient(0, 0, 0, H);
    pole.addColorStop(0, "rgba(0,0,0,.25)"); pole.addColorStop(.18, "rgba(0,0,0,0)"); pole.addColorStop(.82, "rgba(0,0,0,0)"); pole.addColorStop(1, "rgba(0,0,0,.3)");
    g.fillStyle = pole; g.fillRect(0, 0, W, H);
  }
  const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const hullMat = new THREE.MeshStandardMaterial({ map: tex(surf), color: 0xaeb9c9, emissiveMap: tex(lights), emissive: 0xffe2b0, emissiveIntensity: .9, metalness: .5, roughness: .58 });   // cool grey tint against the warm sun
  const hull = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), hullMat);
  root.add(hull);
  // trench walls in relief
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x6a717b, metalness: .6, roughness: .45 });
  for (const y of [-1.4, 1.4]) { const t = new THREE.Mesh(new THREE.TorusGeometry(Math.sqrt(R * R - y * y) + .15, .42, 6, 200), wallMat); t.rotation.x = Math.PI / 2; t.position.y = y; root.add(t); }

  // ── superlaser dish (northern hemisphere, facing local +Z) ──────────────────────────────────
  const lat = 32 * Math.PI / 180, d = new THREE.Vector3(0, Math.sin(lat), Math.cos(lat));
  const dish = new THREE.Group(); root.add(dish);
  const rd = 22, th = .62, rimR = rd * Math.sin(th), rimAt = Math.sqrt(R * R - rimR * rimR) + .3, C = rimAt + rd * Math.cos(th);
  const dishTex = (() => {   // concentric rings on the bowl
    const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d");
    g.fillStyle = "#7a818b"; g.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 10) { g.fillStyle = y % 20 ? "#5d636c" : "#959ca6"; g.fillRect(0, y, 64, 2); }
    return tex(c);
  })();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(rd, 64, 24, 0, Math.PI * 2, 0, th),
    new THREE.MeshStandardMaterial({ map: dishTex, metalness: .55, roughness: .4, side: THREE.DoubleSide }));
  bowl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().negate());
  bowl.position.copy(d).multiplyScalar(C); dish.add(bowl);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x63d4ff, transparent: true, opacity: .55 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(rimR, .55, 8, 96), ringMat);
  rim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); rim.position.copy(d).multiplyScalar(rimAt); dish.add(rim);
  const bowlAt = r => C - Math.sqrt(rd * rd - r * r);           // along-axis depth of the bowl at radius r
  const u = new THREE.Vector3(1, 0, 0), v = new THREE.Vector3().crossVectors(d, u).normalize();
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x9dff9a, transparent: true, opacity: .35 });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 1.6, 20), lensMat);
  lens.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); lens.position.copy(d).multiplyScalar(bowlAt(0) + .6); dish.add(lens);
  const focus = d.clone().multiplyScalar(rimAt + 10);              // where the tributary beams meet
  const emitters = [], tribs = [];
  const beamMat = () => new THREE.MeshBasicMaterial({ color: 0x7dff6e, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
  function placeBeam(m, a, b, r) {                                   // stretch a unit cylinder from a to b
    const dir = b.clone().sub(a), len = dir.length();
    m.position.copy(a).addScaledVector(dir, .5); m.scale.set(r, len, r);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  }
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, r = 8.5;
    const p = d.clone().multiplyScalar(bowlAt(r) + .4).addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r);
    const e = new THREE.Mesh(new THREE.SphereGeometry(.9, 12, 8), new THREE.MeshBasicMaterial({ color: 0x3b4a3b }));
    e.position.copy(p); dish.add(e); emitters.push(e);
    const t = new THREE.Mesh(unitCyl, beamMat()); placeBeam(t, p, focus, .28); dish.add(t); tribs.push(t);
  }
  const glowMats = [];
  const glow = (color, scale, op = 0) => { const m = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op }); glowMats.push(m); const s = new THREE.Sprite(m); s.scale.setScalar(scale); return s; };
  const focusGlow = glow(0x9dff9a, 16); focusGlow.position.copy(focus); dish.add(focusGlow);
  const dishGlow = glow(0x63d4ff, 46, .25); dishGlow.position.copy(d).multiplyScalar(rimAt + 2); dish.add(dishGlow);
  const halo = glow(0x8fb8ff, R * 3.4, .12); root.add(halo);
  tag(root);

  // main beam lives in the root's space so it can reach any target
  const beamCore = new THREE.Mesh(unitCyl, beamMat()), beamGlow = new THREE.Mesh(unitCyl, beamMat());
  beamCore.visible = beamGlow.visible = false; root.add(beamCore, beamGlow);
  const hitGlow = glow(0xb8ff9a, 40); root.add(hitGlow);

  // ── behaviour ──────────────────────────────────────────────────────────────────────────────
  const COL = { ok: new THREE.Color(0x63d4ff), warning: new THREE.Color(0xfab219), critical: new THREE.Color(0xff3b3b) };
  const rimCol = COL.ok.clone(), qIdle = new THREE.Quaternion(), qAim = new THREE.Quaternion(), e = new THREE.Euler();
  const _t = new THREE.Vector3(), _w = new THREE.Vector3();
  let dark = true, fade = 1, cycle = 0, fired = false, idleYaw = 0;

  function update(now, dt, s) {
    // s: { level: 'ok' | 'warning' | 'critical', target: Vector3 (world) | null, home: Vector3 (what it overlooks), onHit: fn }
    const level = s.level || "ok", target = level === "critical" ? s.target : null;
    rimCol.lerp(COL[level], Math.min(1, dt / 400));
    ringMat.color.copy(rimCol); dishGlow.material.color.copy(rimCol);
    dishGlow.material.opacity = (dark ? (level === "ok" ? .18 : .45 + .25 * Math.sin(now / (level === "critical" ? 180 : 420))) : 0) * fade;
    ringMat.opacity = (level === "ok" ? .45 : .9) * fade;
    halo.material.opacity = (dark ? .1 : 0) * fade;
    hullMat.emissiveIntensity = dark ? .9 : .15;

    // attitude: idle = overlook the lakehouse, slowly scanning; alert = turn the dish onto the target
    idleYaw += dt / 1000;
    _w.copy(s.home || new THREE.Vector3()).sub(root.position).normalize();
    _w.applyAxisAngle(new THREE.Vector3(0, 1, 0), .45 * Math.sin(idleYaw / 9)).add(new THREE.Vector3(0, .12 * Math.sin(idleYaw / 6), 0)).normalize();
    qIdle.setFromUnitVectors(d, _w);
    if (target) {
      _t.copy(target).sub(root.position).normalize();
      qAim.setFromUnitVectors(d, _t);
      root.quaternion.slerp(qAim, Math.min(1, dt / 900));
    } else root.quaternion.slerp(qIdle, Math.min(1, dt / 2500));

    // fire cycle (critical with a target): charge 0–1.6 s, fire 1.6–2.4 s, cool down to 7 s
    let charge = 0, shot = 0;
    const aimed = target ? d.clone().applyQuaternion(root.quaternion).dot(_t) > .985 : false;
    if (target && aimed) {
      cycle = (cycle + dt / 1000) % 7;
      if (cycle < 1.6) { charge = cycle / 1.6; fired = false; }
      else if (cycle < 2.4) { shot = 1 - (cycle - 1.6) / .8; if (!fired) { fired = true; s.onHit?.(); } }
    } else { cycle = 0; fired = false; }
    const pulse = level === "warning" ? .5 + .5 * Math.sin(now / 300) : 0;
    emitters.forEach((m, i) => m.material.color.setRGB(.23 + .6 * Math.max(charge, pulse * .5), .29 + .7 * Math.max(charge, pulse * .4), .23 + .3 * charge));
    for (const t of tribs) t.material.opacity = charge * .85 * fade;
    lensMat.opacity = (.3 + .7 * Math.max(charge, shot)) * fade;
    focusGlow.material.opacity = (dark ? Math.max(charge * .9, shot) : charge * .5) * fade;
    beamCore.visible = beamGlow.visible = shot > 0;
    if (shot > 0) {
      const tl = root.worldToLocal(_w.copy(target));
      placeBeam(beamCore, focus, tl, 2); placeBeam(beamGlow, focus, tl, 6.5);
      beamCore.material.opacity = shot * fade; beamGlow.material.opacity = shot * .35 * fade;
      hitGlow.position.copy(tl); hitGlow.material.opacity = shot * (dark ? 1 : .6) * fade;
    } else hitGlow.material.opacity = 0;
  }
  function setTheme(isDark) {
    dark = isDark;
    for (const m of [...glowMats, ...tribs.map(t => t.material), beamCore.material, beamGlow.material]) { m.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending; m.needsUpdate = true; }
  }
  let fadeMats = null;
  function setFade(f) {
    fade = f;
    if (!fadeMats) {
      fadeMats = new Map();
      const animated = new Set([...glowMats, ...tribs.map(t => t.material), beamCore.material, beamGlow.material, ringMat, lensMat]);
      root.traverse(o => { for (const m of [].concat(o.material || [])) if (!animated.has(m) && !fadeMats.has(m)) fadeMats.set(m, { o: m.opacity, t: m.transparent }); });
    }
    for (const [m, b] of fadeMats) { m.transparent = b.t || f < 1; m.opacity = b.o * f; }
  }
  return { root, pickables, update, setTheme, setFade, radius: R };
}
