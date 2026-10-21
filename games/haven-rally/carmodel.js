/* Haven Rally — Apex Mk I chassis. Procedural GT, PBR, garage turntable. */
(function (global) {
  "use strict";
  var envCache = null;
  var studio = {
    raf: 0, renderer: null, scene: null, camera: null, canvas: null,
    car: null, clock: null, yaw: 0.72, pitch: 0.16, drag: false, lx: 0, ly: 0
  };

  function mat(T, spec, ghost) {
    var m = new T.MeshPhysicalMaterial(spec);
    if (ghost) {
      m.transparent = true;
      m.opacity = spec.opacity != null ? spec.opacity : 0.3;
      m.depthWrite = false;
      m.emissive = new T.Color(0x4c1d95);
      m.emissiveIntensity = 0.22;
    }
    return m;
  }

  function carbonTex(T) {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var x, y;
    for (y = 0; y < 64; y++) {
      for (x = 0; x < 64; x++) {
        g.fillStyle = ((x >> 2) + (y >> 2)) & 1 ? "#1a1a1a" : "#0b0b0b";
        g.fillRect(x, y, 1, 1);
      }
    }
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(8, 3);
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }

  function latticeTex(T) {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var g = c.getContext("2d");
    g.fillStyle = "#0a0c10";
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "#4b5563";
    g.lineWidth = 2;
    var k;
    for (k = -128; k < 256; k += 10) {
      g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 128, 128); g.stroke();
      g.beginPath(); g.moveTo(k, 128); g.lineTo(k + 128, 0); g.stroke();
    }
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(2, 1.4);
    t.needsUpdate = true;
    return t;
  }

  function bakeEnv(T, renderer) {
    if (envCache) return envCache;
    var sc = new T.Scene();
    sc.background = new T.Color(0x141c28);
    sc.add(new T.HemisphereLight(0xe8f2ff, 0x1a2a28, 1.1));
    function panel(col, w, h, x, y, z, rx, ry) {
      var m = new T.Mesh(
        new T.PlaneGeometry(w, h),
        new T.MeshBasicMaterial({ color: col, side: T.DoubleSide })
      );
      m.position.set(x, y, z);
      if (rx) m.rotation.x = rx;
      if (ry) m.rotation.y = ry;
      sc.add(m);
    }
    panel(0x5eead4, 18, 10, -12, 6, -4, 0, 0.7);
    panel(0xfbbf24, 12, 8, 14, 5, 2, 0, -0.8);
    panel(0xffffff, 20, 8, 0, 14, 0, 1.2, 0);
    panel(0x334455, 40, 40, 0, 0, 0, -Math.PI / 2, 0);
    var pmrem = new T.PMREMGenerator(renderer);
    envCache = pmrem.fromScene(sc, 0.06).texture;
    pmrem.dispose();
    return envCache;
  }

  function lerpNum(a, b, t) { return a + (b - a) * t; }
  function lerpSlice(a, b, t) {
    function n(k, d) {
      var av = a[k], bv = b[k];
      if (av == null && bv == null) return d;
      if (av == null) av = d;
      if (bv == null) bv = d;
      return lerpNum(av, bv, t);
    }
    return {
      z: lerpNum(a.z, b.z, t),
      w: lerpNum(a.w, b.w, t),
      y0: lerpNum(a.y0, b.y0, t),
      y1: lerpNum(a.y1, b.y1, t),
      yr: n("yr", lerpNum(a.y1, b.y1, t)),
      wr: n("wr", lerpNum(a.w, b.w, t) * 0.55),
      well: n("well", 0)
    };
  }

  function densify(ctrl, step) {
    var out = [], i, a, b, d, n, k;
    for (i = 0; i < ctrl.length - 1; i++) {
      a = ctrl[i]; b = ctrl[i + 1];
      d = Math.abs(b.z - a.z) || 0.01;
      n = Math.max(1, Math.ceil(d / step));
      for (k = 0; k < n; k++) out.push(lerpSlice(a, b, k / n));
    }
    out.push(ctrl[ctrl.length - 1]);
    return out;
  }

  var RING = 16;
  function ringOf(sl) {
    var w = sl.w, y0 = sl.y0, y1 = sl.y1, z = sl.z;
    var yr = sl.yr != null ? sl.yr : y1;
    var wr = sl.wr != null ? sl.wr : w * 0.55;
    var well = sl.well || 0;
    var yw = y1 + (yr - y1) * 0.42;
    var ww = w * 0.76 + wr * 0.24;
    var ySill = y0 + 0.06 + well * 0.32;
    var wSill = w * (1 - 0.5 * well);
    var wFlare = w * (1 + 0.1 * well);
    var yDoor = y0 * 0.22 + y1 * 0.78;
    var yArch = ySill + 0.12 + well * 0.28;
    var wArch = wSill + (wFlare - wSill) * (0.55 + 0.35 * well);
    var mag = [
      [w * 0.18, y0],
      [wSill, ySill],
      [wArch, yArch],
      [wFlare, yDoor],
      [wFlare, y1],
      [ww, yw],
      [wr, yr],
      [Math.max(0.07, wr * 0.3), yr]
    ];
    var out = [], i;
    for (i = 0; i < 8; i++) out.push(-mag[i][0], mag[i][1], z);
    for (i = 7; i >= 0; i--) out.push(mag[i][0], mag[i][1], z);
    return out;
  }

  function loft(T, slices, ringFn, count) {
    var pos = [], idx = [], i, p, s, ring;
    for (i = 0; i < slices.length; i++) {
      ring = ringFn(slices[i]);
      for (p = 0; p < ring.length; p++) pos.push(ring[p]);
    }
    for (s = 0; s < slices.length - 1; s++) {
      var a = s * count, b = (s + 1) * count;
      for (i = 0; i < count; i++) {
        var j = (i + 1) % count;
        idx.push(a + i, b + i, a + j);
        idx.push(a + j, b + i, b + j);
      }
    }
    var g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function capGeometry(T, sl) {
    var r = ringOf(sl);
    var pts = [], i;
    for (i = 0; i < RING; i++) pts.push(new T.Vector2(r[i * 3], r[i * 3 + 1]));
    var sh = new T.Shape(pts);
    var g = new T.ShapeGeometry(sh);
    g.translate(0, 0, sl.z);
    g.computeVertexNormals();
    return g;
  }

  function glassRing(sl) {
    var r = ringOf(sl);
    var pick = [4, 5, 6, 7, 8, 9, 10, 11];
    var out = [], i, ix, x, y, z, inset;
    for (i = 0; i < pick.length; i++) {
      ix = pick[i] * 3;
      x = r[ix]; y = r[ix + 1]; z = r[ix + 2];
      inset = 0.045;
      out.push(x + (x >= 0 ? -inset : inset), y + 0.012, z);
    }
    return out;
  }

  function makeWheel(T, mats, y, x, z, steer, rad) {
    rad = rad || 0.34;
    var sc = rad / 0.34;
    var root = new T.Group();
    root.position.set(x, y, z);
    if (steer) root.userData.steer = true;
    var spin = new T.Group();
    spin.userData.spin = true;
    root.add(spin);

    var tire = new T.Mesh(new T.CylinderGeometry(rad, rad, 0.24 * sc + 0.02, 48), mats.rubber);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    spin.add(tire);
    var sidewall = new T.Mesh(new T.CylinderGeometry(rad * 0.985, rad * 0.79, 0.18 * sc, 40), mats.rubberSoft);
    sidewall.rotation.z = Math.PI / 2;
    spin.add(sidewall);
    var lip = new T.Mesh(new T.CylinderGeometry(rad * 0.79, rad * 0.79, 0.045, 36), mats.chrome);
    lip.rotation.z = Math.PI / 2;
    lip.position.x = x > 0 ? 0.09 * sc : -0.09 * sc;
    spin.add(lip);
    var disc = new T.Mesh(new T.CylinderGeometry(rad * 0.62, rad * 0.62, 0.028, 36), mats.disc);
    disc.rotation.z = Math.PI / 2;
    spin.add(disc);
    var hub = new T.Mesh(new T.CylinderGeometry(0.065 * sc, 0.065 * sc, 0.11, 16), mats.chrome);
    hub.rotation.z = Math.PI / 2;
    spin.add(hub);
    var si, a, spoke;
    for (si = 0; si < 5; si++) {
      a = (si / 5) * Math.PI * 2;
      spoke = new T.Mesh(new T.BoxGeometry(0.032, 0.17 * sc, 0.038), mats.chrome);
      spoke.rotation.x = a;
      spoke.position.set(0, Math.cos(a) * 0.12 * sc, Math.sin(a) * 0.12 * sc);
      spin.add(spoke);
    }
    var cal = new T.Mesh(new T.BoxGeometry(0.06, 0.1, 0.15), mats.gold);
    cal.position.set(x > 0 ? 0.1 : -0.1, 0.16 * sc, 0);
    root.add(cal);
    return root;
  }

  function addBoostFlamesAt(g, T, ghost, y, z, spread) {
    spread = spread == null ? 0.28 : spread;
    function one(sign) {
      var flameMat = new T.MeshBasicMaterial({
        color: 0xff5a12, transparent: true, opacity: 0,
        blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
      });
      var coreMat = new T.MeshBasicMaterial({
        color: 0xffe08a, transparent: true, opacity: 0,
        blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
      });
      var flame = new T.Mesh(new T.ConeGeometry(0.075, 0.48, 7, 1, true), flameMat);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(spread * sign, y, z + 0.26);
      flame.userData.boostFx = true;
      var core = new T.Mesh(new T.ConeGeometry(0.038, 0.28, 6, 1, true), coreMat);
      core.rotation.x = -Math.PI / 2;
      core.position.set(spread * sign, y, z + 0.18);
      core.userData.boostFx = true;
      g.add(flame, core);
      if (!ghost) {
        var lite = new T.PointLight(0xff6a18, 0, 9, 2);
        lite.position.set(spread * sign, y + 0.02, z + 0.14);
        lite.userData.boostFx = true;
        g.add(lite);
      }
    }
    one(-1);
    one(1);
  }

  function paintMats(T, paintCol, envMap, ghost) {
    var carbon = carbonTex(T);
    var lat = latticeTex(T);
    return {
      paint: mat(T, {
        color: paintCol, metalness: 0.78, roughness: 0.16, clearcoat: 1,
        clearcoatRoughness: 0.07, sheen: 0.45, sheenColor: new T.Color(0x7eeae0),
        envMap: envMap, envMapIntensity: 1.3
      }, ghost),
      dark: mat(T, { color: 0x0b0d12, metalness: 0.4, roughness: 0.45, envMap: envMap }, ghost),
      carbon: mat(T, { color: 0x222, metalness: 0.55, roughness: 0.38, map: carbon, envMap: envMap }, ghost),
      glass: mat(T, {
        color: 0x081018, metalness: 0.12, roughness: 0.035, transparent: true,
        opacity: ghost ? 0.16 : 0.42, envMap: envMap, envMapIntensity: 1.7
      }, false),
      chrome: mat(T, { color: 0x9aa3ad, metalness: 1, roughness: 0.12, envMap: envMap }, ghost),
      gold: mat(T, { color: 0xfbbf24, metalness: 0.92, roughness: 0.2, envMap: envMap }, ghost),
      rubber: mat(T, { color: 0x111111, metalness: 0.05, roughness: 0.92 }, ghost),
      rubberSoft: mat(T, { color: 0x1a1a1a, metalness: 0.04, roughness: 0.86 }, ghost),
      disc: mat(T, { color: 0x6b7280, metalness: 0.85, roughness: 0.28, envMap: envMap }, ghost),
      lattice: mat(T, { color: 0x1f2937, metalness: 0.5, roughness: 0.4, map: lat, envMap: envMap }, ghost),
      liner: mat(T, { color: 0x1a1512, metalness: 0.08, roughness: 0.92 }, ghost),
      amber: new T.MeshStandardMaterial({
        color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: ghost ? 0.2 : 1.4,
        roughness: 0.3, transparent: ghost, opacity: ghost ? 0.3 : 1
      }),
      wood: mat(T, { color: 0x5c4033, metalness: 0.08, roughness: 0.78, envMap: envMap }, ghost),
      light: new T.MeshStandardMaterial({
        color: 0xdffcff, emissive: 0x5eead4, emissiveIntensity: ghost ? 0.4 : 3.6,
        roughness: 0.12, metalness: 0.15, transparent: ghost, opacity: ghost ? 0.3 : 1
      }),
      head: new T.MeshStandardMaterial({
        color: 0xfff4d4, emissive: 0xffe7b0, emissiveIntensity: ghost ? 0.35 : 3.4,
        roughness: 0.16, metalness: 0.18, transparent: ghost, opacity: ghost ? 0.3 : 1
      }),
      tail: new T.MeshStandardMaterial({
        color: 0x3b0000, emissive: 0xff2211, emissiveIntensity: ghost ? 0.18 : 0.5,
        roughness: 0.28, transparent: ghost, opacity: ghost ? 0.3 : 1
      })
    };
  }

  function buildTruck(T, opts) {
    var ghost = !!opts.ghost;
    var paintCol = opts.paint != null ? opts.paint : 0x8b1e1e;
    var envMap = opts.envMap || null;
    var g = new T.Group();
    var mats = paintMats(T, paintCol, envMap, ghost);
    function box(w, h, d, x, y, z, m, rx, ry) {
      var mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m || mats.paint);
      mesh.position.set(x, y, z);
      if (rx) mesh.rotation.x = rx;
      if (ry) mesh.rotation.y = ry;
      if (!ghost) mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    }
    function cyl(rt, rb, h, x, y, z, m, rx, rz) {
      var mesh = new T.Mesh(new T.CylinderGeometry(rt, rb, h, 14), m);
      mesh.position.set(x, y, z);
      if (rx) mesh.rotation.x = rx;
      if (rz) mesh.rotation.z = rz;
      g.add(mesh);
      return mesh;
    }

    var ctrl = [
      { z: -2.52, w: 0.18, y0: 0.24, y1: 0.36 },
      { z: -2.38, w: 0.78, y0: 0.16, y1: 0.54 },
      { z: -2.18, w: 1.04, y0: 0.14, y1: 0.64 },
      { z: -1.98, w: 1.10, y0: 0.14, y1: 0.70 },
      { z: -1.72, w: 1.12, y0: 0.15, y1: 0.72, well: 0.35 },
      { z: -1.42, w: 1.13, y0: 0.15, y1: 0.74, well: 1 },
      { z: -1.18, w: 1.12, y0: 0.15, y1: 0.75, well: 0.7 },
      { z: -0.92, w: 1.06, y0: 0.16, y1: 0.78, well: 0.12, yr: 0.98, wr: 0.82 },
      { z: -0.62, w: 1.04, y0: 0.16, y1: 0.82, yr: 1.22, wr: 0.74 },
      { z: -0.28, w: 1.03, y0: 0.16, y1: 0.84, yr: 1.42, wr: 0.70 },
      { z: 0.08, w: 1.03, y0: 0.16, y1: 0.84, yr: 1.44, wr: 0.69 },
      { z: 0.42, w: 1.03, y0: 0.16, y1: 0.84, yr: 1.40, wr: 0.70 },
      { z: 0.62, w: 1.04, y0: 0.16, y1: 0.82, yr: 1.16, wr: 0.76 },
      { z: 0.78, w: 1.05, y0: 0.17, y1: 0.70 },
      { z: 0.92, w: 1.08, y0: 0.17, y1: 0.58 },
      { z: 1.18, w: 1.10, y0: 0.17, y1: 0.58, well: 0.25 },
      { z: 1.42, w: 1.14, y0: 0.18, y1: 0.58, well: 0.9 },
      { z: 1.62, w: 1.16, y0: 0.18, y1: 0.58, well: 1 },
      { z: 1.86, w: 1.14, y0: 0.18, y1: 0.59, well: 0.55 },
      { z: 2.12, w: 1.08, y0: 0.19, y1: 0.62, well: 0.1 },
      { z: 2.36, w: 1.02, y0: 0.20, y1: 0.64 },
      { z: 2.52, w: 0.94, y0: 0.22, y1: 0.62 }
    ];
    var slices = densify(ctrl, 0.042);
    var body = new T.Mesh(loft(T, slices, ringOf, RING), mats.paint);
    body.castShadow = !ghost;
    body.receiveShadow = true;
    g.add(body);

    var glassCtrl = slices.filter(function (s) { return s.yr != null && s.yr > s.y1 + 0.16; });
    if (glassCtrl.length > 2) {
      var cabin = new T.Mesh(loft(T, glassCtrl, glassRing, 8), mats.glass);
      cabin.renderOrder = 2;
      g.add(cabin);
    }
    box(1.12, 0.44, 0.04, 0, 1.14, 0.70, mats.glass);
    box(0.04, 0.38, 0.9, -0.98, 1.10, -0.08, mats.glass);
    box(0.04, 0.38, 0.9, 0.98, 1.10, -0.08, mats.glass);
    box(0.03, 0.36, 0.04, -0.72, 1.08, -0.58, mats.chrome);
    box(0.03, 0.36, 0.04, 0.72, 1.08, -0.58, mats.chrome);

    var interior = box(1.12, 0.28, 1.05, 0, 0.78, -0.02, mats.dark);
    interior.castShadow = false;
    box(0.52, 0.22, 0.42, -0.28, 0.72, 0.12, mats.dark);
    box(0.52, 0.22, 0.42, 0.28, 0.72, 0.12, mats.dark);
    var wheel = new T.Mesh(new T.TorusGeometry(0.12, 0.018, 8, 18), mats.dark);
    wheel.position.set(-0.32, 0.92, -0.42);
    wheel.rotation.x = 0.35;
    g.add(wheel);
    box(0.46, 0.08, 0.36, 0, 0.86, -0.48, mats.dark);

    g.add(new T.Mesh(capGeometry(T, slices[0]), mats.chrome));

    box(2.18, 0.14, 0.24, 0, 0.27, -2.46, mats.chrome);
    box(0.16, 0.08, 0.28, -1.02, 0.27, -2.52, mats.chrome);
    box(0.16, 0.08, 0.28, 1.02, 0.27, -2.52, mats.chrome);
    box(0.07, 0.26, 0.14, -0.82, 0.36, -2.54, mats.chrome);
    box(0.07, 0.26, 0.14, 0.82, 0.36, -2.54, mats.chrome);
    box(0.22, 0.04, 0.08, 0, 0.36, -2.56, mats.dark);
    box(2.08, 0.045, 0.42, 0, 0.13, -2.30, mats.carbon);
    box(0.22, 0.08, 0.28, -1.08, 0.18, -2.18, mats.carbon);
    box(0.22, 0.08, 0.28, 1.08, 0.18, -2.18, mats.carbon);

    box(1.08, 0.42, 0.06, 0, 0.52, -2.24, mats.dark);
    box(0.96, 0.34, 0.07, 0, 0.52, -2.28, mats.lattice);
    box(1.02, 0.025, 0.04, 0, 0.62, -2.31, mats.chrome);
    box(1.02, 0.025, 0.04, 0, 0.42, -2.31, mats.chrome);
    box(0.025, 0.36, 0.04, -0.50, 0.52, -2.31, mats.chrome);
    box(0.025, 0.36, 0.04, 0.50, 0.52, -2.31, mats.chrome);

    function headlamp(sign) {
      var bucket = cyl(0.13, 0.13, 0.08, 0.68 * sign, 0.52, -2.30, mats.chrome, Math.PI / 2, 0);
      bucket.rotation.y = 0.08 * sign;
      var ring = cyl(0.125, 0.118, 0.03, 0.68 * sign, 0.52, -2.35, mats.chrome, Math.PI / 2, 0);
      var lens = new T.Mesh(new T.SphereGeometry(0.11, 18, 14), mats.head);
      lens.position.set(0.68 * sign, 0.52, -2.36);
      lens.scale.set(1.05, 1.05, 0.48);
      lens.userData.head = true;
      g.add(lens);
      var park = new T.Mesh(new T.BoxGeometry(0.12, 0.07, 0.05), mats.amber);
      park.position.set(0.92 * sign, 0.40, -2.28);
      g.add(park);
    }
    headlamp(-1);
    headlamp(1);

    box(0.72, 0.055, 1.18, 0, 0.82, -1.28, mats.paint);
    box(0.28, 0.04, 0.85, -0.38, 0.81, -1.28, mats.dark);
    box(0.28, 0.04, 0.85, 0.38, 0.81, -1.28, mats.dark);
    box(1.85, 0.03, 0.16, 0, 0.76, -0.78, mats.dark);
    box(0.02, 0.015, 0.28, -0.22, 0.79, -0.88, mats.dark, 0.45, 0);
    box(0.02, 0.015, 0.32, 0.18, 0.79, -0.90, mats.dark, 0.5, 0);
    box(0.04, 0.05, 0.04, -0.55, 0.84, -1.72, mats.chrome);
    box(0.04, 0.05, 0.04, 0.55, 0.84, -1.72, mats.chrome);

    box(2.08, 0.035, 0.04, 0, 0.86, 0.62, mats.chrome);
    box(0.04, 0.08, 1.55, -1.04, 0.88, -0.05, mats.chrome);
    box(0.04, 0.08, 1.55, 1.04, 0.88, -0.05, mats.chrome);
    box(0.10, 0.04, 0.18, -1.08, 0.72, -0.22, mats.chrome);
    box(0.10, 0.04, 0.18, 1.08, 0.72, -0.22, mats.chrome);

    box(2.08, 0.55, 0.08, 0, 0.78, 0.80, mats.paint);
    box(0.08, 0.42, 0.08, -0.55, 1.12, 0.78, mats.dark);
    box(0.08, 0.42, 0.08, 0.55, 1.12, 0.78, mats.dark);

    box(1.92, 0.045, 1.58, 0, 0.445, 1.62, mats.wood);
    var rib, ri;
    for (ri = 0; ri < 8; ri++) {
      rib = box(1.82, 0.02, 0.04, 0, 0.475, 0.95 + ri * 0.18, mats.dark);
      rib.castShadow = false;
    }
    box(1.96, 0.54, 0.07, 0, 0.68, 2.42, mats.paint);
    box(1.55, 0.05, 0.04, 0, 0.82, 2.47, mats.gold);
    box(1.55, 0.05, 0.04, 0, 0.54, 2.47, mats.gold);
    box(0.22, 0.06, 0.05, 0, 0.68, 2.48, mats.chrome);
    box(0.06, 0.09, 1.52, -0.96, 0.74, 1.62, mats.chrome);
    box(0.06, 0.09, 1.52, 0.96, 0.74, 1.62, mats.chrome);
    box(0.07, 0.12, 0.09, -0.96, 0.78, 1.05, mats.dark);
    box(0.07, 0.12, 0.09, 0.96, 0.78, 1.05, mats.dark);
    box(0.07, 0.12, 0.09, -0.96, 0.78, 2.15, mats.dark);
    box(0.07, 0.12, 0.09, 0.96, 0.78, 2.15, mats.dark);
    box(0.09, 0.16, 0.09, -1.02, 0.62, 0.88, mats.chrome);
    box(0.16, 0.04, 0.22, 1.08, 0.58, 0.55, mats.dark);

    var flareL = cyl(0.42, 0.42, 0.16, -1.10, 0.42, 1.58, mats.paint, 0, Math.PI / 2);
    flareL.scale.set(1, 0.72, 1);
    var flareR = cyl(0.42, 0.42, 0.16, 1.10, 0.42, 1.58, mats.paint, 0, Math.PI / 2);
    flareR.scale.set(1, 0.72, 1);
    var fFlareL = cyl(0.38, 0.38, 0.14, -1.08, 0.40, -1.32, mats.paint, 0, Math.PI / 2);
    fFlareL.scale.set(1, 0.7, 1);
    var fFlareR = cyl(0.38, 0.38, 0.14, 1.08, 0.40, -1.32, mats.paint, 0, Math.PI / 2);
    fFlareR.scale.set(1, 0.7, 1);

    var hoop = new T.Mesh(new T.TorusGeometry(0.84, 0.032, 10, 24, Math.PI), mats.chrome);
    hoop.rotation.z = Math.PI / 2;
    hoop.position.set(0, 1.08, 0.98);
    g.add(hoop);
    var hoop2 = new T.Mesh(new T.TorusGeometry(0.78, 0.026, 8, 20, Math.PI), mats.chrome);
    hoop2.rotation.z = Math.PI / 2;
    hoop2.position.set(0, 1.02, 1.22);
    g.add(hoop2);
    cyl(0.03, 0.03, 0.78, -0.84, 0.88, 0.98, mats.chrome, 0, 0);
    cyl(0.03, 0.03, 0.78, 0.84, 0.88, 0.98, mats.chrome, 0, 0);
    cyl(0.026, 0.026, 0.7, -0.78, 0.84, 1.22, mats.chrome, 0, 0);
    cyl(0.026, 0.026, 0.7, 0.78, 0.84, 1.22, mats.chrome, 0, 0);
    box(1.62, 0.04, 0.04, 0, 1.48, 1.10, mats.chrome);
    box(1.62, 0.07, 0.1, 0, 1.88, 0.98, mats.dark);
    var li, pod;
    for (li = -2; li <= 2; li++) {
      pod = box(0.18, 0.09, 0.11, li * 0.30, 1.88, 0.92, mats.head);
      pod.userData.head = true;
    }
    box(0.55, 0.28, 0.42, 0, 0.62, 1.35, mats.dark);

    function tailStack(sign) {
      var bezel = box(0.16, 0.46, 0.08, 0.90 * sign, 0.64, 2.46, mats.chrome);
      var upper = box(0.12, 0.16, 0.05, 0.90 * sign, 0.76, 2.50, mats.tail);
      upper.userData.brake = true;
      var mid = box(0.12, 0.1, 0.05, 0.90 * sign, 0.64, 2.50, mats.amber);
      var lower = box(0.12, 0.12, 0.05, 0.90 * sign, 0.52, 2.50, mats.tail);
      lower.userData.brake = true;
    }
    tailStack(-1);
    tailStack(1);

    box(2.02, 0.11, 0.18, 0, 0.25, 2.54, mats.chrome);
    box(0.7, 0.03, 0.14, 0, 0.32, 2.56, mats.dark);

    box(0.045, 0.04, 3.85, -1.08, 0.71, 0.02, mats.gold);
    box(0.045, 0.04, 3.85, 1.08, 0.71, 0.02, mats.gold);
    box(0.24, 0.035, 1.28, -1.14, 0.21, -0.12, mats.chrome);
    box(0.24, 0.035, 1.28, 1.14, 0.21, -0.12, mats.chrome);
    box(0.05, 0.12, 1.2, -1.06, 0.18, -0.15, mats.carbon);
    box(0.05, 0.12, 1.2, 1.06, 0.18, -0.15, mats.carbon);

    box(0.24, 0.035, 0.035, -1.08, 0.94, -0.52, mats.dark);
    box(0.17, 0.1, 0.035, -1.24, 0.94, -0.52, mats.chrome);
    box(0.24, 0.035, 0.035, 1.08, 0.94, -0.52, mats.dark);
    box(0.17, 0.1, 0.035, 1.24, 0.94, -0.52, mats.chrome);
    cyl(0.012, 0.012, 0.85, 1.02, 1.28, 0.05, mats.chrome, 0.18, 0);

    cyl(0.048, 0.048, 0.22, -0.36, 0.22, 2.56, mats.chrome, Math.PI / 2, 0);
    cyl(0.048, 0.048, 0.22, 0.36, 0.22, 2.56, mats.chrome, Math.PI / 2, 0);
    cyl(0.055, 0.05, 0.05, -0.36, 0.22, 2.66, mats.chrome, Math.PI / 2, 0);
    cyl(0.055, 0.05, 0.05, 0.36, 0.22, 2.66, mats.chrome, Math.PI / 2, 0);
    addBoostFlamesAt(g, T, ghost, 0.22, 2.56, 0.36);

    var badge = new T.Mesh(new T.CircleGeometry(0.075, 20), mats.gold);
    badge.position.set(0, 0.64, -2.32);
    g.add(badge);
    box(0.22, 0.04, 0.02, 0, 0.55, -2.32, mats.gold);

    box(0.14, 0.06, 0.18, -0.95, 0.22, -2.38, mats.dark);
    box(1.6, 0.08, 0.08, 0, 0.20, 0.2, mats.dark);
    box(1.5, 0.08, 0.08, 0, 0.20, 1.7, mats.dark);

    g.add(makeWheel(T, mats, 0.38, -0.94, -1.32, true, 0.36));
    g.add(makeWheel(T, mats, 0.38, 0.94, -1.32, true, 0.36));
    g.add(makeWheel(T, mats, 0.42, -0.98, 1.58, false, 0.40));
    g.add(makeWheel(T, mats, 0.42, 0.98, 1.58, false, 0.40));
    g.userData.body = "boxcut";
    return g;
  }

  function buildHatch(T, opts) {
    var ghost = !!opts.ghost;
    var paintCol = opts.paint != null ? opts.paint : 0xc2410c;
    var envMap = opts.envMap || null;
    var g = new T.Group();
    var mats = paintMats(T, paintCol, envMap, ghost);
    function box(w, h, d, x, y, z, m, rx, ry) {
      var mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m || mats.paint);
      mesh.position.set(x, y, z);
      if (rx) mesh.rotation.x = rx;
      if (ry) mesh.rotation.y = ry;
      if (!ghost) mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    }
    var ctrl = [
      { z: -1.92, w: 0.16, y0: 0.18, y1: 0.34 },
      { z: -1.78, w: 0.62, y0: 0.12, y1: 0.48 },
      { z: -1.58, w: 0.86, y0: 0.11, y1: 0.58 },
      { z: -1.38, w: 0.92, y0: 0.12, y1: 0.62, well: 0.2 },
      { z: -1.18, w: 0.94, y0: 0.12, y1: 0.64, well: 0.85 },
      { z: -0.98, w: 0.94, y0: 0.12, y1: 0.66, well: 1 },
      { z: -0.78, w: 0.93, y0: 0.13, y1: 0.70, well: 0.35, yr: 0.92, wr: 0.72 },
      { z: -0.48, w: 0.92, y0: 0.13, y1: 0.78, yr: 1.18, wr: 0.70 },
      { z: -0.12, w: 0.92, y0: 0.13, y1: 0.82, yr: 1.28, wr: 0.68 },
      { z: 0.28, w: 0.92, y0: 0.13, y1: 0.82, yr: 1.30, wr: 0.67 },
      { z: 0.62, w: 0.92, y0: 0.13, y1: 0.80, yr: 1.24, wr: 0.68 },
      { z: 0.88, w: 0.93, y0: 0.14, y1: 0.72, yr: 1.08, wr: 0.70, well: 0.15 },
      { z: 1.08, w: 0.94, y0: 0.14, y1: 0.64, yr: 0.88, wr: 0.72, well: 0.7 },
      { z: 1.28, w: 0.94, y0: 0.14, y1: 0.58, well: 1 },
      { z: 1.48, w: 0.90, y0: 0.15, y1: 0.56, well: 0.45 },
      { z: 1.68, w: 0.78, y0: 0.18, y1: 0.62 },
      { z: 1.82, w: 0.42, y0: 0.22, y1: 0.58 }
    ];
    var slices = densify(ctrl, 0.04);
    var body = new T.Mesh(loft(T, slices, ringOf, RING), mats.paint);
    body.castShadow = !ghost;
    body.receiveShadow = true;
    g.add(body);
    var glassCtrl = slices.filter(function (s) { return s.yr != null && s.yr > s.y1 + 0.14; });
    if (glassCtrl.length > 2) {
      var cabin = new T.Mesh(loft(T, glassCtrl, glassRing, 8), mats.glass);
      cabin.renderOrder = 2;
      g.add(cabin);
    }
    g.add(new T.Mesh(capGeometry(T, slices[0]), mats.paint));
    g.add(new T.Mesh(capGeometry(T, slices[slices.length - 1]), mats.dark));
    box(1.02, 0.26, 1.05, 0, 0.72, 0.05, mats.dark);
    box(1.62, 0.04, 0.38, 0, 0.12, -1.78, mats.carbon);
    box(1.38, 0.08, 0.06, 0, 0.22, -1.90, mats.carbon);
    box(0.78, 0.18, 0.08, 0, 0.28, -1.88, mats.lattice);
    box(0.42, 0.03, 1.55, -0.22, 0.67, -0.15, mats.gold);
    box(0.42, 0.03, 1.55, 0.22, 0.67, -0.15, mats.gold);
    function lamp(sign) {
      var house = box(0.34, 0.11, 0.14, 0.52 * sign, 0.40, -1.72, mats.dark, 0, -0.12 * sign);
      var lens = new T.Mesh(new T.SphereGeometry(0.09, 14, 12), mats.head);
      lens.scale.set(1.2, 0.7, 0.4);
      lens.position.set(0.52 * sign, 0.40, -1.80);
      lens.userData.head = true;
      g.add(lens);
      var drl = box(0.42, 0.022, 0.03, 0.50 * sign, 0.48, -1.70, mats.light, 0, -0.18 * sign);
      if (!ghost) {
        var spot = new T.SpotLight(0xffe6c4, 2.1, 40, 0.42, 0.5, 1.15);
        spot.position.set(0.48 * sign, 0.42, -1.78);
        var tgt = new T.Object3D();
        tgt.position.set(0.6 * sign, 0.08, -16);
        g.add(spot, tgt);
        spot.target = tgt;
        spot.userData.head = true;
        spot.userData.headBoost = 2.1;
      }
    }
    lamp(-1); lamp(1);
    function tail(sign) {
      var cl = box(0.36, 0.12, 0.05, 0.52 * sign, 0.52, 1.78, mats.tail);
      cl.userData.brake = true;
    }
    tail(-1); tail(1);
    var chmsl = box(0.48, 0.03, 0.03, 0, 1.18, 1.02, mats.tail);
    chmsl.userData.brake = true;
    if (!ghost) {
      var bLite = new T.PointLight(0xff1a12, 0, 7, 2);
      bLite.position.set(0, 0.52, 1.88);
      bLite.userData.brake = true;
      g.add(bLite);
    }
    box(1.55, 0.04, 0.22, 0, 1.08, 1.48, mats.gold, -0.12, 0);
    box(0.04, 0.18, 0.24, -0.76, 1.00, 1.48, mats.gold);
    box(0.04, 0.18, 0.24, 0.76, 1.00, 1.48, mats.gold);
    box(0.04, 0.22, 0.08, -0.94, 0.42, -0.15, mats.dark);
    box(0.04, 0.22, 0.08, 0.94, 0.42, -0.15, mats.dark);
    box(0.18, 0.03, 0.03, -0.72, 0.78, -0.42, mats.dark);
    box(0.14, 0.08, 0.03, -0.86, 0.78, -0.42, mats.chrome);
    box(0.18, 0.03, 0.03, 0.72, 0.78, -0.42, mats.dark);
    box(0.14, 0.08, 0.03, 0.86, 0.78, -0.42, mats.chrome);
    var badge = new T.Mesh(new T.CircleGeometry(0.07, 18), mats.gold);
    badge.position.set(0, 0.46, -1.92);
    g.add(badge);
    addBoostFlamesAt(g, T, ghost, 0.20, 1.82, 0.26);
    box(0.32, 0.1, 0.02, 0, 0.36, 1.80, mats.gold);
    var fant = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.55, 6), mats.chrome);
    fant.position.set(-0.22, 1.42, 0.12);
    fant.rotation.z = -0.12;
    g.add(fant);
    var wy = 0.30;
    g.add(makeWheel(T, mats, wy, -0.78, -1.08, true, 0.32));
    g.add(makeWheel(T, mats, wy, 0.78, -1.08, true, 0.32));
    g.add(makeWheel(T, mats, wy, -0.80, 1.22, false, 0.32));
    g.add(makeWheel(T, mats, wy, 0.80, 1.22, false, 0.32));
    g.userData.body = "flick";
    return g;
  }

  function buildRally(T, opts) {
    var ghost = !!opts.ghost;
    var paintCol = opts.paint != null ? opts.paint : 0x1d4ed8;
    var envMap = opts.envMap || null;
    var g = new T.Group();
    var mats = paintMats(T, paintCol, envMap, ghost);
    function box(w, h, d, x, y, z, m, rx, ry) {
      var mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m || mats.paint);
      mesh.position.set(x, y, z);
      if (rx) mesh.rotation.x = rx;
      if (ry) mesh.rotation.y = ry;
      if (!ghost) mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    }
    function cyl(rt, rb, h, x, y, z, m, rx, rz) {
      var mesh = new T.Mesh(new T.CylinderGeometry(rt, rb, h, 12), m);
      mesh.position.set(x, y, z);
      if (rx) mesh.rotation.x = rx;
      if (rz) mesh.rotation.z = rz;
      g.add(mesh);
      return mesh;
    }
    var ctrl = [
      { z: -2.22, w: 0.16, y0: 0.20, y1: 0.36 },
      { z: -2.06, w: 0.58, y0: 0.14, y1: 0.50 },
      { z: -1.82, w: 0.92, y0: 0.13, y1: 0.58 },
      { z: -1.58, w: 1.02, y0: 0.13, y1: 0.62, well: 0.25 },
      { z: -1.32, w: 1.06, y0: 0.14, y1: 0.64, well: 0.9 },
      { z: -1.08, w: 1.06, y0: 0.14, y1: 0.66, well: 1 },
      { z: -0.82, w: 1.02, y0: 0.14, y1: 0.70, well: 0.3, yr: 0.92, wr: 0.76 },
      { z: -0.48, w: 0.98, y0: 0.14, y1: 0.76, yr: 1.16, wr: 0.70 },
      { z: -0.08, w: 0.97, y0: 0.14, y1: 0.78, yr: 1.22, wr: 0.66 },
      { z: 0.32, w: 0.97, y0: 0.14, y1: 0.76, yr: 1.18, wr: 0.65 },
      { z: 0.68, w: 0.98, y0: 0.14, y1: 0.70, yr: 1.02, wr: 0.68 },
      { z: 0.98, w: 1.02, y0: 0.15, y1: 0.62, well: 0.2 },
      { z: 1.22, w: 1.06, y0: 0.15, y1: 0.60, well: 0.85 },
      { z: 1.46, w: 1.06, y0: 0.16, y1: 0.60, well: 1 },
      { z: 1.70, w: 1.00, y0: 0.17, y1: 0.58, well: 0.4 },
      { z: 1.92, w: 0.82, y0: 0.20, y1: 0.56 },
      { z: 2.08, w: 0.40, y0: 0.24, y1: 0.48 }
    ];
    var slices = densify(ctrl, 0.042);
    var body = new T.Mesh(loft(T, slices, ringOf, RING), mats.paint);
    body.castShadow = !ghost;
    body.receiveShadow = true;
    g.add(body);
    var glassCtrl = slices.filter(function (s) { return s.yr != null && s.yr > s.y1 + 0.14; });
    if (glassCtrl.length > 2) {
      var cabin = new T.Mesh(loft(T, glassCtrl, glassRing, 8), mats.glass);
      cabin.renderOrder = 2;
      g.add(cabin);
    }
    g.add(new T.Mesh(capGeometry(T, slices[0]), mats.chrome));
    g.add(new T.Mesh(capGeometry(T, slices[slices.length - 1]), mats.dark));
    box(1.08, 0.28, 1.12, 0, 0.74, 0.02, mats.dark);
    box(1.85, 0.05, 0.42, 0, 0.13, -2.02, mats.carbon);
    box(0.88, 0.22, 0.08, 0, 0.32, -2.10, mats.lattice);
    box(0.55, 0.08, 0.42, 0, 0.72, -1.15, mats.dark);
    box(0.48, 0.04, 0.36, 0, 0.78, -1.15, mats.lattice);
    box(0.42, 0.10, 0.36, 0, 1.28, 0.08, mats.dark);
    box(0.36, 0.04, 0.30, 0, 1.34, 0.08, mats.lattice);
    box(0.36, 0.03, 1.85, -0.18, 0.66, -0.05, mats.gold);
    box(0.36, 0.03, 1.85, 0.18, 0.66, -0.05, mats.gold);
    var flL = cyl(0.40, 0.40, 0.14, -1.04, 0.40, -1.18, mats.paint, 0, Math.PI / 2);
    flL.scale.set(1, 0.72, 1);
    var flR = cyl(0.40, 0.40, 0.14, 1.04, 0.40, -1.18, mats.paint, 0, Math.PI / 2);
    flR.scale.set(1, 0.72, 1);
    var rlL = cyl(0.42, 0.42, 0.15, -1.06, 0.42, 1.42, mats.paint, 0, Math.PI / 2);
    rlL.scale.set(1, 0.74, 1);
    var rlR = cyl(0.42, 0.42, 0.15, 1.06, 0.42, 1.42, mats.paint, 0, Math.PI / 2);
    rlR.scale.set(1, 0.74, 1);
    function lamp(sign) {
      var bucket = cyl(0.10, 0.10, 0.08, 0.42 * sign, 0.42, -2.08, mats.chrome, Math.PI / 2, 0);
      var lens = new T.Mesh(new T.SphereGeometry(0.095, 16, 12), mats.head);
      lens.position.set(0.42 * sign, 0.42, -2.14);
      lens.scale.set(1, 1, 0.5);
      lens.userData.head = true;
      g.add(lens);
      var fog = new T.Mesh(new T.SphereGeometry(0.06, 12, 10), mats.head);
      fog.position.set(0.62 * sign, 0.28, -2.06);
      fog.scale.set(1, 1, 0.45);
      fog.userData.head = true;
      g.add(fog);
      if (!ghost) {
        var spot = new T.SpotLight(0xffe6c4, 2.2, 42, 0.38, 0.5, 1.15);
        spot.position.set(0.4 * sign, 0.44, -2.10);
        var tgt = new T.Object3D();
        tgt.position.set(0.55 * sign, 0.1, -18);
        g.add(spot, tgt);
        spot.target = tgt;
        spot.userData.head = true;
        spot.userData.headBoost = 2.2;
      }
    }
    lamp(-1); lamp(1);
    function tail(sign) {
      var cl = box(0.22, 0.28, 0.06, 0.72 * sign, 0.52, 2.02, mats.tail);
      cl.userData.brake = true;
      box(0.18, 0.08, 0.05, 0.72 * sign, 0.38, 2.04, mats.amber);
    }
    tail(-1); tail(1);
    var chmsl = box(0.5, 0.03, 0.03, 0, 1.16, 1.55, mats.tail);
    chmsl.userData.brake = true;
    if (!ghost) {
      var bLite = new T.PointLight(0xff1a12, 0, 8, 2);
      bLite.position.set(0, 0.5, 2.1);
      bLite.userData.brake = true;
      g.add(bLite);
    }
    box(1.72, 0.04, 0.26, 0, 1.12, 1.72, mats.gold, -0.08, 0);
    box(0.04, 0.16, 0.28, -0.84, 1.04, 1.72, mats.gold);
    box(0.04, 0.16, 0.28, 0.84, 1.04, 1.72, mats.gold);
    box(0.05, 0.08, 1.4, -1.02, 0.22, 0.12, mats.dark);
    box(0.05, 0.08, 1.4, 1.02, 0.22, 0.12, mats.dark);
    box(0.22, 0.04, 0.04, -1.04, 0.78, -0.38, mats.dark);
    box(0.16, 0.09, 0.04, -1.18, 0.78, -0.38, mats.chrome);
    box(0.22, 0.04, 0.04, 1.04, 0.78, -0.38, mats.dark);
    box(0.16, 0.09, 0.04, 1.18, 0.78, -0.38, mats.chrome);
    var badge = new T.Mesh(new T.CircleGeometry(0.07, 18), mats.gold);
    badge.position.set(0, 0.44, -2.16);
    g.add(badge);
    addBoostFlamesAt(g, T, ghost, 0.22, 2.06, 0.32);
    box(0.08, 0.28, 0.22, -0.98, 0.28, 1.62, mats.dark);
    box(0.08, 0.28, 0.22, 0.98, 0.28, 1.62, mats.dark);
    box(0.34, 0.1, 0.02, 0, 0.34, 2.08, mats.gold);
    g.add(makeWheel(T, mats, 0.34, -0.90, -1.18, true, 0.34));
    g.add(makeWheel(T, mats, 0.34, 0.90, -1.18, true, 0.34));
    g.add(makeWheel(T, mats, 0.36, -0.94, 1.42, false, 0.36));
    g.add(makeWheel(T, mats, 0.36, 0.94, 1.42, false, 0.36));
    g.userData.body = "sleet";
    return g;
  }

  function build(T, opts) {
    opts = opts || {};
    if (opts.body === "boxcut") return buildTruck(T, opts);
    if (opts.body === "flick") return buildHatch(T, opts);
    if (opts.body === "sleet") return buildRally(T, opts);
    var ghost = !!opts.ghost;
    var paintCol = opts.paint != null ? opts.paint : 0x165e66;
    var envMap = opts.envMap || null;
    var g = new T.Group();
    var carbon = carbonTex(T);
    var lat = latticeTex(T);
    var mats = {
      paint: mat(T, {
        color: paintCol, metalness: 0.78, roughness: 0.16, clearcoat: 1,
        clearcoatRoughness: 0.07, sheen: 0.45, sheenColor: new T.Color(0x7eeae0),
        envMap: envMap, envMapIntensity: 1.3
      }, ghost),
      dark: mat(T, { color: 0x0b0d12, metalness: 0.4, roughness: 0.45, envMap: envMap }, ghost),
      carbon: mat(T, { color: 0x222, metalness: 0.55, roughness: 0.38, map: carbon, envMap: envMap }, ghost),
      glass: mat(T, {
        color: 0x081018, metalness: 0.12, roughness: 0.035, transparent: true,
        opacity: ghost ? 0.16 : 0.42, envMap: envMap, envMapIntensity: 1.7
      }, false),
      chrome: mat(T, { color: 0x9aa3ad, metalness: 1, roughness: 0.12, envMap: envMap }, ghost),
      gold: mat(T, { color: 0xfbbf24, metalness: 0.92, roughness: 0.2, envMap: envMap }, ghost),
      rubber: mat(T, { color: 0x111111, metalness: 0.05, roughness: 0.92 }, ghost),
      rubberSoft: mat(T, { color: 0x1a1a1a, metalness: 0.04, roughness: 0.86 }, ghost),
      disc: mat(T, { color: 0x6b7280, metalness: 0.85, roughness: 0.28, envMap: envMap }, ghost),
      lattice: mat(T, { color: 0x1f2937, metalness: 0.5, roughness: 0.4, map: lat, envMap: envMap }, ghost),
      light: new T.MeshStandardMaterial({
        color: 0xdffcff, emissive: 0x5eead4, emissiveIntensity: ghost ? 0.4 : 3.6,
        roughness: 0.12, metalness: 0.15, transparent: ghost, opacity: ghost ? 0.3 : 1
      }),
      head: new T.MeshStandardMaterial({
        color: 0xfff4d4, emissive: 0xffe7b0, emissiveIntensity: ghost ? 0.35 : 3.4,
        roughness: 0.16, metalness: 0.18, transparent: ghost, opacity: ghost ? 0.3 : 1
      }),
      tail: new T.MeshStandardMaterial({
        color: 0x3b0000, emissive: 0xff2211, emissiveIntensity: ghost ? 0.18 : 0.5,
        roughness: 0.28, transparent: ghost, opacity: ghost ? 0.3 : 1
      })
    };

    var ctrl = [
      { z: -2.18, w: 0.14, y0: 0.18, y1: 0.32 },
      { z: -2.02, w: 0.48, y0: 0.12, y1: 0.40 },
      { z: -1.78, w: 0.84, y0: 0.10, y1: 0.47 },
      { z: -1.55, w: 0.92, y0: 0.11, y1: 0.51, well: 0.18 },
      { z: -1.36, w: 0.94, y0: 0.11, y1: 0.52, well: 0.7 },
      { z: -1.18, w: 0.95, y0: 0.12, y1: 0.52, well: 1 },
      { z: -1.00, w: 0.95, y0: 0.12, y1: 0.53, well: 0.7 },
      { z: -0.84, w: 0.95, y0: 0.12, y1: 0.54, well: 0.18 },
      { z: -0.52, w: 0.96, y0: 0.13, y1: 0.58, yr: 0.86, wr: 0.70 },
      { z: -0.12, w: 0.95, y0: 0.13, y1: 0.60, yr: 1.08, wr: 0.66 },
      { z: 0.28, w: 0.95, y0: 0.13, y1: 0.60, yr: 1.12, wr: 0.65 },
      { z: 0.62, w: 0.94, y0: 0.13, y1: 0.58, yr: 1.04, wr: 0.64 },
      { z: 0.88, w: 0.93, y0: 0.13, y1: 0.54, yr: 0.78, wr: 0.70, well: 0.15 },
      { z: 1.08, w: 0.93, y0: 0.14, y1: 0.52, well: 0.7 },
      { z: 1.22, w: 0.93, y0: 0.14, y1: 0.52, well: 1 },
      { z: 1.38, w: 0.91, y0: 0.14, y1: 0.51, well: 0.65 },
      { z: 1.55, w: 0.88, y0: 0.15, y1: 0.50, well: 0.12 },
      { z: 1.82, w: 0.70, y0: 0.18, y1: 0.47 },
      { z: 2.02, w: 0.36, y0: 0.24, y1: 0.42 }
    ];
    var slices = densify(ctrl, 0.055);
    var body = new T.Mesh(loft(T, slices, ringOf, RING), mats.paint);
    body.castShadow = !ghost;
    body.receiveShadow = true;
    g.add(body);

    var glassCtrl = slices.filter(function (s) { return s.yr != null && s.yr > s.y1 + 0.12; });
    if (glassCtrl.length > 2) {
      var cabin = new T.Mesh(loft(T, glassCtrl, glassRing, 8), mats.glass);
      cabin.renderOrder = 2;
      g.add(cabin);
    }
    var interior = new T.Mesh(new T.BoxGeometry(1.02, 0.3, 1.12), mats.dark);
    interior.position.set(0, 0.76, 0.12);
    g.add(interior);

    var noseCap = new T.Mesh(capGeometry(T, slices[0]), mats.paint);
    var tailCap = new T.Mesh(capGeometry(T, slices[slices.length - 1]), mats.dark);
    g.add(noseCap, tailCap);

    var splitter = new T.Mesh(new T.BoxGeometry(1.78, 0.035, 0.46), mats.carbon);
    splitter.position.set(0, 0.105, -2.04);
    g.add(splitter);
    var lip = new T.Mesh(new T.BoxGeometry(1.52, 0.1, 0.07), mats.carbon);
    lip.position.set(0, 0.22, -2.18);
    g.add(lip);

    var skirtL = new T.Mesh(new T.BoxGeometry(0.055, 0.07, 1.12), mats.carbon);
    var skirtR = skirtL.clone();
    skirtL.position.set(-0.98, 0.15, 0.02);
    skirtR.position.set(0.98, 0.15, 0.02);
    g.add(skirtL, skirtR);

    var ventL = new T.Mesh(new T.BoxGeometry(0.03, 0.26, 0.48), mats.lattice);
    var ventR = ventL.clone();
    ventL.position.set(-1.0, 0.4, 0.28);
    ventR.position.set(1.0, 0.4, 0.28);
    g.add(ventL, ventR);

    function stripeGeo(left) {
      var pos = [], idx = [], i, r, pi, x, y, z, sign = left ? -1 : 1;
      pi = left ? 4 : 11;
      for (i = 0; i < slices.length; i++) {
        r = ringOf(slices[i]);
        x = r[pi * 3]; y = r[pi * 3 + 1]; z = r[pi * 3 + 2];
        pos.push(x, y + 0.01, z, x + sign * 0.022, y + 0.01, z);
      }
      for (i = 0; i < slices.length - 1; i++) {
        var a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
      var geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    }
    g.add(new T.Mesh(stripeGeo(true), mats.gold), new T.Mesh(stripeGeo(false), mats.gold));

    var wing = new T.Mesh(new T.BoxGeometry(1.88, 0.045, 0.3), mats.gold);
    wing.position.set(0, 1.14, 1.76);
    wing.rotation.x = -0.06;
    g.add(wing);
    var endL = new T.Mesh(new T.BoxGeometry(0.045, 0.26, 0.36), mats.gold);
    var endR = endL.clone();
    endL.position.set(-0.94, 1.04, 1.76);
    endR.position.set(0.94, 1.04, 1.76);
    g.add(endL, endR);
    var pylonL = new T.Mesh(new T.BoxGeometry(0.045, 0.52, 0.07), mats.gold);
    var pylonR = pylonL.clone();
    pylonL.position.set(-0.52, 0.84, 1.6);
    pylonL.rotation.x = 0.38;
    pylonR.position.set(0.52, 0.84, 1.6);
    pylonR.rotation.x = 0.38;
    g.add(pylonL, pylonR);

    var diffuser = new T.Mesh(new T.BoxGeometry(1.48, 0.07, 0.38), mats.carbon);
    diffuser.position.set(0, 0.14, 1.94);
    g.add(diffuser);
    var fi;
    for (fi = 0; fi < 5; fi++) {
      var fin = new T.Mesh(new T.BoxGeometry(0.022, 0.15, 0.34), mats.dark);
      fin.position.set(-0.5 + fi * 0.25, 0.18, 1.96);
      g.add(fin);
    }

    function addDrl(sign) {
      var bar = new T.Mesh(new T.BoxGeometry(0.5, 0.026, 0.032), mats.light);
      bar.position.set(0.56 * sign, 0.405, -1.84);
      bar.rotation.y = -0.22 * sign;
      bar.rotation.z = -0.06 * sign;
      g.add(bar);
      var i, lamp;
      for (i = 0; i < 3; i++) {
        lamp = new T.Mesh(new T.SphereGeometry(0.026, 12, 10), mats.light);
        lamp.position.set((0.42 + i * 0.09) * sign, 0.378, -1.9);
        g.add(lamp);
      }
    }
    addDrl(-1);
    addDrl(1);
    function addHead(sign) {
      var house = new T.Mesh(new T.BoxGeometry(0.3, 0.13, 0.16), mats.dark);
      house.position.set(0.6 * sign, 0.355, -1.9);
      house.rotation.y = -0.12 * sign;
      g.add(house);
      var lens = new T.Mesh(new T.SphereGeometry(0.1, 14, 12), mats.head);
      lens.scale.set(1.25, 0.72, 0.42);
      lens.position.set(0.6 * sign, 0.355, -2.0);
      lens.userData.head = true;
      g.add(lens);
      var glass = new T.Mesh(new T.CircleGeometry(0.09, 14), mats.head);
      glass.position.set(0.6 * sign, 0.355, -2.05);
      glass.rotation.y = Math.PI;
      glass.userData.head = true;
      g.add(glass);
      if (!ghost) {
        var spot = new T.SpotLight(0xffe6c4, 2.35, 46, 0.4, 0.5, 1.15);
        spot.position.set(0.55 * sign, 0.4, -2.02);
        var tgt = new T.Object3D();
        tgt.position.set(0.7 * sign, 0.08, -18);
        g.add(spot);
        g.add(tgt);
        spot.target = tgt;
        spot.userData.head = true;
        spot.userData.headBoost = 2.35;
      }
    }
    addHead(-1);
    addHead(1);
    function addTail(sign) {
      var cluster = new T.Mesh(new T.BoxGeometry(0.44, 0.13, 0.05), mats.tail);
      cluster.position.set(0.58 * sign, 0.49, 1.95);
      cluster.userData.brake = true;
      g.add(cluster);
      var inner = new T.Mesh(new T.BoxGeometry(0.24, 0.05, 0.04), mats.tail);
      inner.position.set(0.5 * sign, 0.4, 1.97);
      inner.userData.brake = true;
      g.add(inner);
    }
    addTail(-1);
    addTail(1);
    var chmsl = new T.Mesh(new T.BoxGeometry(0.52, 0.032, 0.03), mats.tail);
    chmsl.position.set(0, 1.12, 1.64);
    chmsl.userData.brake = true;
    g.add(chmsl);
    if (!ghost) {
      var bLite = new T.PointLight(0xff1a12, 0, 8, 2);
      bLite.position.set(0, 0.52, 2.08);
      bLite.userData.brake = true;
      g.add(bLite);
    }

    var grill = new T.Mesh(new T.BoxGeometry(0.72, 0.2, 0.07), mats.lattice);
    grill.position.set(0, 0.27, -2.1);
    g.add(grill);

    var mArm = new T.Mesh(new T.BoxGeometry(0.2, 0.035, 0.035), mats.dark);
    mArm.position.set(-0.78, 0.74, -0.5);
    var mGlass = new T.Mesh(new T.BoxGeometry(0.15, 0.09, 0.03), mats.chrome);
    mGlass.position.set(-0.92, 0.74, -0.5);
    g.add(mArm, mGlass);
    var mArmR = mArm.clone(); mArmR.position.x *= -1;
    var mGlassR = mGlass.clone(); mGlassR.position.x *= -1;
    g.add(mArmR, mGlassR);

    var exhaustL = new T.Mesh(new T.CylinderGeometry(0.042, 0.042, 0.12, 14), mats.chrome);
    exhaustL.rotation.x = Math.PI / 2;
    exhaustL.position.set(-0.28, 0.22, 2.08);
    var exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.28;
    g.add(exhaustL, exhaustR);
    function addBoostFlame(sign) {
      var flameMat = new T.MeshBasicMaterial({
        color: 0xff5a12, transparent: true, opacity: 0,
        blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
      });
      var coreMat = new T.MeshBasicMaterial({
        color: 0xffe08a, transparent: true, opacity: 0,
        blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
      });
      var flame = new T.Mesh(new T.ConeGeometry(0.075, 0.48, 7, 1, true), flameMat);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(0.28 * sign, 0.22, 2.34);
      flame.userData.boostFx = true;
      var core = new T.Mesh(new T.ConeGeometry(0.038, 0.28, 6, 1, true), coreMat);
      core.rotation.x = -Math.PI / 2;
      core.position.set(0.28 * sign, 0.22, 2.26);
      core.userData.boostFx = true;
      g.add(flame, core);
      if (!ghost) {
        var lite = new T.PointLight(0xff6a18, 0, 9, 2);
        lite.position.set(0.28 * sign, 0.24, 2.22);
        lite.userData.boostFx = true;
        g.add(lite);
      }
    }
    addBoostFlame(-1);
    addBoostFlame(1);

    var badge = new T.Mesh(new T.CircleGeometry(0.065, 18), mats.gold);
    badge.position.set(0, 0.44, -2.16);
    g.add(badge);
    var plate = new T.Mesh(new T.BoxGeometry(0.38, 0.12, 0.02), mats.gold);
    plate.position.set(0, 0.32, 2.04);
    g.add(plate);
    var ant = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.72, 6), mats.chrome);
    ant.position.set(0.42, 1.22, 0.55);
    ant.rotation.z = 0.18;
    g.add(ant);

    var wy = 0.33;
    g.add(makeWheel(T, mats, wy, -0.8, -1.18, true));
    g.add(makeWheel(T, mats, wy, 0.8, -1.18, true));
    g.add(makeWheel(T, mats, wy, -0.82, 1.22, false));
    g.add(makeWheel(T, mats, wy, 0.82, 1.22, false));
    g.userData.apex = true;
    g.userData.body = "apex";
    return g;
  }

  function trafficWheel(T, mats, y, x, z, rad) {
    return makeWheel(T, mats, y, x, z, false, rad || 0.32);
  }

  function buildTraffic(T, opts) {
    opts = opts || {};
    var kind = opts.kind || "sedan";
    var paintCol = opts.paint != null ? opts.paint : 0x334155;
    var g = new T.Group();
    var mats = paintMats(T, paintCol, opts.envMap || null, false);
    function box(w, h, d, x, y, z, m) {
      var mesh = new T.Mesh(new T.BoxGeometry(w, h, d), m || mats.paint);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    }
    function cyl(rt, rb, h, x, y, z, m, rx, rz) {
      var mesh = new T.Mesh(new T.CylinderGeometry(rt, rb, h, 10), m);
      mesh.position.set(x, y, z);
      if (rx) mesh.rotation.x = rx;
      if (rz) mesh.rotation.z = rz;
      g.add(mesh);
      return mesh;
    }
    if (kind === "tractor") {
      box(1.15, 0.55, 1.7, 0, 0.72, -0.15, mats.paint);
      box(1.05, 0.72, 1.05, 0, 1.28, 0.22, mats.dark);
      box(0.95, 0.08, 0.95, 0, 1.68, 0.22, mats.gold);
      cyl(0.04, 0.04, 1.15, 0.42, 1.55, 0.55, mats.chrome, 0, 0);
      cyl(0.055, 0.04, 0.12, 0.42, 2.12, 0.55, mats.dark, 0, 0);
      var hoop = new T.Mesh(new T.TorusGeometry(0.62, 0.035, 8, 16, Math.PI), mats.chrome);
      hoop.rotation.z = Math.PI / 2;
      hoop.position.set(0, 1.55, 0.22);
      g.add(hoop);
      box(0.55, 0.22, 0.7, 0, 0.62, -1.05, mats.paint);
      box(0.9, 0.1, 0.08, 0, 0.58, -1.38, mats.head);
      box(0.28, 0.12, 0.06, -0.42, 0.7, 0.95, mats.tail);
      box(0.28, 0.12, 0.06, 0.42, 0.7, 0.95, mats.tail);
      g.add(trafficWheel(T, mats, 0.38, -0.62, -0.95, 0.28));
      g.add(trafficWheel(T, mats, 0.38, 0.62, -0.95, 0.28));
      g.add(trafficWheel(T, mats, 0.62, -0.78, 0.72, 0.52));
      g.add(trafficWheel(T, mats, 0.62, 0.78, 0.72, 0.52));
      g.userData.kind = "tractor";
      g.userData.lockedPaint = true;
      return g;
    }
    if (kind === "hauler") {
      box(1.7, 0.7, 1.55, 0, 0.72, -1.35, mats.paint);
      box(1.45, 0.55, 1.05, 0, 1.28, -1.42, mats.dark);
      box(1.85, 1.55, 2.85, 0, 1.22, 0.85, mats.lattice);
      box(1.85, 0.08, 2.85, 0, 2.02, 0.85, mats.dark);
      box(1.15, 0.1, 0.08, 0, 0.55, -2.12, mats.head);
      box(0.35, 0.14, 0.06, -0.62, 0.58, 2.24, mats.tail);
      box(0.35, 0.14, 0.06, 0.62, 0.58, 2.24, mats.tail);
      g.add(trafficWheel(T, mats, 0.38, -0.78, -1.35, 0.34));
      g.add(trafficWheel(T, mats, 0.38, 0.78, -1.35, 0.34));
      g.add(trafficWheel(T, mats, 0.4, -0.82, 0.55, 0.36));
      g.add(trafficWheel(T, mats, 0.4, 0.82, 0.55, 0.36));
      g.add(trafficWheel(T, mats, 0.4, -0.82, 1.55, 0.36));
      g.add(trafficWheel(T, mats, 0.4, 0.82, 1.55, 0.36));
      g.userData.kind = "hauler";
      return g;
    }
    if (kind === "van") {
      box(1.55, 0.55, 3.4, 0, 0.62, 0.05, mats.paint);
      box(1.48, 0.95, 2.55, 0, 1.28, 0.28, mats.paint);
      box(1.35, 0.55, 1.05, 0, 1.22, -1.15, mats.dark);
      box(1.1, 0.08, 0.07, 0, 0.5, -1.68, mats.head);
      box(0.4, 0.16, 0.06, -0.5, 0.58, 1.74, mats.tail);
      box(0.4, 0.16, 0.06, 0.5, 0.58, 1.74, mats.tail);
      g.add(trafficWheel(T, mats, 0.34, -0.7, -1.05, 0.32));
      g.add(trafficWheel(T, mats, 0.34, 0.7, -1.05, 0.32));
      g.add(trafficWheel(T, mats, 0.34, -0.72, 1.15, 0.32));
      g.add(trafficWheel(T, mats, 0.34, 0.72, 1.15, 0.32));
      g.userData.kind = "van";
      return g;
    }
    box(1.72, 0.48, 3.2, 0, 0.52, 0, mats.paint);
    box(1.35, 0.38, 1.35, 0, 0.88, -0.15, mats.dark);
    box(1.55, 0.22, 0.95, 0, 0.58, 1.05, mats.paint);
    box(1.15, 0.08, 0.06, 0, 0.42, -1.58, mats.head);
    box(0.38, 0.12, 0.05, -0.52, 0.48, 1.58, mats.tail);
    box(0.38, 0.12, 0.05, 0.52, 0.48, 1.58, mats.tail);
    g.add(trafficWheel(T, mats, 0.32, -0.72, -1.05, 0.3));
    g.add(trafficWheel(T, mats, 0.32, 0.72, -1.05, 0.3));
    g.add(trafficWheel(T, mats, 0.32, -0.74, 1.12, 0.3));
    g.add(trafficWheel(T, mats, 0.32, 0.74, 1.12, 0.3));
    g.userData.kind = "sedan";
    return g;
  }

  function closeStudio() {
    if (studio.raf) cancelAnimationFrame(studio.raf);
    studio.raf = 0;
    if (studio.canvas) {
      studio.canvas.onpointerdown = null;
      studio.canvas.onpointerup = null;
      studio.canvas.onpointermove = null;
      studio.canvas.onpointerleave = null;
      studio.canvas.onwheel = null;
    }
    if (studio.renderer) {
      try { studio.renderer.dispose(); } catch (e) { /* */ }
    }
    studio.renderer = studio.scene = studio.camera = studio.car = studio.canvas = null;
  }

  function resizeStudio() {
    if (!studio.renderer || !studio.canvas || !studio.camera) return false;
    var host = studio.canvas.parentElement;
    var w = (host && host.clientWidth) || studio.canvas.clientWidth || 0;
    var h = (host && host.clientHeight) || studio.canvas.clientHeight || 0;
    if (w < 8 || h < 8) return false;
    studio.renderer.setSize(w, h, false);
    studio.camera.aspect = w / h;
    studio.camera.updateProjectionMatrix();
    return true;
  }

  function studioReady() {
    return !!(studio.renderer && studio.canvas && studio.canvas.parentElement &&
      studio.canvas.parentElement.clientHeight > 40);
  }

  function studioLoop() {
    if (!studio.renderer) return;
    studio.raf = requestAnimationFrame(studioLoop);
    var dt = Math.min(0.05, studio.clock.getDelta());
    if (!studio.drag) studio.yaw += dt * 0.28;
    var kind = studio.car && studio.car.userData.body;
    var truck = kind === "boxcut";
    var r = truck ? 7.5 : (kind === "sleet" ? 7.05 : (kind === "flick" ? 6.15 : 6.6));
    var cp = Math.cos(studio.pitch), sp = Math.sin(studio.pitch);
    studio.camera.position.set(
      Math.sin(studio.yaw) * cp * r,
      (truck ? 1.35 : 1.15) + sp * r * 0.85,
      Math.cos(studio.yaw) * cp * r
    );
    studio.camera.lookAt(0, truck ? 0.58 : (kind === "flick" ? 0.5 : 0.42), truck ? 0.12 : 0);
    if (studio.car) {
      studio.car.traverse(function (ch) {
        if (ch.userData.spin) ch.rotation.x += dt * 1.15;
      });
    }
    studio.renderer.render(studio.scene, studio.camera);
  }

  function openStudio(canvas, opts) {
    closeStudio();
    var T = global.THREE;
    if (!T || !canvas) return false;
    opts = opts || {};
    studio.canvas = canvas;
    try {
      studio.renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch (e) { return false; }
    studio.renderer.setPixelRatio(Math.min(1.7, global.devicePixelRatio || 1));
    studio.renderer.shadowMap.enabled = true;
    studio.renderer.toneMapping = T.ACESFilmicToneMapping;
    studio.renderer.toneMappingExposure = 1.2;
    studio.renderer.setClearColor(0x07090e, 1);
    var env = bakeEnv(T, studio.renderer);
    studio.scene = new T.Scene();
    studio.scene.background = new T.Color(0x07090e);
    studio.scene.fog = new T.FogExp2(0x07090e, 0.016);
    studio.camera = new T.PerspectiveCamera(36, 1, 0.1, 80);
    studio.clock = new T.Clock();

    studio.scene.add(new T.HemisphereLight(0xdcecff, 0x1a2420, 0.5));
    var key = new T.DirectionalLight(0xfff1dc, 2.2);
    key.position.set(4.5, 8, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    studio.scene.add(key);
    var rim = new T.DirectionalLight(0x5eead4, 1.45);
    rim.position.set(-6, 3.2, -4);
    studio.scene.add(rim);
    var fill = new T.DirectionalLight(0xfbbf24, 0.5);
    fill.position.set(2, 2, -6);
    studio.scene.add(fill);

    var floor = new T.Mesh(
      new T.CircleGeometry(10, 72),
      new T.MeshPhysicalMaterial({
        color: 0x0c1016, metalness: 0.88, roughness: 0.1,
        envMap: env, envMapIntensity: 1
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    studio.scene.add(floor);
    var ring = new T.Mesh(
      new T.RingGeometry(1.55, 2.1, 72),
      new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.2, side: T.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    studio.scene.add(ring);

    studio.car = build(T, { paint: opts.paint, envMap: env, ghost: false, body: opts.body });
    studio.scene.add(studio.car);
    var hl = new T.PointLight(0x9ff5ea, 2.4, 8, 2);
    hl.position.set(0, 0.55, opts.body === "boxcut" ? -2.3 : (opts.body === "flick" ? -1.85 : -2.1));
    studio.car.add(hl);
    studio.yaw = opts.body === "boxcut" ? 0.85 : (opts.body === "sleet" ? 0.78 : 0.72);
    studio.pitch = 0.18;

    canvas.style.touchAction = "none";
    canvas.onpointerdown = function (e) {
      studio.drag = true;
      studio.lx = e.clientX;
      studio.ly = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    };
    canvas.onpointerup = function () { studio.drag = false; };
    canvas.onpointerleave = function () { studio.drag = false; };
    canvas.onpointermove = function (e) {
      if (!studio.drag) return;
      studio.yaw -= (e.clientX - studio.lx) * 0.006;
      studio.pitch = Math.max(-0.12, Math.min(0.55, studio.pitch + (e.clientY - studio.ly) * 0.004));
      studio.lx = e.clientX;
      studio.ly = e.clientY;
    };
    canvas.onwheel = function (e) { e.preventDefault(); };

    resizeStudio();
    requestAnimationFrame(function () { resizeStudio(); });
    studioLoop();
    return true;
  }

  function setLights(root, st) {
    if (!root) return;
    st = st || {};
    var headOn = st.head !== false;
    var brakeOn = !!st.brake;
    var fx = !st.reduceFx;
    var ghost = !!st.ghost;
    root.traverse(function (ch) {
      if (ch.userData.brake) {
        if (ch.material && ch.material.emissiveIntensity != null) {
          ch.material.emissiveIntensity = brakeOn ? (ghost ? 1.4 : 4.8) : (ghost ? 0.16 : 0.48);
        }
        if (ch.isLight) ch.intensity = brakeOn && fx ? 2.4 : 0;
      }
      if (ch.userData.head) {
        if (ch.material && ch.material.emissiveIntensity != null) {
          ch.material.emissiveIntensity = headOn ? (ghost ? 0.4 : 3.4) : 0.1;
        }
        if (ch.isLight) ch.intensity = headOn && fx ? (ch.userData.headBoost || 2.2) : 0;
      }
      if (ch.userData.boostFx) {
        var on = !!st.boost && fx && !ghost;
        if (ch.isLight) ch.intensity = on ? (1.6 + Math.random() * 2.4) : 0;
        if (ch.material && ch.material.opacity != null) {
          ch.visible = on;
          ch.material.opacity = on ? (0.42 + Math.random() * 0.45) : 0;
        }
      }
    });
  }

  global.HavenCar = {
    bakeEnv: bakeEnv,
    build: build,
    buildTraffic: buildTraffic,
    setLights: setLights,
    openStudio: openStudio,
    closeStudio: closeStudio,
    resizeStudio: resizeStudio,
    studioReady: studioReady
  };
})(window);
