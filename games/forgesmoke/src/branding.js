/**
 * In-world LYGO / Excavationpro branding: canvas wordmarks on lit sign panels, a spawn emblem and
 * branded cargo stencils. Everything is procedural, so the branding ships without new binaries.
 */

import * as THREE from "three";

const BRAND_GOLD = "#ffb347";
const BRAND_INK = "#0a0e14";

function canvas(size, h) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = h;
  return c;
}

function wordmarkTexture(lines, opts = {}) {
  const W = 1024;
  const H = 256;
  const c = canvas(W, H);
  const g = c.getContext("2d");
  g.clearRect(0, 0, W, H);
  // smoked glass panel with a gold edge
  g.fillStyle = "rgba(6,10,16,0.94)";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,179,71,0.85)";
  g.lineWidth = 6;
  g.strokeRect(8, 8, W - 16, H - 16);
  g.strokeStyle = "rgba(255,179,71,0.25)";
  g.lineWidth = 2;
  g.strokeRect(22, 22, W - 44, H - 44);

  // emblems on both ends
  for (const x of [72, W - 72]) {
    g.save();
    g.translate(x, H / 2);
    g.strokeStyle = BRAND_GOLD;
    g.lineWidth = 5;
    g.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const px = Math.cos(a) * 34;
      const py = Math.sin(a) * 34;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.stroke();
    g.fillStyle = BRAND_GOLD;
    g.beginPath();
    g.arc(0, 0, 7, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = opts.color || "#f4e8d0";
  g.font = `900 ${opts.size || 86}px "Arial Black", "Impact", system-ui, sans-serif`;
  g.fillText(lines[0], W / 2, opts.sub ? H / 2 - 22 : H / 2);
  if (opts.sub) {
    g.fillStyle = "rgba(255,179,71,0.92)";
    g.font = `700 30px "Arial Black", system-ui, sans-serif`;
    g.fillText(opts.sub, W / 2, H / 2 + 62);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function emblemTexture() {
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext("2d");
  g.clearRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.strokeStyle = "rgba(255,179,71,0.9)";
  g.lineWidth = 10;
  g.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const px = Math.cos(a) * 170;
    const py = Math.sin(a) * 170;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath();
  g.stroke();
  g.strokeStyle = "rgba(255,179,71,0.4)";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(0, 0, 120, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "rgba(255,179,71,0.95)";
  g.font = '900 74px "Arial Black", Impact, sans-serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("LYGO", 0, -4);
  g.font = '700 22px "Arial Black", sans-serif';
  g.fillStyle = "rgba(244,232,208,0.9)";
  g.fillText("EXCAVATIONPRO.CA", 0, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeSign(texture, width = 3.8, height = 1.35) {
  const sign = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x15181c, metalness: 0.85, roughness: 0.35, emissive: 0xffb347, emissiveIntensity: 0.25,
  });
  const faceMat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.12), frameMat);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.96, height * 0.9), faceMat);
  face.position.z = 0.07;
  // back face: mirrored map + rotated plane so the type reads correctly from behind
  const backTex = texture.clone();
  backTex.needsUpdate = true;
  backTex.wrapS = THREE.RepeatWrapping;
  backTex.repeat.x = -1;
  backTex.offset.x = 1;
  const backMat = new THREE.MeshBasicMaterial({ map: backTex, toneMapped: false });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.96, height * 0.9), backMat);
  back.position.z = -0.07;
  back.rotation.y = Math.PI;
  sign.add(frame, face, back);
  // Exposed for the camera: a sign is not a movement collider (the fighter must walk under it),
  // but the broadcast camera must not end up inside one.
  sign.userData.cameraBlocker = { hx: width / 2 + 0.4, hz: 0.6 };
  // mounting posts down to the deck
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.8, roughness: 0.45 });
  for (const px of [-width * 0.38, width * 0.38]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 8), postMat);
    post.position.set(px, -height / 2 - 1.3, -0.05);
    sign.add(post);
  }
  return sign;
}

/**
 * Add the branded props to an arena group.
 * @param {THREE.Group} group
 * @param {{id:string}} map
 */
export function buildBrandProps(group, map) {
  if (!group) return;
  const boardTex = wordmarkTexture(["LYGO"], { sub: "EXCAVATIONPRO.CA  //  FORGE SMOKE", size: 112 });
  const urlTex = wordmarkTexture(["EXCAVATIONPRO"], { sub: ".CA  //  SECTOR 09", size: 76 });
  const emblemTex = emblemTexture();

  // Big stadium board behind the spawn, squared to the chase camera so it reads in every run.
  const board = makeSign(boardTex, 7.4, 2.15);
  board.position.set(0, 3.9, -11.5);
  group.add(board);

  // Side board angled toward the arena centre.
  const side = makeSign(urlTex, 4.4, 1.5);
  side.position.set(-9.8, 2.8, -4.6);
  side.rotation.y = 0.55;
  group.add(side);

  // spawn emblem painted on the deck, just ahead of the operator's start
  const emblem = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({ map: emblemTex, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  emblem.rotation.x = -Math.PI / 2;
  emblem.position.set(0, 0.028, 1.6);
  group.add(emblem);
  if (map && map.id === "foundry") emblem.position.set(-2.4, 0.028, 2.6);

  // warm sign wash so the branding reads at night
  const glow = new THREE.PointLight(0xffb347, 4.5, 9, 2);
  glow.position.set(0, 2.6, 0.5);
  group.add(glow);
}
