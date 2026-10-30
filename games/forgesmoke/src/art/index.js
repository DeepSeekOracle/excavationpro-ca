import { draw as drawWeaponSilhouette } from "./weapon_silhouette_module.js?v=202610325v";
import { draw as drawEnemySilhouette } from "./enemy_silhouette_module.js?v=202610325v";
import { draw as drawBossSilhouette } from "./boss_silhouette_module.js?v=202610325v";
import { draw as drawGroundTexture } from "./ground_texture_module.js?v=202610325v";
import { draw as drawWallTexture } from "./wall_texture_module.js?v=202610325v";
import { draw as drawCardIconSheet } from "./card_icon_sheet_module.js?v=202610325v";
import { draw as drawMuzzleFlash } from "./muzzle_flash_module.js?v=202610325v";
import { draw as drawImpactSpark } from "./impact_spark_module.js?v=202610325v";

export const PROCEDURAL_ART_MODULES = {
  weaponSilhouette: drawWeaponSilhouette,
  enemySilhouette: drawEnemySilhouette,
  bossSilhouette: drawBossSilhouette,
  groundTexture: drawGroundTexture,
  wallTexture: drawWallTexture,
  cardIconSheet: drawCardIconSheet,
  muzzleFlash: drawMuzzleFlash,
  impactSpark: drawImpactSpark,
};

/**
 * Render each procedural art module onto an offscreen canvas at startup so
 * every sprite is verified and available as a data URL / canvas texture.
 */
export function bakeProceduralArtSprites() {
  if (typeof document === "undefined") return {};
  const out = {};
  for (const [key, drawFn] of Object.entries(PROCEDURAL_ART_MODULES)) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawFn(ctx, 32, 32, 0.75, 0);
      out[key] = canvas.toDataURL("image/png");
    }
  }
  return out;
}
