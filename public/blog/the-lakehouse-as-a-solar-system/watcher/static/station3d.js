// The Watcher · Ops Station
// A procedurally built research station (no external model files). Its anatomy follows real stations:
//   - Integrated truss (ISS ITS): a lattice backbone with rotary joints (SARJ) at both ends
//   - Four pairs of solar array wings (ISS PVM): two blankets per wing either side of a mast, sun-tracking
//   - Thermal radiators (ISS HRS / PVR): white ribbed panels hung off the truss
//   - Pressurized modules: nodes, a lab, side labs with an exposed platform, a cupola, a service module
//     with engines, and visiting vehicles at the docking ports (front: crew capsule, aft: cargo ship)
//   - A rotating habitat ring on spokes around a bearing hub (Stanford torus / von Braun wheel)
//   - A robotic arm on a mobile base (Canadarm2), a high-gain dish, navigation lights
// Each functional part is pickable and maps to a tool in the ops card:
//   habitat ring + hub + spokes     -> dashboard   (ring windows glow with the lakehouse health)
//   lab module stack                -> report      (lab windows scan while a report is built)
//   high-gain dish + docking ports  -> logs        (dish flashes when new events arrive)

export function buildStation(THREE, { glowTex }) {
  const root = new THREE.Group();          // placed on the station's orbit by the page
  const body = new THREE.Group();          // the station itself (slow attitude drift)
  root.add(body);
  const pickables = [];
  const tag = (o, part) => { o.traverse(m => { if (m.isMesh) { m.userData.station = part; pickables.push(m); } }); return o; };

  // ── canvas textures ──────────────────────────────────────────────────────────────────────
  function tex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
    return t;
  }
  // solar blanket: dark blue cells, silver grid, gold bus bars
  const solarTex = tex(64, 256, (g, w, h) => {
    g.fillStyle = "#0a1630"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 4; x++) {
      const gr = g.createLinearGradient(0, y * 8, 0, y * 8 + 8);
      gr.addColorStop(0, "#1f4a8c"); gr.addColorStop(1, "#122b58");
      g.fillStyle = gr; g.fillRect(x * 16 + 1, y * 8 + 1, 14, 6);
    }
    g.fillStyle = "#c8a24a"; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2);
    g.fillStyle = "rgba(200,210,230,.35)"; g.fillRect(w / 2 - 1, 0, 2, h);
  }, 1, 4);
  // multi-layer insulation / micrometeoroid shielding: off-white blankets with ribs and seams
  const skinTex = tex(64, 64, (g, w, h) => {
    g.fillStyle = "#e7e3d9"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(120,110,95,${Math.random() * .06})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
    g.fillStyle = "#b5afa2"; g.fillRect(0, 0, w, 3); g.fillRect(0, 31, w, 2);           // ribs around the hull
    g.fillStyle = "rgba(150,142,128,.6)"; g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h); // blanket seams
  }, 6, 2);
  // radiator: white panels with coolant tubes
  const radTex = tex(64, 64, (g, w, h) => {
    g.fillStyle = "#f2f3f5"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#c9ccd2"; for (let y = 2; y < h; y += 6) g.fillRect(0, y, w, 1);
    g.fillStyle = "#9aa0aa"; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
  }, 1, 3);
  // window rows: black except the lit windows (used as emissive maps)
  const windowTex = (cols, rows, rx, ry) => tex(256, 64, (g, w, h) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff";
    for (const yy of rows) for (let i = 0; i < cols; i++) {
      if (Math.random() < .18) continue;                                   // some windows dark
      g.globalAlpha = .55 + Math.random() * .45;
      g.fillRect(i * w / cols + 2, yy * h - 2, w / cols - 4, 4);
    }
    g.globalAlpha = 1;
  }, rx, ry);
  const ringWin = windowTex(24, [.5, .02, .98], 6, 1);
  const labWin = tex(256, 64, (g, w, h) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff";
    for (const u of [.18, .43, .68]) for (let y = 3; y < h; y += 8) { g.globalAlpha = .5 + Math.random() * .5; g.fillRect(u * w, y, 6, 3); }
    g.globalAlpha = 1;
  }, 1, 2);

  // ── materials ────────────────────────────────────────────────────────────────────────────
  const M = {
    metal:  new THREE.MeshStandardMaterial({ color: 0xc4c8cf, metalness: .65, roughness: .35 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x4d5462, metalness: .7, roughness: .4 }),
    truss:  new THREE.MeshStandardMaterial({ color: 0xb9bec7, metalness: .7, roughness: .3 }),
    skin:   new THREE.MeshStandardMaterial({ map: skinTex, color: 0xffffff, roughness: .85, metalness: .05 }),
    gold:   new THREE.MeshStandardMaterial({ color: 0xd2a446, metalness: .9, roughness: .28, emissive: 0x3a2400, emissiveIntensity: .25 }),
    solar:  new THREE.MeshStandardMaterial({ map: solarTex, metalness: .35, roughness: .3, side: THREE.DoubleSide, emissive: 0x0b2350, emissiveIntensity: .35 }),
    rad:    new THREE.MeshStandardMaterial({ map: radTex, roughness: .6, metalness: .1, side: THREE.DoubleSide }),
    glass:  new THREE.MeshStandardMaterial({ color: 0x0d2233, metalness: .9, roughness: .05, emissive: 0x2ad4ff, emissiveIntensity: .35 }),
    ring:   new THREE.MeshStandardMaterial({ map: tex(64, 64, (g, w, h) => {
              g.fillStyle = "#e7e3d9"; g.fillRect(0, 0, w, h); g.fillStyle = "#b5afa2"; g.fillRect(0, 0, 3, h); g.fillRect(31, 0, 2, h);
            }, 96, 1), emissiveMap: ringWin, emissive: 0x3ddc84, emissiveIntensity: 1.4, roughness: .8, metalness: .1 }),
    lab:    new THREE.MeshStandardMaterial({ map: skinTex, emissiveMap: labWin, emissive: 0x63d4ff, emissiveIntensity: .5, roughness: .85, metalness: .05 }),
    accent: new THREE.MeshBasicMaterial({ color: 0x63d4ff, transparent: true, opacity: .9 }),
    engine: new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: .8, roughness: .5, side: THREE.DoubleSide }),
  };
  const glowMats = [];
  const glowSprite = (color, scale, opacity = .8) => {
    const m = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity });
    glowMats.push(m);
    const s = new THREE.Sprite(m); s.scale.setScalar(scale); s.userData.base = opacity; return s;
  };

  // ── geometry helpers ─────────────────────────────────────────────────────────────────────
  // cylinder along an axis ('x' | 'y' | 'z'), centred at (x, y, z)
  function cyl(r1, r2, len, mat, axis, x = 0, y = 0, z = 0, seg = 28, open = false) {
    const g = new THREE.CylinderGeometry(r1, r2, len, seg, 1, open);
    if (axis === "z") g.rotateX(Math.PI / 2); else if (axis === "x") g.rotateZ(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); return m;
  }
  const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
  const ringAt = (r, tube, mat, axis, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 40), mat);
    if (axis === "z") { /* torus is in the XY plane already: axis = z */ } else if (axis === "x") m.rotation.y = Math.PI / 2; else m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z); return m;
  };
  // a pressurized module: ribbed hull, end cones, berthing rings at both ends
  function module(len, r, mat = M.skin, axis = "z") {
    const g = new THREE.Group();
    g.add(cyl(r, r, len, mat, "z"));
    for (const sgn of [-1, 1]) {
      g.add(cyl(sgn > 0 ? r * .72 : r, sgn > 0 ? r : r * .72, 1.8, M.metal, "z", 0, 0, sgn * (len / 2 + .9)));   // end cone
      g.add(ringAt(r * .7, .45, M.dark, "z", 0, 0, sgn * (len / 2 + 1.9)));                                       // berthing ring
    }
    for (const a of [.6, 2.4, 3.9]) g.add(box(.35, .35, len * .9, M.gold, Math.cos(a) * (r + .25), Math.sin(a) * (r + .25), 0));   // handrails
    if (axis === "x") g.rotation.y = Math.PI / 2; else if (axis === "y") g.rotation.x = Math.PI / 2;
    return g;
  }

  // ── integrated truss: lattice of longerons, bay frames and diagonals ─────────────────────
  const L = 224, S = 7, BAYS = 28, bay = L / BAYS;
  const truss = new THREE.Group(); body.add(truss);
  for (const [y, z] of [[S / 2, S / 2], [S / 2, -S / 2], [-S / 2, S / 2], [-S / 2, -S / 2]])
    truss.add(box(L, .7, .7, M.truss, 0, y, z));
  {
    const unit = new THREE.BoxGeometry(1, 1, 1), mats = [];
    const q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    const put = (x, y, z, ex, ey, ez, sx, sy, sz) => { e.set(ex, ey, ez); q.setFromEuler(e); p.set(x, y, z); sc.set(sx, sy, sz); mats.push(new THREE.Matrix4().compose(p, q, sc)); };
    const diag = Math.hypot(bay, S), ang = Math.atan2(S, bay);
    for (let i = 0; i <= BAYS; i++) {
      const x = -L / 2 + i * bay;
      put(x, S / 2, 0, 0, 0, 0, .45, .45, S); put(x, -S / 2, 0, 0, 0, 0, .45, .45, S);
      put(x, 0, S / 2, 0, 0, 0, .45, S, .45); put(x, 0, -S / 2, 0, 0, 0, .45, S, .45);
      if (i === BAYS) break;
      const xm = x + bay / 2, flip = i % 2 ? 1 : -1;
      put(xm, 0, S / 2, 0, 0, flip * ang, diag, .3, .3);    // front face
      put(xm, 0, -S / 2, 0, 0, -flip * ang, diag, .3, .3);  // back face
      put(xm, S / 2, 0, 0, flip * ang, 0, diag, .3, .3);    // top face
      put(xm, -S / 2, 0, 0, -flip * ang, 0, diag, .3, .3);  // bottom face
    }
    const inst = new THREE.InstancedMesh(unit, M.truss, mats.length);
    mats.forEach((m, i) => inst.setMatrixAt(i, m));
    truss.add(inst);
  }
  // centre segment (S0): enclosed, with equipment boxes; the mobile base rail cart sits on the front face
  truss.add(box(26, S + 1.2, S + 1.2, M.metal));
  for (let i = -2; i <= 2; i++) truss.add(box(3.4, 2.2, 2.6, i % 2 ? M.dark : M.gold, i * 5, S / 2 + 1.6, 0));
  // equipment boxes (batteries, ORUs) on the inboard bays
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) truss.add(box(4.2, 3, 3, i % 2 ? M.dark : M.metal, s * (20 + i * 7), -S / 2 - 1.8, i % 2 ? 1.5 : -1.5));

  // ── solar arrays: rotary joints, 4 wing pairs ────────────────────────────────────────────
  const sarjs = [];
  const arrays = [];
  for (const s of [-1, 1]) {
    body.add(cyl(5.4, 5.4, 5, M.dark, "x", s * 64, 0, 0));
    const lightBand = cyl(5.6, 5.6, 1, M.accent, "x", s * 64, 0, 0); body.add(lightBand);
    const outboard = new THREE.Group(); outboard.position.x = s * 64; body.add(outboard);
    sarjs.push(outboard);
    for (const xo of [16, 40]) {
      const pv = new THREE.Group(); pv.position.x = s * xo; outboard.add(pv);
      pv.add(box(5, 5, 5, M.metal));                            // beta gimbal assembly
      const wings = new THREE.Group(); pv.add(wings); arrays.push(wings);
      for (const dir of [1, -1]) {
        const len = 74, w = 5.2;
        wings.add(cyl(.45, .45, len, M.metal, "y", 0, dir * (len / 2 + 3), 0, 8));   // deployable mast
        for (const side of [-1, 1]) {
          const blanket = new THREE.Mesh(new THREE.PlaneGeometry(w, len), M.solar);
          blanket.position.set(side * (w / 2 + .7), dir * (len / 2 + 3), 0); wings.add(blanket);
        }
        wings.add(box(12, 1.2, 1.6, M.gold, 0, dir * (len + 3.6), 0));             // blanket box (tip)
        wings.add(box(12, 1, 1.6, M.dark, 0, dir * 3, 0));                         // canister (root)
      }
      // photovoltaic radiator on each module
      const pvr = new THREE.Group(); pvr.position.set(0, 0, -4); pv.add(pvr);
      for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), M.rad); p.rotation.x = -Math.PI / 2 + (k % 2 ? .25 : -.25); p.position.set(0, -1, -4 - k * 7); pvr.add(p); }
    }
  }

  // ── main heat-rejection radiators: accordion panels off the inboard truss ──────────────
  const radiators = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * 38, 0, 5); body.add(g); radiators.push(g);
    g.add(cyl(1.2, 1.2, 4, M.dark, "y"));
    for (let k = 0; k < 6; k++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(13, 7.6), M.rad);
      p.rotation.x = Math.PI / 2 + (k % 2 ? .18 : -.18);
      p.position.set(0, 0, 4 + k * 7.4); g.add(p);
      g.add(box(13.2, .4, .4, M.metal, 0, 0, .3 + k * 7.4));
    }
  }

  // ── pressurized modules along the Z axis, under the truss ───────────────────────────────
  const Y = -11;
  const stack = new THREE.Group(); stack.position.y = Y; body.add(stack);
  body.add(box(4, 7, 4, M.metal, 0, -5.5, 0));                       // Z1-style truss attachment
  const node = (z, r = 6.4) => { const g = new THREE.Group(); g.position.z = z; g.add(cyl(r, r, 9, M.metal, "z")); g.add(ringAt(r + .1, .35, M.dark, "z", 0, 0, 4.5)); g.add(ringAt(r + .1, .35, M.dark, "z", 0, 0, -4.5));
    for (const [x, y] of [[1, 0], [-1, 0], [0, -1]]) g.add(cyl(3.3, 3.3, 2.6, M.metal, x ? "x" : "y", x * (r + 1), y * (r + 1), 0, 20)); return g; };
  stack.add(node(0));                                                // node 1
  const lab = module(22, 6.2, M.lab); lab.position.z = 17; stack.add(lab);   // the lab (report)
  stack.add(node(33));                                               // node 2
  // side labs on node 2: a long one with an exposed experiment platform (+X), a short one (-X)
  const sideA = module(18, 5.6, M.lab, "x"); sideA.position.set(17, 0, 33); stack.add(sideA);
  const platform = new THREE.Group(); platform.position.set(33, -1, 33); stack.add(platform);
  platform.add(box(12, 1.2, 10, M.metal));
  for (let i = 0; i < 6; i++) platform.add(box(3, 2 + (i % 3), 3, [M.gold, M.dark, M.metal][i % 3], -4 + (i % 3) * 4, 1.5 + (i % 3) * .5, i < 3 ? -2.5 : 2.5));
  const logistics = module(7, 4.4, M.skin, "y"); logistics.position.set(17, 9.5, 33); stack.add(logistics);   // logistics module above the side lab
  const sideB = module(11, 5.6, M.lab, "x"); sideB.position.set(-13.5, 0, 33); stack.add(sideB);
  tag(lab, "report"); tag(sideA, "report"); tag(sideB, "report"); tag(platform, "report"); tag(logistics, "report");
  // forward: pressurized mating adapter + docking adapter + crew capsule (logs)
  const front = new THREE.Group(); front.position.z = 39; stack.add(front);
  front.add(cyl(2.6, 3.4, 5, M.skin, "z", 0, 0, 2.5));
  const dockRing = ringAt(2.8, .55, M.accent, "z", 0, 0, 5.4); front.add(dockRing);
  const capsule = new THREE.Group(); capsule.position.z = 6; front.add(capsule);
  capsule.add(cyl(4.2, 2.4, 6, M.metal, "z", 0, 0, 3));                                // capsule
  capsule.add(cyl(4.2, 4.2, 7, M.dark, "z", 0, 0, 9.5, 28));                           // trunk
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), M.solar); w.position.set(s * 11, 0, 10); w.rotation.x = Math.PI / 2; capsule.add(w); }
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; capsule.add(box(.8, .8, 1.2, M.dark, Math.cos(a) * 3.2, Math.sin(a) * 3.2, 2)); } // Draco pods
  tag(front, "logs");
  // nadir of node 1: the cupola (observation dome)
  const cupola = new THREE.Group(); cupola.position.set(0, -7.8, 0); stack.add(cupola);
  cupola.add(cyl(4.8, 4.2, 3, M.metal, "y", 0, 0, 0, 7));
  cupola.add(cyl(4.2, 2.4, 1.6, M.glass, "y", 0, -2.3, 0, 7));
  // aft: node 3, the hab-ring bearing, cargo module, service module with engines, cargo ship
  stack.add(node(-12, 6));
  const fgb = module(14, 5.2); fgb.position.z = -27; stack.add(fgb);
  const svc = new THREE.Group(); svc.position.z = -46; stack.add(svc);
  svc.add(cyl(4.4, 4.4, 9, M.skin, "z", 0, 0, 4));
  svc.add(cyl(6.6, 6.6, 12, M.gold, "z", 0, 0, -6.5));
  svc.add(cyl(6.6, 4.8, 3, M.dark, "z", 0, 0, -14));
  for (const s of [-1, 1]) {                                        // service-module solar wings
    const w = new THREE.Group(); w.position.set(s * 6.6, 0, -6); svc.add(w);
    w.add(cyl(.35, .35, 5, M.metal, "x", s * 2.5, 0, 0, 6));
    for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(6, 9), M.solar); p.position.set(s * (8 + k * 6.3), 0, 0); p.rotation.x = Math.PI / 2; w.add(p); }
  }
  const nozzles = [];
  for (const [x, y] of [[2, 0], [-2, 0]]) { const n = cyl(.8, 1.9, 3.2, M.engine, "z", x, y, -17, 18, true); svc.add(n); nozzles.push(n); }
  const burn = glowSprite(0x7fc8ff, 10, 0); burn.position.z = -20; svc.add(burn);
  const cargo = new THREE.Group(); cargo.position.z = -64; stack.add(cargo);
  cargo.add(cyl(2.4, 3.6, 3, M.dark, "z", 0, 0, 2));
  cargo.add(cyl(3.6, 3.6, 7, M.skin, "z", 0, 0, -3));
  cargo.add(cyl(3.6, 3.2, 4, M.metal, "z", 0, 0, -8.5));
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), M.solar); w.position.set(s * 8, 0, -8); w.rotation.x = Math.PI / 2; cargo.add(w); }
  tag(cargo, "logs");

  // ── rotating habitat ring around node 3 (dashboard) ─────────────────────────────────────
  const hab = new THREE.Group(); hab.position.set(0, Y, -12); body.add(hab);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(46, 4.4, 20, 160), M.ring); hab.add(ring);
  for (const r of [41.4, 50.6]) hab.add(new THREE.Mesh(new THREE.TorusGeometry(r, .45, 6, 160), M.dark));   // structural hoops
  hab.add(cyl(9, 9, 8, M.metal, "z"));                                          // bearing hub
  const hubBand = cyl(9.2, 9.2, 1.4, M.accent, "z"); hab.add(hubBand);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, spoke = new THREE.Group(); spoke.rotation.z = a; hab.add(spoke);
    spoke.add(cyl(1.3, 1.3, 33, M.metal, "x", 25, 0, 0, 12));                    // spoke tube (elevator shaft)
    spoke.add(cyl(1.9, 1.9, 2.4, M.dark, "x", 15, 0, 0, 12));
    spoke.add(box(3.2, 3.2, 3.2, M.metal, 30, 0, 0));                           // elevator car
    spoke.add(box(6, 2.4, 9.5, M.skin, 46, 0, 0));                               // ring module joint
  }
  tag(hab, "dashboard");

  // ── robotic arm on the mobile base (front face of the truss) ────────────────────────────
  const arm = new THREE.Group(); arm.position.set(-8, -S / 2, S / 2 + 1.5); body.add(arm);
  arm.add(box(6, 1.6, 4, M.dark));
  const sh = new THREE.Group(); sh.position.y = -1; arm.add(sh);
  sh.add(cyl(1, 1, 2.2, M.metal, "y", 0, -1, 0, 12));
  const boom1 = new THREE.Group(); boom1.position.y = -2.2; sh.add(boom1);
  boom1.add(cyl(.75, .75, 22, M.skin, "y", 0, -11, 0, 12));
  const elbow = new THREE.Group(); elbow.position.y = -22; boom1.add(elbow);
  elbow.add(cyl(1.1, 1.1, 2, M.metal, "x", 0, 0, 0, 12));
  elbow.add(cyl(.75, .75, 22, M.skin, "y", 0, -11, 0, 12));
  elbow.add(cyl(1, .6, 2.4, M.dark, "y", 0, -23, 0, 12));

  // ── communications: high-gain dish on a mast above the truss (logs) ─────────────────────
  const comms = new THREE.Group(); comms.position.set(10, S / 2, 0); body.add(comms);
  comms.add(cyl(.5, .5, 11, M.metal, "y", 0, 5.5, 0, 8));
  const dishG = new THREE.Group(); dishG.position.y = 11.5; comms.add(dishG);
  const prof = []; for (let i = 0; i <= 12; i++) { const r = i / 12 * 6.5; prof.push(new THREE.Vector2(r, r * r * .06)); }
  const dish = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), new THREE.MeshStandardMaterial({ color: 0xe9ecf1, metalness: .3, roughness: .45, side: THREE.DoubleSide }));
  dish.rotation.x = Math.PI / 2 - .5; dishG.add(dish);
  dishG.add(cyl(.18, .18, 4.6, M.metal, "z", 0, 1.1, 2.1, 6));
  const feed = new THREE.Mesh(new THREE.SphereGeometry(.6, 10, 8), M.accent); feed.position.set(0, 2.2, 4.2); dishG.add(feed);
  const dishFlash = glowSprite(0x63d4ff, 18, 0); dishFlash.position.copy(feed.position); dishG.add(dishFlash);
  const wave = new THREE.Mesh(new THREE.RingGeometry(.8, 1.2, 40), new THREE.MeshBasicMaterial({ color: 0x63d4ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  wave.position.copy(feed.position); wave.rotation.x = -.5; dishG.add(wave);
  tag(comms, "logs");
  // secondary S-band antenna boom on the other side
  body.add(cyl(.35, .35, 8, M.metal, "y", -12, S / 2 + 4, 0, 6));
  body.add(box(2.6, 2.6, .4, M.metal, -12, S / 2 + 8.4, 0));

  // ── lights: navigation (port red / starboard green), strobes, failure beacons ───────────
  const nav = [];
  const navLight = (color, x, y, z, period, phase) => { const s = glowSprite(color, 9, .95); s.position.set(x, y, z); body.add(s); nav.push({ s, period, phase }); };
  navLight(0xff3344, -L / 2 - 2, 0, 0, 1600, 0);
  navLight(0x33ff77, L / 2 + 2, 0, 0, 1600, 0);
  navLight(0xffffff, 0, Y, -76, 1100, .3);
  navLight(0xffffff, 0, S / 2 + 2.5, 0, 1100, .8);
  const beacons = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Mesh(new THREE.SphereGeometry(.9, 10, 8), new THREE.MeshBasicMaterial({ color: 0x3a3f48 }));
    g.position.set(-12.5 + i * 5, -S / 2 - .6, S / 2 + .6); body.add(g);
    const halo = glowSprite(0xff3b3b, 7, 0); halo.position.copy(g.position); body.add(halo);
    beacons.push({ g, halo });
  }
  // station name plate glow under the hub, dims in light mode
  const coreGlow = glowSprite(0x63d4ff, 120, .18); coreGlow.position.set(0, Y, 0); body.add(coreGlow);

  // ── animation state ──────────────────────────────────────────────────────────────────────
  const fx = { log: 0, report: 0, reportT: 0, burn: 0 };
  const HEALTH = { ok: new THREE.Color(0x3ddc84), busy: new THREE.Color(0x63d4ff), warn: new THREE.Color(0xfab219), bad: new THREE.Color(0xff4d4d) };
  const ringCol = HEALTH.ok.clone();
  let dark = true, fade = 1;

  function update(now, dt, s) {
    // s: { health: 'ok'|'busy'|'warn'|'bad', failing: n, frozen: bool }
    hab.rotation.z += dt / 1000 * .22;                              // spin gravity
    for (const o of sarjs) o.rotation.x = Math.sin(now / 9000) * .6;  // sun tracking
    arrays.forEach((w, i) => { w.rotation.y = Math.sin(now / 7000 + i) * .12; });
    radiators.forEach((r, i) => { r.rotation.x = Math.sin(now / 8000 + i * 2) * .25 - .15; });
    sh.rotation.y = Math.sin(now / 5200) * .9;
    boom1.rotation.z = -.5 + Math.sin(now / 4300) * .25;
    elbow.rotation.z = 1.3 + Math.sin(now / 3700 + 1) * .35;
    dishG.rotation.y = Math.sin(now / 6000) * .8;

    ringCol.lerp(HEALTH[s.health] || HEALTH.ok, Math.min(1, dt / 500));
    M.ring.emissive.copy(ringCol);
    M.ring.emissiveIntensity = (dark ? 1.25 : .55) * (s.health === "bad" ? .75 + .45 * Math.sin(now / 160) ** 2 : 1);
    M.accent.color.copy(dark ? ringCol : new THREE.Color(0x1f5fa8));

    // report: window rows scan along the labs while a report builds
    if (fx.report > 0) fx.report = Math.max(0, fx.report - dt / 1600);
    labWin.offset.y = fx.report > 0 ? (now / 700) % 1 : 0;
    M.lab.emissiveIntensity = (dark ? .45 : .2) + fx.report * 1.6;
    // logs: dish flash + a widening wave from the feed horn
    if (fx.log > 0) fx.log = Math.max(0, fx.log - dt / 1300);
    dishFlash.material.opacity = (dark ? fx.log * .95 : 0) * fade;
    wave.material.opacity = fx.log * (dark ? .8 : .5) * fade;
    wave.scale.setScalar(1 + (1 - fx.log) * 9);
    // engines: an occasional station-keeping burn
    fx.burn = Math.max(0, fx.burn - dt / 900);
    if (Math.random() < dt / 14000) fx.burn = 1;
    burn.material.opacity = (dark ? fx.burn * .9 : 0) * fade;
    // lights
    for (const n of nav) { const ph = ((now / n.period) + n.phase) % 1; n.s.material.opacity = (ph < .12 ? .95 : dark ? .08 : 0) * fade; }
    beacons.forEach((b, i) => {
      const on = i < s.failing;
      b.g.material.color.set(on ? (Math.sin(now / 220 + i) > 0 ? 0xff3b3b : 0x7a1010) : (dark ? 0x3a3f48 : 0x9aa0aa));
      b.halo.material.opacity = (on && dark ? .6 + .3 * Math.sin(now / 220 + i) : 0) * fade;
    });
    coreGlow.material.opacity = (dark ? .14 + .05 * Math.sin(now / 1300) : 0) * fade;
    if (!s.frozen) body.rotation.y = Math.sin(now / 21000) * .25;
  }
  function setTheme(isDark) {
    dark = isDark;
    for (const m of glowMats) { m.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending; m.needsUpdate = true; }
    M.solar.emissiveIntensity = isDark ? .35 : .05;
    M.glass.emissiveIntensity = isDark ? .35 : .05;
    M.gold.emissiveIntensity = isDark ? .25 : 0;
  }
  // spotlight on something else: the whole station turns see-through (f = 1 restores it)
  let fadeMats = null;
  function setFade(f) {
    fade = f;
    if (!fadeMats) {
      fadeMats = new Map();
      const animated = new Set([...glowMats, wave.material]);           // update() fades these itself
      body.traverse(o => { for (const m of [].concat(o.material || [])) if (!animated.has(m) && !fadeMats.has(m)) fadeMats.set(m, { o: m.opacity, t: m.transparent }); });
    }
    for (const [m, b] of fadeMats) { m.transparent = b.t || f < 1; m.opacity = b.o * f; }
  }
  return {
    root, body, pickables, update, setTheme, setFade,
    ping: kind => { if (kind === "log") fx.log = 1; else if (kind === "report") fx.report = 1; },
    // where each part sits (body space): the camera aims there when a tab is opened
    anchors: { dashboard: new THREE.Vector3(0, Y, -12), report: new THREE.Vector3(0, Y, 20), logs: new THREE.Vector3(10, 16, 0) },
  };
}
