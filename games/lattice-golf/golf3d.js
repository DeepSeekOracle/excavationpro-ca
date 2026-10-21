/* Lattice Golf 2.5D / 3D course — Three.js renderer. Gameplay stays in game.js. */
(function (global) {
  "use strict";
  if (global.Golf3D) return;

  var T = null;
  var renderer, scene, camera, clock;
  var sun, hemi;
  var holeRoot = null;
  var ballMesh, ballShadow, markerMesh, markerRoot, markerHalo, markerHead, flagPole, flagCloth;
  var aimLine, carryRing, windPip, carryMark, trailLine;
  var pickPlane;
  var raycaster, pointer;
  var canvasEl = null;
  var running = false;
  var holeKey = "";
  var courseId = "";
  var cam = { x: 0, y: 55, z: 80, lx: 0, ly: 0, lz: 0 };
  var camGoal = { x: 0, y: 55, z: 80, lx: 0, ly: 0, lz: 0 };
  var orbit = { tx: 0, ty: 2, tz: 0, dist: 140, yaw: 0.85, pitch: 0.55 };
  var drag = { on: false, mode: "orbit", x: 0, y: 0, id: 0 };
  var lastHole = null;
  var following = false;
  var boundInput = false;
  var camLag = 0.0018;
  var ballPhase = "";
  var impactRing = null;
  var tex = {};
  var windAng = 0;
  var windMph = 0;
  var skyMesh = null;
  var skyRoot = null;
  var sunDisc = null;
  var waterMeshes = [];
  var ghostRoot = null;
  var ghostBalls = {};
  var BALL_R = 0.24;
  var WATER_LEVEL = -0.18;
  var WATER_FLOOR = -0.95;
  var WATER_SHORE = 7.5;

  var DIST_MIN = 22;
  var DIST_MAX = 720;
  var PITCH_MIN = 0.18;
  var PITCH_MAX = 1.35;

  function ok() {
    return !!(renderer && scene && camera);
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function noiseTex(w, h, fn) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var g = c.getContext("2d");
    var img = g.createImageData(w, h);
    var d = img.data;
    for (var i = 0; i < w * h; i++) {
      var x = i % w, y = (i / w) | 0;
      var col = fn(x, y, x / w, y / h);
      var o = i * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }

  function makeTextures() {
    tex.grass = noiseTex(256, 256, function (x, y) {
      var n = Math.sin(x * 0.37) * 6 + Math.cos(y * 0.29) * 5 + ((x * 13 + y * 7) % 9);
      var clump = Math.sin((x * 0.11 + y * 0.09)) * 8;
      return [78 + n, 112 + n + clump, 58 + n * 0.4];
    });
    tex.grass.repeat.set(14, 14);
    tex.rough = noiseTex(256, 256, function (x, y) {
      var n = Math.sin(x * 0.21 + y * 0.17) * 10 + ((x * 17) ^ (y * 13)) % 12;
      var clump = Math.cos(x * 0.08) * 7;
      return [92 + n, 124 + n * 0.55 + clump, 66 + n * 0.3];
    });
    tex.rough.repeat.set(10, 10);
    tex.fair = noiseTex(256, 256, function (x, y, u, v) {
      var n = ((x * 3 + y) % 5);
      var stripe = Math.sin(v * Math.PI * 14) >= 0 ? 10 : -6;
      var edge = Math.round(14 * Math.pow(Math.abs(u - 0.5) * 2, 2.2));
      return [96 + n + stripe - edge, 176 + n + stripe - edge * 0.7, 86 + n - edge * 0.4];
    });
    tex.fair.repeat.set(1, 1);
    tex.green = noiseTex(128, 128, function (x, y) {
      var n = (x + y) % 6;
      var stripe = ((y / 10) | 0) % 2 === 0 ? 8 : -4;
      return [98 + n + stripe, 196 + n + stripe, 96];
    });
    tex.sand = noiseTex(128, 128, function (x, y) {
      var n = ((x * 5) ^ y) % 18;
      return [212 + n, 188 + n * 0.6, 126];
    });
    tex.water = noiseTex(256, 256, function (x, y, u, v) {
      var w = 90 + Math.sin(u * 18) * 18 + Math.cos(v * 14) * 12;
      return [30, 104 + w * 0.3, 158 + w * 0.4];
    });
    tex.water.repeat.set(4, 4);
    tex.bark = noiseTex(64, 128, function (x, y) {
      var n = ((x * 3) ^ (y * 7)) % 14;
      return [62 + n, 42 + n * 0.5, 24];
    });
    tex.bark.repeat.set(1, 2);
    tex.rock = noiseTex(128, 128, function (x, y) {
      var n = ((x * 7) ^ (y * 11)) % 22;
      return [118 + n, 110 + n * 0.7, 98 + n * 0.4];
    });
    tex.dune = noiseTex(128, 128, function (x, y) {
      var n = ((x * 5) ^ y) % 20;
      return [210 + n, 186 + n * 0.5, 132];
    });
    tex.path = noiseTex(128, 128, function (x, y) {
      var n = ((x * 3) ^ (y * 5)) % 12;
      var stripe = (x % 16 < 2) ? 18 : 0;
      return [88 + n + stripe, 82 + n + stripe, 74 + n];
    });
    tex.path.repeat.set(2, 36);
    tex.cloud = (function () {
      var c = document.createElement("canvas");
      c.width = 256;
      c.height = 128;
      var g = c.getContext("2d");
      function puff(x, y, r, a) {
        var grd = g.createRadialGradient(x, y, r * 0.12, x, y, r);
        grd.addColorStop(0, "rgba(255,255,255," + a + ")");
        grd.addColorStop(0.55, "rgba(248,252,255," + (a * 0.45) + ")");
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }
      puff(88, 72, 52, 0.88);
      puff(132, 58, 60, 0.8);
      puff(176, 76, 46, 0.7);
      puff(64, 82, 36, 0.55);
      puff(200, 64, 34, 0.5);
      var t = new T.CanvasTexture(c);
      t.needsUpdate = true;
      return t;
    })();
  }

  function rockGeo(seed) {
    var g = new T.IcosahedronGeometry(1, 1);
    var pos = g.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      var n = 0.76 + (Math.sin(x * 8.2 + seed) * 0.5 + 0.5) * 0.28 + Math.cos(z * 6.4 + seed * 1.3) * 0.08;
      pos.setXYZ(i, x * n, y * n * 0.68, z * n);
    }
    g.computeVertexNormals();
    return g;
  }

  function paintSky(th) {
    if (!ok()) return;
    if (skyRoot) {
      scene.remove(skyRoot);
      skyRoot.traverse(function (o) {
        if (o.geometry && o !== skyMesh) o.geometry.dispose();
      });
    }
    skyRoot = new T.Group();
    scene.add(skyRoot);
    var skyC = document.createElement("canvas");
    skyC.width = 16;
    skyC.height = 256;
    var sg = skyC.getContext("2d");
    var grd = sg.createLinearGradient(0, 0, 0, 256);
    if (th.dusk) {
      grd.addColorStop(0, "#14102c");
      grd.addColorStop(0.42, "#2a2158");
      grd.addColorStop(0.7, "#6a4a88");
      grd.addColorStop(1, "#1c1820");
    } else {
      grd.addColorStop(0, "#6eb4e6");
      grd.addColorStop(0.38, "#b7dcf4");
      grd.addColorStop(0.68, "#e4eede");
      grd.addColorStop(1, "#9aaf88");
    }
    sg.fillStyle = grd;
    sg.fillRect(0, 0, 16, 256);
    var skyMap = new T.CanvasTexture(skyC);
    skyMap.needsUpdate = true;
    if (skyMesh) {
      skyMesh.geometry.dispose();
      if (skyMesh.material.map) skyMesh.material.map.dispose();
      skyMesh.material.dispose();
    }
    skyMesh = new T.Mesh(
      new T.SphereGeometry(2400, 32, 20),
      new T.MeshBasicMaterial({ map: skyMap, side: T.BackSide, fog: false })
    );
    skyRoot.add(skyMesh);
    sunDisc = new T.Mesh(
      new T.SphereGeometry(14, 16, 12),
      new T.MeshBasicMaterial({ color: th.dusk ? 0xf0d8ff : 0xfff4d0, fog: false })
    );
    sunDisc.position.set(-520, th.dusk ? 220 : 380, 180);
    skyRoot.add(sunDisc);
    var glow = new T.Mesh(
      new T.SphereGeometry(28, 12, 10),
      new T.MeshBasicMaterial({ color: th.dusk ? 0xc4b0ff : 0xffe7a0, transparent: true, opacity: 0.28, fog: false, depthWrite: false })
    );
    glow.position.copy(sunDisc.position);
    skyRoot.add(glow);
    var nCloud = th.dusk ? 4 : 8;
    var cmat = new T.MeshBasicMaterial({
      map: tex.cloud,
      transparent: true,
      opacity: th.dusk ? 0.18 : 0.38,
      depthWrite: false,
      fog: false,
      side: T.DoubleSide
    });
    for (var i = 0; i < nCloud; i++) {
      var w = 90 + (i % 5) * 18;
      var cl = new T.Mesh(new T.PlaneGeometry(w, w * 0.48), cmat);
      cl.position.set(-200 + i * 160, 210 + (i % 3) * 36, -420 + (i % 4) * 180);
      cl.rotation.y = 0.2 + i * 0.31;
      cl.userData.drift = 2.2 + (i % 3);
      skyRoot.add(cl);
    }
  }

  function densify(path, step) {
    var out = [];
    for (var i = 0; i < path.length - 1; i++) {
      var a = path[i], b = path[i + 1];
      var len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      var n = Math.max(1, Math.ceil(len / step));
      for (var k = 0; k < n; k++) {
        var t = k / n;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    out.push(path[path.length - 1]);
    return out;
  }

  function ribbonGeo(path, width, y, opts) {
    opts = opts || {};
    if (!path || path.length < 2) {
      var empty = new T.BufferGeometry();
      empty.setAttribute("position", new T.Float32BufferAttribute([0, y, 0, 1, y, 0, 0, y, 1], 3));
      empty.setIndex([0, 1, 2]);
      return empty;
    }
    var uvS = opts.uvScale || 0.03;
    var skipWater = opts.skipWater == null ? -1.5 : opts.skipWater;
    var pts = densify(path, opts.step || 8);
    var n = pts.length;
    var perps = [];
    var i, prev, next, tx, tz, len, px, pz;
    for (i = 0; i < n; i++) {
      prev = pts[Math.max(0, i - 1)];
      next = pts[Math.min(n - 1, i + 1)];
      tx = next.x - prev.x;
      tz = next.y - prev.y;
      len = Math.hypot(tx, tz) || 1;
      perps.push({ x: -tz / len, z: tx / len });
    }
    for (i = 0; i < n; i++) {
      var a = perps[Math.max(0, i - 1)];
      var b = perps[i];
      var c = perps[Math.min(n - 1, i + 1)];
      px = a.x + b.x + c.x;
      pz = a.z + b.z + c.z;
      len = Math.hypot(px, pz) || 1;
      var dot = Math.max(0.45, (px / len) * b.x + (pz / len) * b.z);
      var sc = Math.min(1.22, 1 / dot);
      perps[i] = { x: (px / len) * sc, z: (pz / len) * sc };
    }
    var pos = [];
    var uv = [];
    var idx = [];
    var distAcc = 0;
    for (i = 0; i < n; i++) {
      if (i > 0) distAcc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      var vv = distAcc * uvS;
      px = perps[i].x * width;
      pz = perps[i].z * width;
      var yL = y + heightAt(pts[i].x + px, pts[i].y + pz);
      var yR = y + heightAt(pts[i].x - px, pts[i].y - pz);
      pos.push(pts[i].x + px, yL, pts[i].y + pz);
      pos.push(pts[i].x - px, yR, pts[i].y - pz);
      uv.push(0, vv, 1, vv);
      if (i > 0) {
        var q = (i - 1) * 2;
        var mx = (pos[q * 3] + pos[(q + 2) * 3] + pos[(q + 1) * 3] + pos[(q + 3) * 3]) * 0.25;
        var mz = (pos[q * 3 + 2] + pos[(q + 2) * 3 + 2] + pos[(q + 1) * 3 + 2] + pos[(q + 3) * 3 + 2]) * 0.25;
        if (!skipWater || !inAnyWater({ x: mx, y: mz }, null, skipWater)) {
          idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
        }
      }
    }
    var g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function addBand(path, inner, outer, y, material) {
    var mid = (inner + outer) * 0.5;
    var half = Math.max(0.2, (outer - inner) * 0.5);
    var left = new T.Mesh(ribbonGeo(offsetPathPts(path, mid), half, y), material);
    var right = new T.Mesh(ribbonGeo(offsetPathPts(path, -mid), half, y), material);
    left.receiveShadow = right.receiveShadow = true;
    holeRoot.add(left);
    holeRoot.add(right);
  }

  function offsetPathPts(path, lat) {
    var pts = densify(path, 12);
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var prev = pts[Math.max(0, i - 1)];
      var next = pts[Math.min(pts.length - 1, i + 1)];
      var tx = next.x - prev.x, tz = next.y - prev.y;
      var len = Math.hypot(tx, tz) || 1;
      var px = -tz / len, pz = tx / len;
      out.push({ x: pts[i].x + px * lat, y: pts[i].y + pz * lat });
    }
    return out;
  }

  function addOobMarkers(hole) {
    var path = hole.path;
    if (!path || path.length < 2) return;
    var lat = (hole.fairW || 30) + 26;
    var lineMat = mat({ color: 0x8a9a78, roughness: 0.72, metalness: 0.04, emissive: 0x1a2414, emissiveIntensity: 0.04 });
    holeRoot.add(new T.Mesh(ribbonGeo(offsetPathPts(path, lat), 0.28, 0.11), lineMat));
    holeRoot.add(new T.Mesh(ribbonGeo(offsetPathPts(path, -lat), 0.28, 0.11), lineMat));
    var stakePts = densify(path, 22);
    var nMax = Math.min(stakePts.length * 2, 180);
    if (nMax < 2) return;
    var stakeGeo = new T.CylinderGeometry(0.055, 0.07, 1.12, 5);
    var stakeMat = mat({ color: 0xf7f4ee, roughness: 0.48, metalness: 0.12 });
    var stakes = new T.InstancedMesh(stakeGeo, stakeMat, nMax);
    stakes.castShadow = true;
    var dummy = new T.Object3D();
    var k = 0;
    var pin = hole.pin;
    var tee = hole.tee;
    for (var i = 1; i < stakePts.length - 1; i += 2) {
      var prev = stakePts[i - 1];
      var next = stakePts[Math.min(stakePts.length - 1, i + 1)];
      var tx = next.x - prev.x, tz = next.y - prev.y;
      var len = Math.hypot(tx, tz) || 1;
      var px = -tz / len, pz = tx / len;
      for (var s = -1; s <= 1; s += 2) {
        var x = stakePts[i].x + px * lat * s;
        var z = stakePts[i].y + pz * lat * s;
        if (pin && Math.hypot(x - pin.x, z - pin.y) < (hole.greenR || 12) + 10) continue;
        if (tee && Math.hypot(x - tee.x, z - tee.y) < 16) continue;
        if (inAnyWater({ x: x, y: z }, hole)) continue;
        dummy.position.set(x, heightAt(x, z, hole) + 0.58, z);
        dummy.rotation.set(0, i * 0.17, 0.03 * s);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        stakes.setMatrixAt(k, dummy.matrix);
        k += 1;
        if (k >= nMax) break;
      }
      if (k >= nMax) break;
    }
    if (k < 1) return;
    stakes.count = k;
    stakes.instanceMatrix.needsUpdate = true;
    holeRoot.add(stakes);
  }

  function perpAt(path, i) {
    var prev = path[Math.max(0, i - 1)];
    var next = path[Math.min(path.length - 1, i + 1)];
    var tx = next.x - prev.x, tz = next.y - prev.y;
    var len = Math.hypot(tx, tz) || 1;
    return { x: -tz / len, z: tx / len };
  }

  function inAnyWater(p, hole, pad) {
    hole = hole || lastHole;
    if (!hole) return false;
    var w = hole.water || [];
    pad = pad || 0;
    for (var i = 0; i < w.length; i++) {
      var r = w[i];
      if (p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad) return true;
    }
    return false;
  }

  /* Rounded-rectangle outline (in world XZ) so the rendered lake is the same
     footprint the physics uses: hole.water holds axis-aligned rects. */
  function roundedOutline(x0, z0, w, h, rx, rz, expand, seg) {
    var e = expand || 0;
    var ax = x0 - e, az = z0 - e, bx = x0 + w + e, bz = z0 + h + e;
    var r1 = Math.max(0.2, Math.min(rx + e, (bx - ax) / 2));
    var r2 = Math.max(0.2, Math.min(rz + e, (bz - az) / 2));
    var cx = [bx - r1, ax + r1, ax + r1, bx - r1];
    var cz = [bz - r2, bz - r2, az + r2, az + r2];
    var a0 = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    var out = [];
    for (var k = 0; k < 4; k++) {
      for (var i = 0; i <= seg; i++) {
        var a = a0[k] + (i / seg) * (Math.PI / 2);
        out.push([cx[k] + Math.cos(a) * r1, cz[k] + Math.sin(a) * r2]);
      }
    }
    return out;
  }

  function roundedRectGeo(r, seg) {
    var rx = Math.max(0.5, r.w * 0.34), rz = Math.max(0.5, r.h * 0.34);
    var pts = roundedOutline(r.x, r.y, r.w, r.h, rx, rz, 0, seg || 7);
    var pos = [], uv = [], idx = [];
    for (var j = 0; j < pts.length; j++) {
      pos.push(pts[j][0], 0, pts[j][1]);
      uv.push((pts[j][0] - r.x) / 26, (pts[j][1] - r.y) / 26);
    }
    // wound so the face normal points +Y (the outline runs CCW in XZ)
    for (var t = 1; t < pts.length - 1; t++) idx.push(0, t + 1, t);
    var g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* Shore band that follows the terrain, so the waterline reads as a bank
     instead of a floating plane. */
  function shoreBandGeo(r, inner, outer, seg) {
    var rx = Math.max(0.5, r.w * 0.34), rz = Math.max(0.5, r.h * 0.34);
    var a = roundedOutline(r.x, r.y, r.w, r.h, rx, rz, inner, seg || 7);
    var b = roundedOutline(r.x, r.y, r.w, r.h, rx, rz, outer, seg || 7);
    var pos = [], uv = [], idx = [];
    for (var i = 0; i < a.length; i++) {
      pos.push(a[i][0], heightAt(a[i][0], a[i][1]) + 0.05, a[i][1]);
      pos.push(b[i][0], heightAt(b[i][0], b[i][1]) + 0.05, b[i][1]);
      uv.push(0, i * 0.6, 1, i * 0.6);
      if (i > 0) {
        var q = (i - 1) * 2;
        idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
      }
    }
    var last = (a.length - 1) * 2;
    idx.push(last, 0, last + 1, last + 1, 0, 1);
    var g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function distToPath3(p, path) {
    if (!path || path.length < 2) return 1e9;
    var best = 1e9, i, a, b, dx, dy, len, t, qx, qy;
    for (i = 0; i < path.length - 1; i++) {
      a = path[i]; b = path[i + 1];
      dx = b.x - a.x; dy = b.y - a.y;
      len = dx * dx + dy * dy || 1;
      t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      qx = a.x + dx * t; qy = a.y + dy * t;
      var d = Math.hypot(p.x - qx, p.y - qy);
      if (d < best) best = d;
    }
    return best;
  }

  function heightAt(x, z, hole) {
    hole = hole || lastHole;
    if (!hole) return 0;
    var n = Math.sin(x * 0.011) * 1.6 + Math.cos(z * 0.009) * 1.35 + Math.sin((x + z) * 0.0065) * 2.1;
    var d = distToPath3({ x: x, y: z }, hole.path || []);
    var fw = hole.fairW || 30;
    var pin = hole.pin || { x: 0, y: 0 };
    var green = Math.hypot(x - pin.x, z - pin.y);
    var gR = hole.greenR || 16;
    var h;
    if (green < gR * 1.45) {
      var gt = 1 - green / (gR * 1.45);
      h = 0.42 + gt * 0.55;
    } else if (d < fw) {
      h = 0.28 + (1 - d / fw) * 0.16 + n * 0.05;
    } else if (d < fw + 30) {
      h = 0.12 + ((d - fw) / 30) * 0.2 + n * 0.18;
    } else {
      h = 0.35 + n * 0.85 + Math.min(7.5, (d - fw) * 0.01);
    }
    var waters = hole.water || [];
    for (var i = 0; i < waters.length; i++) {
      var r = waters[i];
      var dx = Math.max(r.x - x, 0, x - (r.x + r.w));
      var dz = Math.max(r.y - z, 0, z - (r.y + r.h));
      var off = Math.sqrt(dx * dx + dz * dz);
      if (off < WATER_SHORE) {
        var t = 1 - off / WATER_SHORE;
        h = h * (1 - t) + WATER_FLOOR * t;
      }
    }
    var bunks = hole.bunkers || [];
    for (i = 0; i < bunks.length; i++) {
      var b = bunks[i];
      var bd = Math.hypot(x - b.x, z - b.y) / Math.max(1, b.r);
      if (bd < 1) h = Math.min(h, 0.02 + bd * 0.12);
    }
    return h;
  }

  function cartPathPts(hole) {
    var path = hole.path || [];
    if (path.length < 2) return [];
    var lat0 = (hole.fairW || 30) + 8.4;
    var pts = [];
    var i, n, lat, p, guard;
    var n0 = perpAt(path, 0);
    var bx = path[0].x - (path[1].x - path[0].x) * 0.06;
    var by = path[0].y - (path[1].y - path[0].y) * 0.06;
    pts.push({ x: bx + n0.x * lat0, y: by + n0.z * lat0 });
    for (i = 0; i < path.length; i++) {
      n = perpAt(path, i);
      lat = lat0;
      p = { x: path[i].x + n.x * lat, y: path[i].y + n.z * lat };
      guard = 0;
      while (inAnyWater(p, hole) && guard < 8) {
        lat += 5.5;
        p = { x: path[i].x + n.x * lat, y: path[i].y + n.z * lat };
        guard += 1;
      }
      pts.push(p);
    }
    var last = path[path.length - 1];
    var nL = perpAt(path, path.length - 1);
    var gR = Math.max(6, hole.greenR || 12);
    pts.push({ x: last.x + nL.x * (gR + 6), y: last.y + nL.z * (gR + 6) });
    pts.push({
      x: last.x + nL.x * 3.2 - nL.z * 5,
      y: last.y + nL.z * 3.2 + nL.x * 5
    });
    return pts;
  }

  function addHorizon(hole, th) {
    var b = holeBounds(hole);
    var hillMat = mat({ map: tex.grass, color: th.grass, roughness: 1, flatShading: true });
    var dummy = new T.Object3D();
    var nHill = 10;
    var hg = new T.SphereGeometry(1, 10, 7);
    var hills = new T.InstancedMesh(hg, hillMat, nHill);
    hills.receiveShadow = true;
    var i, ang, dist, sx, sz;
    for (i = 0; i < nHill; i++) {
      ang = (i / nHill) * Math.PI * 2 + 0.2;
      dist = b.span * 0.95 + 260 + (i % 4) * 70;
      sx = b.cx + Math.cos(ang) * dist;
      sz = b.cz + Math.sin(ang) * dist;
      dummy.position.set(sx, heightAt(sx, sz, hole) - 4, sz);
      dummy.scale.set(90 + (i % 4) * 28, 22 + (i % 3) * 8, 70 + (i % 5) * 18);
      dummy.rotation.set(0, ang, 0);
      dummy.updateMatrix();
      hills.setMatrixAt(i, dummy.matrix);
    }
    hills.instanceMatrix.needsUpdate = true;
    holeRoot.add(hills);

    var nFar = 90;
    var trunkGeo = new T.CylinderGeometry(0.2, 0.32, 1, 5);
    var coneGeo = new T.ConeGeometry(1, 1.2, 6);
    var trunks = new T.InstancedMesh(trunkGeo, mat({ color: 0x4a3220, roughness: 1 }), nFar);
    var cones = new T.InstancedMesh(coneGeo, mat({ color: th.pine, roughness: 0.85, flatShading: true }), nFar);
    trunks.castShadow = cones.castShadow = true;
    for (i = 0; i < nFar; i++) {
      ang = (i / nFar) * Math.PI * 2 + i * 0.07;
      dist = b.span * 0.55 + 90 + (i % 7) * 18;
      sx = b.cx + Math.cos(ang) * dist;
      sz = b.cz + Math.sin(ang) * dist;
      var ht = 10 + (i % 6) * 2.4;
      dummy.position.set(sx, heightAt(sx, sz, hole) + ht * 0.22, sz);
      dummy.rotation.set(0, i, 0);
      dummy.scale.set(1.1, ht * 0.4, 1.1);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      dummy.position.y += ht * 0.45;
      dummy.scale.set(3.4 + (i % 3), ht * 0.85, 3.4 + (i % 3));
      dummy.updateMatrix();
      cones.setMatrixAt(i, dummy.matrix);
    }
    trunks.instanceMatrix.needsUpdate = true;
    cones.instanceMatrix.needsUpdate = true;
    holeRoot.add(trunks);
    holeRoot.add(cones);
  }

  function addBench(x, z, yaw) {
    var wood = mat({ color: 0x6b4a28, roughness: 0.9 });
    var g = new T.Group();
    var seat = new T.Mesh(new T.BoxGeometry(1.7, 0.1, 0.5), wood);
    seat.position.y = 0.42;
    var back = new T.Mesh(new T.BoxGeometry(1.7, 0.62, 0.08), wood);
    back.position.set(0, 0.78, -0.22);
    var leg1 = new T.Mesh(new T.BoxGeometry(0.08, 0.42, 0.08), wood);
    var leg2 = leg1.clone();
    var leg3 = leg1.clone();
    var leg4 = leg1.clone();
    leg1.position.set(-0.7, 0.21, 0.18);
    leg2.position.set(0.7, 0.21, 0.18);
    leg3.position.set(-0.7, 0.21, -0.18);
    leg4.position.set(0.7, 0.21, -0.18);
    g.add(seat, back, leg1, leg2, leg3, leg4);
    g.position.set(x, heightAt(x, z) + 0.04, z);
    g.rotation.y = yaw;
    g.castShadow = true;
    holeRoot.add(g);
  }

  function mat(opts) {
    return new T.MeshStandardMaterial(opts);
  }

  function themeOf(id) {
    if (id === "coral-lattice") {
      return {
        sky: 0x8ec8e8, fog: 0xcfe4f0, grass: 0xd6e6c0, fair: 0x4aaa62, dusk: false, sun: 0xffe6c4,
        pine: 0x2f8c56, water: 0x2a8fbe,
        turf: 0xcfe3ae, roughT: 0xc4d9a2, cutT: 0xdbe9b8, fairTop: 0x9ade86, greenTop: 0xa8ea90
      };
    }
    if (id === "singularity-nine") {
      return {
        sky: 0x1c1838, fog: 0x342c60, grass: 0x8a9cb4, fair: 0x2f7a48, dusk: true, sun: 0xc4b0ff,
        pine: 0x24503a, water: 0x2a5490,
        turf: 0x8ba0b6, roughT: 0x7d92aa, cutT: 0x93a8bc, fairTop: 0x78cc8c, greenTop: 0x8ede9e
      };
    }
    if (id === "endless") {
      return {
        sky: 0x4a6a88, fog: 0x8fa9b4, grass: 0xcddcb8, fair: 0x3e9a54, dusk: false, sun: 0xffd9a0,
        pine: 0x24663c, water: 0x2a80a8,
        turf: 0xc6d8ac, roughT: 0xb9cda0, cutT: 0xd2e0b2, fairTop: 0x8ed882, greenTop: 0x9ee28c
      };
    }
    return {
      sky: 0x7ec4ee, fog: 0xd6e6d2, grass: 0xd0e0b6, fair: 0x3e9652, dusk: false, sun: 0xfff1c2,
      pine: 0x2f7a44, water: 0x2a86b4,
      turf: 0xc8ddae, roughT: 0xbcd4a2, cutT: 0xd6e5b4, fairTop: 0x94dc84, greenTop: 0xa4e890
    };
  }

  function applyOrbit() {
    orbit.pitch = clamp(orbit.pitch, PITCH_MIN, PITCH_MAX);
    orbit.dist = clamp(orbit.dist, DIST_MIN, DIST_MAX);
    var cp = Math.cos(orbit.pitch);
    var sp = Math.sin(orbit.pitch);
    var cy = Math.cos(orbit.yaw);
    var sy = Math.sin(orbit.yaw);
    camGoal.lx = orbit.tx;
    camGoal.ly = orbit.ty;
    camGoal.lz = orbit.tz;
    camGoal.x = orbit.tx + orbit.dist * cy * cp;
    camGoal.y = orbit.ty + orbit.dist * sp;
    camGoal.z = orbit.tz + orbit.dist * sy * cp;
  }

  function snapCam() {
    applyOrbit();
    cam.x = camGoal.x; cam.y = camGoal.y; cam.z = camGoal.z;
    cam.lx = camGoal.lx; cam.ly = camGoal.ly; cam.lz = camGoal.lz;
  }

  function holeBounds(hole) {
    var minx = hole.tee.x, maxx = hole.tee.x, minz = hole.tee.y, maxz = hole.tee.y;
    (hole.path || []).forEach(function (p) {
      minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x);
      minz = Math.min(minz, p.y); maxz = Math.max(maxz, p.y);
    });
    minx = Math.min(minx, hole.pin.x); maxx = Math.max(maxx, hole.pin.x);
    minz = Math.min(minz, hole.pin.y); maxz = Math.max(maxz, hole.pin.y);
    (hole.water || []).forEach(function (r) {
      minx = Math.min(minx, r.x - 6); maxx = Math.max(maxx, r.x + r.w + 6);
      minz = Math.min(minz, r.y - 6); maxz = Math.max(maxz, r.y + r.h + 6);
    });
    return {
      cx: (minx + maxx) / 2,
      cz: (minz + maxz) / 2,
      span: Math.max(maxx - minx, maxz - minz, 80)
    };
  }

  function fitCamera(hole) {
    if (!hole) return;
    lastHole = hole;
    following = false;
    var b = holeBounds(hole);
    orbit.tx = b.cx;
    orbit.tz = b.cz;
    orbit.ty = 2.4;
    orbit.dist = clamp(b.span * 1.08, 55, 520);
    orbit.yaw = 0.92;
    orbit.pitch = 0.58;
    snapCam();
  }

  function followShot(ball) {
    if (!ball) return;
    following = true;
    var phase = ball.phase || ballPhase || "fly";
    var z = ball.z || 0;
    camGoal.lx = ball.x;
    camGoal.lz = ball.y;
    if (phase === "fly") {
      camLag = 0.00035;
      var hold = clamp(36 + z * 0.18, 30, 110);
      camGoal.ly = 1.6 + z * 0.4;
      camGoal.x = ball.x + Math.cos(orbit.yaw) * hold * 0.82;
      camGoal.y = 13 + z * 0.48;
      camGoal.z = ball.y + Math.sin(orbit.yaw) * hold * 0.82;
    } else if (phase === "bounce") {
      camLag = 0.012;
      var side = orbit.yaw + 0.62;
      camGoal.ly = 0.7;
      camGoal.x = ball.x + Math.cos(side) * 24;
      camGoal.y = 8.2;
      camGoal.z = ball.y + Math.sin(side) * 24;
    } else if (phase === "roll") {
      camLag = 0.045;
      var side = orbit.yaw + 0.42;
      camGoal.ly = 0.4;
      camGoal.x = ball.x + Math.cos(side) * 16;
      camGoal.y = 5.8;
      camGoal.z = ball.y + Math.sin(side) * 16;
    } else {
      camLag = 0.006;
      camGoal.ly = 0.35;
      camGoal.x = ball.x + Math.cos(orbit.yaw + 0.28) * 15;
      camGoal.y = 5.8;
      camGoal.z = ball.y + Math.sin(orbit.yaw + 0.28) * 15;
    }
  }

  function zoomBy(factor, around) {
    var before = orbit.dist;
    orbit.dist = clamp(orbit.dist * factor, DIST_MIN, DIST_MAX);
    if (around && Math.abs(orbit.dist - before) > 0.01) {
      var t = 1 - orbit.dist / before;
      orbit.tx += (around.x - orbit.tx) * t * 0.35;
      orbit.tz += (around.y - orbit.tz) * t * 0.35;
    }
    applyOrbit();
  }

  function orbitBy(dx, dy) {
    orbit.yaw += dx * 0.0075;
    orbit.pitch = clamp(orbit.pitch + dy * 0.0055, PITCH_MIN, PITCH_MAX);
    applyOrbit();
  }

  function panBy(dx, dy) {
    var scale = orbit.dist * 0.0016;
    var cy = Math.cos(orbit.yaw);
    var sy = Math.sin(orbit.yaw);
    var rx = -sy, rz = cy;
    orbit.tx += (-dx * rx + dy * cy) * scale;
    orbit.tz += (-dx * rz + dy * sy) * scale;
    applyOrbit();
  }

  function rebuild(hole, cid) {
    if (!ok() || !hole) return;
    lastHole = hole;
    courseId = cid || courseId;
    var th = themeOf(courseId);
    scene.background = new T.Color(th.sky);
    scene.fog.color.setHex(th.fog);
    scene.fog.density = th.dusk ? 0.0016 : 0.00055;
    if (hemi) hemi.color.setHex(th.dusk ? 0x8899dd : 0xeef6ff);
    if (sun) {
      sun.color.setHex(th.sun);
      sun.intensity = th.dusk ? 1.05 : 1.55;
    }
    paintSky(th);

    waterMeshes = [];
    flagPole = null;
    flagCloth = null;
    pickPlane = null;
    if (holeRoot) {
      scene.remove(holeRoot);
      holeRoot.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
      });
    }
    holeRoot = new T.Group();
    scene.add(holeRoot);

    // far field: cheap, covers the horizon
    var groundGeo = new T.PlaneGeometry(2200, 2200, 76, 76);
    var gpos = groundGeo.attributes.position;
    for (var gi = 0; gi < gpos.count; gi++) {
      var gx = gpos.getX(gi), gy = gpos.getY(gi);
      gpos.setZ(gi, heightAt(gx, -gy, hole) - 0.12);
    }
    groundGeo.computeVertexNormals();
    var ground = new T.Mesh(
      groundGeo,
      mat({ map: tex.grass, color: th.grass, roughness: 0.97, metalness: 0.0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    holeRoot.add(ground);

    // play area: fine mesh so banks, creeks and relief actually resolve
    var hb = holeBounds(hole);
    var nearSpan = Math.min(1800, Math.max(420, hb.span * 1.8));
    var nearSeg = Math.max(110, Math.min(280, Math.round(nearSpan / 4)));
    var nearGeo = new T.PlaneGeometry(nearSpan, nearSpan, nearSeg, nearSeg);
    var npos = nearGeo.attributes.position;
    for (var ni = 0; ni < npos.count; ni++) {
      var lx = npos.getX(ni), ly = npos.getY(ni);
      npos.setZ(ni, heightAt(lx + hb.cx, hb.cz - ly, hole) - 0.03);
    }
    nearGeo.computeVertexNormals();
    var near = new T.Mesh(
      nearGeo,
      mat({ map: tex.grass, color: th.grass, roughness: 0.97, metalness: 0.0 })
    );
    near.rotation.x = -Math.PI / 2;
    near.position.set(hb.cx, 0, hb.cz);
    near.receiveShadow = true;
    holeRoot.add(near);
    addHorizon(hole, th);

    var fw = hole.fairW || 30;
    var roughMat = mat({
      map: tex.rough, color: th.roughT || 0xbcd4a2, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: 1
    });
    var cutMat = mat({
      map: tex.rough, color: th.cutT || 0xd6e5b4, roughness: 0.94,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: 1
    });
    addBand(hole.path, fw + 14, fw + 28, 0.03, roughMat);
    addBand(hole.path, fw, fw + 14, 0.05, cutMat);

    var fair = new T.Mesh(
      ribbonGeo(hole.path, fw, 0.08, { uvScale: 0.016, step: 6 }),
      mat({
        map: tex.fair,
        color: th.fairTop || 0x94dc84,
        roughness: 0.72,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: 1
      })
    );
    fair.receiveShadow = true;
    holeRoot.add(fair);

    addOobMarkers(hole);

    var walk = cartPathPts(hole);
    if (walk.length >= 2) {
      var curb = new T.Mesh(
        ribbonGeo(walk, 1.7, 0.19),
        mat({ color: 0x4a453c, roughness: 1 })
      );
      curb.receiveShadow = true;
      holeRoot.add(curb);
      var pathMesh = new T.Mesh(
        ribbonGeo(walk, 1.25, 0.24),
        mat({
          map: tex.path,
          color: 0x9a9084,
          roughness: 0.86,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: 1
        })
      );
      pathMesh.receiveShadow = true;
      holeRoot.add(pathMesh);
      for (var wi = 1; wi < walk.length - 1; wi += 3) {
        var a = walk[wi - 1], b = walk[Math.min(walk.length - 1, wi + 1)];
        var yaw = Math.atan2(b.y - a.y, b.x - a.x);
        addBench(walk[wi].x + Math.cos(yaw + Math.PI / 2) * 2.1, walk[wi].y + Math.sin(yaw + Math.PI / 2) * 2.1, yaw);
      }
    }

    var gR = Math.max(6, hole.greenR);
    var pinH = heightAt(hole.pin.x, hole.pin.y, hole);
    var collar = new T.Mesh(
      new T.RingGeometry(gR * 0.98, gR * 1.42, 48),
      mat({ color: 0x2a6b3c, roughness: 0.9 })
    );
    collar.rotation.x = -Math.PI / 2;
    collar.position.set(hole.pin.x, pinH + 0.06, hole.pin.y);
    collar.receiveShadow = true;
    holeRoot.add(collar);

    var green = new T.Mesh(
      new T.CircleGeometry(gR, 48),
      mat({ map: tex.green, color: th.greenTop || 0xa4e890, roughness: 0.58 })
    );
    green.rotation.x = -Math.PI / 2;
    green.position.set(hole.pin.x, pinH + 0.1, hole.pin.y);
    green.receiveShadow = true;
    holeRoot.add(green);

    var teeH = heightAt(hole.tee.x, hole.tee.y, hole);
    var tee = new T.Mesh(
      new T.BoxGeometry(7.2, 0.18, 6.2),
      mat({ color: 0x3f8f54, roughness: 0.8 })
    );
    tee.position.set(hole.tee.x, teeH + 0.12, hole.tee.y);
    tee.castShadow = true;
    holeRoot.add(tee);
    var pegMat = mat({ color: 0xf8fafc, roughness: 0.4 });
    [[-1.1, -1.4], [1.1, -1.4]].forEach(function (xy) {
      var peg = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 0.28, 6), pegMat);
      peg.position.set(hole.tee.x + xy[0], teeH + 0.28, hole.tee.y + xy[1]);
      holeRoot.add(peg);
    });
    var teeSign = new T.Mesh(new T.BoxGeometry(0.08, 1.1, 0.7), mat({ color: 0xf4f4f5, roughness: 0.5 }));
    teeSign.position.set(hole.tee.x - 3.4, teeH + 0.7, hole.tee.y);
    holeRoot.add(teeSign);

    waterMeshes = [];
    (hole.water || []).forEach(function (w) {
      var r = { x: w.x, y: w.y, w: Math.max(8, w.w), h: Math.max(8, w.h) };

      // sandy bank that follows the terrain carve
      var shore = new T.Mesh(
        shoreBandGeo(r, 1.5, WATER_SHORE + 2.5, 7),
        mat({ map: tex.sand, color: 0xdcc79a, roughness: 1, metalness: 0 })
      );
      shore.receiveShadow = true;
      holeRoot.add(shore);

      // dark floor so turf never shows through the surface
      var basin = new T.Mesh(
        roundedRectGeo({ x: r.x, y: r.y, w: r.w, h: r.h }, 6),
        mat({ color: 0x123043, roughness: 0.92 })
      );
      basin.position.y = WATER_FLOOR + 0.08;
      holeRoot.add(basin);

      var m = new T.Mesh(
        roundedRectGeo(r, 9),
        mat({
          map: tex.water,
          color: 0xa8dcec,
          metalness: 0.12,
          roughness: 0.2,
          transparent: true,
          opacity: 0.92,
          emissive: 0x0d3e52,
          emissiveIntensity: 0.18
        })
      );
      m.position.y = WATER_LEVEL;
      m.userData.baseY = WATER_LEVEL;
      holeRoot.add(m);
      waterMeshes.push(m);
    });

    var sandMat = mat({ map: tex.sand, color: 0xe8d4a0, roughness: 1, metalness: 0 });
    var duneMat = mat({ map: tex.dune, color: 0xd4bc88, roughness: 0.98 });
    (hole.bunkers || []).forEach(function (b, bi) {
      var bh = heightAt(b.x, b.y, hole);
      var floor = new T.Mesh(
        new T.CircleGeometry(b.r * 0.98, 28),
        sandMat
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(b.x, bh - 0.08, b.y);
      floor.receiveShadow = true;
      holeRoot.add(floor);
      var lip = new T.Mesh(
        new T.TorusGeometry(b.r * 0.92, Math.max(0.28, b.r * 0.055), 6, 24),
        duneMat
      );
      lip.rotation.x = Math.PI / 2;
      lip.position.set(b.x, bh + 0.12, b.y);
      lip.scale.set(1, 1, 0.32);
      lip.castShadow = true;
      holeRoot.add(lip);
      var mound = new T.Mesh(new T.SphereGeometry(1, 10, 7), duneMat);
      var ang = (bi * 1.7) % (Math.PI * 2);
      mound.position.set(b.x + Math.cos(ang) * b.r * 0.92, bh + 0.18, b.y + Math.sin(ang) * b.r * 0.7);
      mound.scale.set(b.r * 0.42, b.r * 0.1, b.r * 0.34);
      mound.castShadow = true;
      mound.receiveShadow = true;
      holeRoot.add(mound);
    });

    var rocks = hole.rocks || [];
    var nRock = Math.min(rocks.length, 160);
    if (nRock) {
      var rg = rockGeo(2.2);
      var rmat = mat({ map: tex.rock, color: 0x8a8276, roughness: 0.92, flatShading: true });
      var rockMesh = new T.InstancedMesh(rg, rmat, nRock);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      var dummyR = new T.Object3D();
      for (var ri = 0; ri < nRock; ri++) {
        var rk = rocks[ri];
        var rs = Math.max(0.4, rk.r || 1);
        dummyR.position.set(rk.x, heightAt(rk.x, rk.y, hole) + rs * 0.38, rk.y);
        dummyR.rotation.set(ri * 0.4, ri * 0.73, ri * 0.21);
        dummyR.scale.set(rs, rs * (0.55 + (ri % 4) * 0.08), rs * 0.92);
        dummyR.updateMatrix();
        rockMesh.setMatrixAt(ri, dummyR.matrix);
      }
      rockMesh.instanceMatrix.needsUpdate = true;
      holeRoot.add(rockMesh);
    }

    var trees = hole.trees || [];
    var nTree = Math.min(trees.length, 280);
    if (nTree) {
      var trunkGeo = new T.CylinderGeometry(0.16, 0.28, 1, 6);
      var lowGeo = new T.ConeGeometry(1, 1, 7);
      var topGeo = new T.ConeGeometry(0.72, 0.7, 7);
      var roundGeo = new T.SphereGeometry(1, 8, 6);
      var trunkMat = mat({ map: tex.bark, color: 0x5a3a22, roughness: 0.96 });
      var lowMat = mat({ color: th.pine, roughness: 0.78, flatShading: true });
      var topMat = mat({ color: 0x24804a, roughness: 0.7, flatShading: true });
      var roundMat = mat({ color: 0x1f6b3a, roughness: 0.8, flatShading: true });
      var trunks = new T.InstancedMesh(trunkGeo, trunkMat, nTree);
      var lows = new T.InstancedMesh(lowGeo, lowMat, nTree);
      var tops = new T.InstancedMesh(topGeo, topMat, nTree);
      var rounds = new T.InstancedMesh(roundGeo, roundMat, nTree);
      trunks.castShadow = lows.castShadow = tops.castShadow = rounds.castShadow = true;
      var dummy = new T.Object3D();
      var color = new T.Color();
      var zero = new T.Matrix4();
      dummy.scale.set(0.001, 0.001, 0.001);
      dummy.position.set(0, -50, 0);
      dummy.updateMatrix();
      zero.copy(dummy.matrix);
      for (var i = 0; i < nTree; i++) {
        var tr = trees[i];
        var canopy = clamp(tr.r || 5.5, 4, 13);
        var height = canopy * 2.15;
        var isRound = tr.kind === "round" || (i % 5 === 0 && tr.kind !== "pine");
        var lean = ((i % 9) - 4) * 0.012;
        dummy.rotation.set(lean, i * 0.41, -lean * 0.35);
        var groundY = heightAt(tr.x, tr.y, hole);
        dummy.position.set(tr.x, groundY + height * 0.18, tr.y);
        dummy.scale.set(canopy * 0.12, height * 0.36, canopy * 0.12);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        color.setHSL(0.29, 0.5, 0.26);
        rounds.setColorAt(i, color);
        lows.setColorAt(i, color);
        tops.setColorAt(i, color);
        if (isRound) {
          dummy.position.y = groundY + height * 0.58;
          dummy.scale.set(canopy * 0.48, height * 0.38, canopy * 0.48);
          dummy.updateMatrix();
          rounds.setMatrixAt(i, dummy.matrix);
          lows.setMatrixAt(i, zero);
          tops.setMatrixAt(i, zero);
          color.setHSL(0.29 + (i % 5) * 0.01, 0.5, 0.28 + (i % 4) * 0.03);
          rounds.setColorAt(i, color);
        } else {
          dummy.position.y = groundY + height * 0.48;
          dummy.scale.set(canopy * 0.52, height * 0.55, canopy * 0.52);
          dummy.updateMatrix();
          lows.setMatrixAt(i, dummy.matrix);
          dummy.position.y = groundY + height * 0.82;
          dummy.scale.set(canopy * 0.34, height * 0.38, canopy * 0.34);
          dummy.updateMatrix();
          tops.setMatrixAt(i, dummy.matrix);
          rounds.setMatrixAt(i, zero);
          color.setHSL(0.28 + (i % 7) * 0.008, 0.5, 0.22 + (i % 5) * 0.03);
          lows.setColorAt(i, color);
          color.setHSL(0.31, 0.55, 0.30 + (i % 4) * 0.03);
          tops.setColorAt(i, color);
        }
      }
      trunks.instanceMatrix.needsUpdate = true;
      lows.instanceMatrix.needsUpdate = true;
      tops.instanceMatrix.needsUpdate = true;
      rounds.instanceMatrix.needsUpdate = true;
      if (lows.instanceColor) lows.instanceColor.needsUpdate = true;
      if (tops.instanceColor) tops.instanceColor.needsUpdate = true;
      if (rounds.instanceColor) rounds.instanceColor.needsUpdate = true;
      holeRoot.add(trunks);
      holeRoot.add(lows);
      holeRoot.add(tops);
      holeRoot.add(rounds);
    }

    (hole.path || []).forEach(function (p, i) {
      if (i === 0 || i === hole.path.length - 1) return;
      var pip = new T.Mesh(
        new T.SphereGeometry(0.28, 8, 6),
        mat({ color: 0xfbbf24, emissive: 0x664400, roughness: 0.4 })
      );
      pip.position.set(p.x, heightAt(p.x, p.y, hole) + 0.45, p.y);
      holeRoot.add(pip);
    });

    var cup = new T.Mesh(
      new T.CircleGeometry(0.22, 16),
      mat({ color: 0x111111, roughness: 1, metalness: 0.25 })
    );
    cup.rotation.x = -Math.PI / 2;
    cup.position.set(hole.pin.x, pinH + 0.14, hole.pin.y);
    holeRoot.add(cup);

    flagPole = new T.Mesh(
      new T.CylinderGeometry(0.035, 0.045, 2.55, 8),
      mat({ color: 0xf4f4f5, metalness: 0.55, roughness: 0.28 })
    );
    flagPole.position.set(hole.pin.x, pinH + 1.38, hole.pin.y);
    flagPole.castShadow = true;
    holeRoot.add(flagPole);
    flagCloth = new T.Mesh(
      new T.PlaneGeometry(0.85, 0.48),
      mat({ color: 0xef4444, side: T.DoubleSide, roughness: 0.48 })
    );
    flagCloth.position.set(0.44, 0.92, 0);
    flagPole.add(flagCloth);
    var finial = new T.Mesh(
      new T.SphereGeometry(0.06, 8, 6),
      mat({ color: 0xfbbf24, metalness: 0.6, roughness: 0.3 })
    );
    finial.position.set(0, 1.3, 0);
    flagPole.add(finial);

    pickPlane = new T.Mesh(
      new T.PlaneGeometry(2200, 2200),
      new T.MeshBasicMaterial({ visible: false })
    );
    pickPlane.rotation.x = -Math.PI / 2;
    holeRoot.add(pickPlane);

    if (sun) {
      var hb = holeBounds(hole);
      sun.position.set(hb.cx - 90, 160, hb.cz + 50);
      if (!sun.target.parent) scene.add(sun.target);
      sun.target.position.set(hb.cx, 2, hb.cz);
      var ext = Math.max(140, hb.span * 0.72);
      sun.shadow.camera.left = -ext;
      sun.shadow.camera.right = ext;
      sun.shadow.camera.top = ext;
      sun.shadow.camera.bottom = -ext;
      sun.shadow.camera.updateProjectionMatrix();
    }

    fitCamera(hole);
  }

  function ensureActors() {
    if (ballMesh) return;
    ballMesh = new T.Mesh(
      new T.SphereGeometry(BALL_R, 18, 14),
      mat({ color: 0xf4f7f2, roughness: 0.32, metalness: 0.05 })
    );
    ballMesh.castShadow = true;
    scene.add(ballMesh);
    ballShadow = new T.Mesh(
      new T.CircleGeometry(BALL_R * 1.7, 12),
      new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
    );
    ballShadow.rotation.x = -Math.PI / 2;
    scene.add(ballShadow);
    markerRoot = new T.Group();
    markerHalo = new T.Mesh(
      new T.RingGeometry(0.55, 0.82, 28),
      new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false })
    );
    markerHalo.rotation.x = -Math.PI / 2;
    markerHalo.position.y = 0.05;
    var markerPad = new T.Mesh(
      new T.CircleGeometry(0.22, 16),
      new T.MeshBasicMaterial({ color: 0x042f2e, transparent: true, opacity: 0.55, depthWrite: false })
    );
    markerPad.rotation.x = -Math.PI / 2;
    markerPad.position.y = 0.04;
    var stem = new T.Mesh(
      new T.CylinderGeometry(0.03, 0.04, 1.45, 8),
      mat({ color: 0xccfbf1, metalness: 0.45, roughness: 0.28, emissive: 0x134e4a, emissiveIntensity: 0.35 })
    );
    stem.position.y = 0.85;
    markerHead = new T.Mesh(
      new T.ConeGeometry(0.26, 0.52, 5),
      mat({ color: 0x5eead4, emissive: 0x115e59, emissiveIntensity: 0.55, roughness: 0.32 })
    );
    markerHead.position.y = 1.55;
    var headCap = new T.Mesh(
      new T.SphereGeometry(0.08, 8, 6),
      mat({ color: 0xfbbf24, emissive: 0x854d0e, roughness: 0.3 })
    );
    headCap.position.y = 1.84;
    var beam = new T.Mesh(
      new T.CylinderGeometry(0.09, 0.09, 2.4, 10),
      new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.12, depthWrite: false })
    );
    beam.position.y = 1.2;
    markerRoot.add(markerHalo, markerPad, stem, markerHead, headCap, beam);
    markerMesh = markerRoot;
    scene.add(markerRoot);
    windPip = new T.Mesh(
      new T.SphereGeometry(0.22, 12, 10),
      mat({ color: 0xc084fc, emissive: 0x4c1d95, roughness: 0.35 })
    );
    scene.add(windPip);
    carryMark = new T.Group();
    var cRing = new T.Mesh(
      new T.RingGeometry(0.38, 0.55, 20),
      new T.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false })
    );
    cRing.rotation.x = -Math.PI / 2;
    cRing.position.y = 0.05;
    var cPin = new T.Mesh(
      new T.ConeGeometry(0.16, 0.4, 5),
      mat({ color: 0xfbbf24, emissive: 0x78350f, roughness: 0.4 })
    );
    cPin.position.y = 0.42;
    carryMark.add(cRing, cPin);
    carryMark.visible = false;
    scene.add(carryMark);
    var ringGeo = new T.RingGeometry(0.9, 1.05, 48);
    carryRing = new T.Mesh(ringGeo, new T.MeshBasicMaterial({
      color: 0xfbbf24, transparent: true, opacity: 0.35, side: T.DoubleSide
    }));
    carryRing.rotation.x = -Math.PI / 2;
    scene.add(carryRing);
    var lg = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]);
    aimLine = new T.Line(lg, new T.LineDashedMaterial({
      color: 0x5eead4, dashSize: 3, gapSize: 2.2, transparent: true, opacity: 0.8
    }));
    scene.add(aimLine);
    var tg = new T.BufferGeometry().setFromPoints(new Array(20).fill(0).map(function () { return new T.Vector3(); }));
    trailLine = new T.Line(tg, new T.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.45 }));
    scene.add(trailLine);
    impactRing = new T.Mesh(
      new T.RingGeometry(0.6, 1.05, 28),
      new T.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.4, side: T.DoubleSide, depthWrite: false })
    );
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.visible = false;
    scene.add(impactRing);
    if (!ghostRoot) {
      ghostRoot = new T.Group();
      scene.add(ghostRoot);
    }
  }

  function updateActors(s) {
    ensureActors();
    var b = s.ball || { x: 0, y: 0 };
    ballPhase = s.phase || b.phase || "";
    var lift = (b.z || 0) * 0.42;
    var gy = heightAt(b.x, b.y);
    ballMesh.position.set(b.x, gy + 0.16 + lift, b.y);
    ballShadow.position.set(b.x, gy + 0.04, b.y);
    ballShadow.scale.setScalar(1 + lift * 0.03);
    ballShadow.material.opacity = Math.max(0.08, 0.28 - lift * 0.006);
    if (impactRing) {
      if (ballPhase === "bounce") {
        var hop = Math.max(0.2, 1 - (b.z || 0) / 8);
        impactRing.visible = true;
        impactRing.position.set(b.x, gy + 0.1, b.y);
        impactRing.scale.set(2.2 * hop, 2.2 * hop, 1);
        impactRing.material.opacity = 0.18 + hop * 0.22;
      } else if (ballPhase === "roll") {
        impactRing.visible = true;
        impactRing.position.set(b.x, gy + 0.08, b.y);
        impactRing.scale.set(1.4, 1.4, 1);
        impactRing.material.opacity = 0.12;
      } else {
        impactRing.visible = false;
      }
    }
    if (s.marker && markerRoot) {
      markerRoot.visible = true;
      var my = heightAt(s.marker.x, s.marker.y);
      markerRoot.position.set(s.marker.x, my, s.marker.y);
      var pts = [new T.Vector3(b.x, gy + 0.2, b.y), new T.Vector3(s.marker.x, my + 0.2, s.marker.y)];
      aimLine.geometry.setFromPoints(pts);
      aimLine.computeLineDistances();
      aimLine.visible = true;
    } else {
      if (markerRoot) markerRoot.visible = false;
      if (aimLine) aimLine.visible = false;
    }
    var land = s.pred && (s.pred.carry || s.pred.dest);
    carryRing.visible = !!(land && !s.flying);
    if (carryRing.visible) {
      var lx = land.x, lz = land.y;
      carryRing.position.set(lx, heightAt(lx, lz) + 0.1, lz);
      carryRing.scale.set(3.4, 3.4, 1);
    }
    if (s.pred && s.pred.carry && carryMark) {
      var cdx = s.pred.carry.x - (s.pred.dest ? s.pred.dest.x : s.pred.carry.x);
      var cdy = s.pred.carry.y - (s.pred.dest ? s.pred.dest.y : s.pred.carry.y);
      var showCarry = Math.hypot(cdx, cdy) > 2.5;
      carryMark.visible = showCarry;
      if (showCarry) carryMark.position.set(s.pred.carry.x, heightAt(s.pred.carry.x, s.pred.carry.y), s.pred.carry.y);
    } else if (carryMark) carryMark.visible = false;
    if (s.pred && s.pred.dest) {
      windPip.visible = true;
      windPip.position.set(s.pred.dest.x, heightAt(s.pred.dest.x, s.pred.dest.y) + 0.28, s.pred.dest.y);
      windPip.material.color.setHex(s.pred.blocked ? 0xf87171 : 0xc084fc);
    } else windPip.visible = false;
    var trail = s.trail || [];
    if (trail.length > 1) {
      var tp = trail.map(function (t) {
        return new T.Vector3(t.x, heightAt(t.x, t.y) + 0.16 + (t.z || 0) * 0.42, t.y);
      });
      trailLine.geometry.setFromPoints(tp);
      trailLine.visible = true;
    } else trailLine.visible = false;
    syncGhosts(s.ghosts || []);
  }

  function syncGhosts(list) {
    if (!ghostRoot) return;
    var seen = {};
    var i, g, rec, y;
    for (i = 0; i < list.length; i++) {
      rec = list[i];
      if (!rec || rec.id == null) continue;
      seen[rec.id] = true;
      g = ghostBalls[rec.id];
      if (!g) {
        g = new T.Group();
        var sph = new T.Mesh(
          new T.SphereGeometry(0.22, 12, 10),
          mat({ color: rec.mine ? 0x5eead4 : 0xfbbf24, roughness: 0.35, emissive: rec.mine ? 0x134e4a : 0x78350f, emissiveIntensity: 0.35 })
        );
        sph.castShadow = true;
        var sh = new T.Mesh(
          new T.CircleGeometry(0.32, 10),
          new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
        );
        sh.rotation.x = -Math.PI / 2;
        sh.position.y = -0.12;
        g.add(sph, sh);
        ghostRoot.add(g);
        ghostBalls[rec.id] = g;
      }
      y = heightAt(rec.x, rec.y) + 0.16 + (rec.z || 0) * 0.42;
      g.position.set(rec.x, y, rec.y);
      g.visible = true;
    }
    Object.keys(ghostBalls).forEach(function (id) {
      if (!seen[id]) {
        ghostRoot.remove(ghostBalls[id]);
        delete ghostBalls[id];
      }
    });
  }

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, clock.getDelta());
    if (tex.water) {
      tex.water.offset.x += dt * 0.03;
      tex.water.offset.y += dt * 0.018;
    }
    if (waterMeshes && waterMeshes.length) {
      var tWave = clock.elapsedTime;
      for (var wi = 0; wi < waterMeshes.length; wi++) {
        if (!waterMeshes[wi] || !waterMeshes[wi].geometry) continue;
        var geo = waterMeshes[wi].geometry;
        var pos = geo.attributes && geo.attributes.position;
        if (!pos) continue;
        var baseY = waterMeshes[wi].userData.baseY || WATER_LEVEL;
        for (var pi = 0; pi < pos.count; pi++) {
          var px = pos.getX(pi), pz = pos.getZ(pi);
          pos.setY(pi, baseY + Math.sin(px * 0.18 + tWave * 1.4) * 0.07 + Math.cos(pz * 0.16 + tWave * 1.1) * 0.05);
        }
        pos.needsUpdate = true;
      }
    }
    if (skyRoot && camera) {
      skyRoot.children.forEach(function (ch) {
        if (ch.userData && ch.userData.drift) {
          ch.position.x += dt * ch.userData.drift;
          if (ch.position.x > 900) ch.position.x = -900;
          ch.lookAt(camera.position);
        }
      });
    }
    if (flagPole) {
      flagPole.rotation.y = windAng;
    }
    if (flagCloth) {
      var wave = Math.sin(clock.elapsedTime * 2.4 + windMph * 0.2) * 0.22;
      flagCloth.rotation.y = wave;
      flagCloth.rotation.z = Math.sin(clock.elapsedTime * 3.1) * 0.06;
      flagCloth.position.set(0.44, 0.92, 0);
    }
    if (markerRoot && markerRoot.visible) {
      var bob = Math.sin(clock.elapsedTime * 2.6) * 0.1;
      if (markerHead) markerHead.position.y = 1.55 + bob;
      markerRoot.rotation.y += dt * 0.9;
      if (markerHalo) {
        var pulse = 0.92 + Math.sin(clock.elapsedTime * 3.2) * 0.12;
        markerHalo.scale.set(pulse, pulse, 1);
        markerHalo.material.opacity = 0.55 + Math.sin(clock.elapsedTime * 3.2) * 0.22;
      }
    }
    if (carryMark && carryMark.visible) {
      carryMark.rotation.y += dt * 1.2;
    }
    if (ballMesh && (ballPhase === "fly" || ballPhase === "bounce" || ballPhase === "roll")) {
      ballMesh.rotateX((ballPhase === "fly" ? 0.2 : 0.58) * (dt / 0.016));
    }
    var k = 1 - Math.pow(camLag || 0.0018, dt);
    cam.x += (camGoal.x - cam.x) * k;
    cam.y += (camGoal.y - cam.y) * k;
    cam.z += (camGoal.z - cam.z) * k;
    cam.lx += (camGoal.lx - cam.lx) * k;
    cam.ly += (camGoal.ly - cam.ly) * k;
    cam.lz += (camGoal.lz - cam.lz) * k;
    camera.position.set(cam.x, cam.y, cam.z);
    camera.lookAt(cam.lx, cam.ly, cam.lz);
    renderer.render(scene, camera);
  }

  function pickAt(clientX, clientY) {
    if (!ok() || !canvasEl || !pickPlane) return null;
    var r = canvasEl.getBoundingClientRect();
    pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObject(pickPlane, false);
    if (!hits.length) return null;
    return { x: hits[0].point.x, y: hits[0].point.z };
  }

  function onWheel(e) {
    if (!ok()) return;
    e.preventDefault();
    var factor = e.deltaY < 0 ? 0.88 : 1.14;
    if (e.ctrlKey) factor = e.deltaY < 0 ? 0.8 : 1.22;
    zoomBy(factor, pickAt(e.clientX, e.clientY));
  }

  function onPtrDown(e) {
    if (!ok()) return;
    var orbitBtn = e.button === 2 || (e.button === 0 && e.altKey);
    var panBtn = e.button === 1 || (e.button === 0 && e.shiftKey);
    if (!orbitBtn && !panBtn) return;
    drag.on = true;
    drag.mode = panBtn ? "pan" : "orbit";
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.id = e.pointerId;
    try { canvasEl.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  }

  function onPtrMove(e) {
    if (!drag.on) return;
    var dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (drag.mode === "pan") panBy(dx, dy);
    else orbitBy(dx, dy);
  }

  function onPtrUp(e) {
    if (!drag.on) return;
    if (e.pointerId && drag.id && e.pointerId !== drag.id) return;
    drag.on = false;
    try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) {}
  }

  function bindCanvas() {
    if (!canvasEl || boundInput) return;
    boundInput = true;
    canvasEl.addEventListener("wheel", onWheel, { passive: false });
    canvasEl.addEventListener("pointerdown", onPtrDown);
    canvasEl.addEventListener("pointermove", onPtrMove);
    canvasEl.addEventListener("pointerup", onPtrUp);
    canvasEl.addEventListener("pointercancel", onPtrUp);
    canvasEl.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    canvasEl.addEventListener("dblclick", function (e) {
      e.preventDefault();
      if (lastHole) fitCamera(lastHole);
    });
  }

  function resize() {
    if (!ok() || !canvasEl) return;
    var w = canvasEl.clientWidth || 800;
    var h = canvasEl.clientHeight || 480;
    if (w < 8 || h < 8) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function init(canvas) {
    T = global.THREE;
    if (!T || !canvas) return false;
    canvasEl = canvas;
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch (e) {
      return false;
    }
    renderer.setPixelRatio(Math.min(1.75, global.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    if (T.SRGBColorSpace) renderer.outputColorSpace = T.SRGBColorSpace;
    scene = new T.Scene();
    scene.fog = new T.FogExp2(0xc8dcc8, 0.00055);
    camera = new T.PerspectiveCamera(44, 1, 1.2, 2800);
    clock = new T.Clock();
    raycaster = new T.Raycaster();
    pointer = new T.Vector2();
    makeTextures();

    hemi = new T.HemisphereLight(0xdce8ff, 0x5a6a44, 0.95);
    scene.add(hemi);
    sun = new T.DirectionalLight(0xffe8c8, 1.35);
    sun.position.set(-80, 140, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 600;
    sun.shadow.camera.left = -220;
    sun.shadow.camera.right = 220;
    sun.shadow.camera.top = 220;
    sun.shadow.camera.bottom = -220;
    sun.shadow.bias = -0.00025;
    scene.add(sun);
    scene.add(new T.AmbientLight(0x7e9ab0, 0.34));

    paintSky(themeOf("pine-haven"));

    bindCanvas();
    resize();
    running = true;
    loop();
    if (global.addEventListener) global.addEventListener("resize", resize);
    return true;
  }

  global.Golf3D = {
    init: init,
    active: ok,
    resize: resize,
    setHole: function (hole, cid) {
      if (!ok() || !hole) return;
      var key = [
        hole.name,
        hole.yards,
        hole.pin && hole.pin.x,
        hole.pin && hole.pin.y,
        hole.tee && hole.tee.y,
        (hole.path && hole.path.length) || 0,
        (hole.water && hole.water.length) || 0,
        (hole.trees && hole.trees.length) || 0
      ].join("|");
      if (key === holeKey && cid === courseId) return;
      holeKey = key;
      rebuild(hole, cid);
    },
    setState: function (s) {
      if (!ok() || !s || !s.hole) return;
      this.setHole(s.hole, s.courseId);
      windAng = (s.wind && s.wind.ang) || 0;
      windMph = (s.wind && s.wind.mph) || 0;
      updateActors(s);
      if (s.flying) {
        followShot(s.ball);
      } else {
        camLag = 0.0018;
        ballPhase = "";
        if (impactRing) impactRing.visible = false;
        if (following) {
          following = false;
          if (s.ball) {
            orbit.tx = s.ball.x;
            orbit.tz = s.ball.y;
            orbit.ty = 2.2;
          }
        }
        applyOrbit();
      }
    },
    pick: pickAt,
    fit: function (hole) {
      fitCamera(hole || lastHole);
    },
    zoom: function (factor) {
      zoomBy(factor || 0.88, null);
    },
    orbit: orbitBy,
    pan: panBy,
    resetView: function (hole) {
      fitCamera(hole || lastHole);
    },
  };
})(window);
