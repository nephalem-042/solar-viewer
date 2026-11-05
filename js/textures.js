import { fbm, noise3, makeTexture, mix } from "./noise.js";

/* ---------- Textures ---------- */
// Grayscale on purpose: the yellow comes from the material color, so the hue never depends on the texture
export var sunTex = makeTexture(512, 256, function (x, y, z) {
  var n = fbm(x * 3 + 7, y * 3, z * 3, 5);
  var g = fbm(x * 9, y * 9 + 3, z * 9, 3);
  var v = Math.min(255, 175 + Math.min(1, n * 1.3) * 65 + Math.max(0, g - 0.6) * 60);
  return [v, v, v];
});

export var earthTex = makeTexture(512, 256, function (x, y, z) {
  var h = fbm(x * 2 + 11, y * 2, z * 2, 5);
  var pole = Math.abs(y) + (fbm(x * 6, y * 6, z * 6, 3) - 0.5) * 0.25;
  if (pole > 0.86) return [240, 246, 252];
  if (h < 0.5) return mix([8, 28, 90], [30, 95, 170], Math.min(1, h / 0.5));        // sea
  if (h < 0.53) return [218, 200, 140];                                                // shore
  var t = (h - 0.53) / 0.3;
  if (t > 0.85) return [235, 235, 235];                                                // peaks
  return mix([40, 130, 55], [125, 100, 60], Math.min(1, t * 1.2));                     // land
});

export var cloudTex = makeTexture(512, 256, function (x, y, z) {
  var n = fbm(x * 3 + 40, y * 4, z * 3, 5);
  var a = Math.max(0, Math.min(1, (n - 0.5) * 4));
  return [255, 255, 255, Math.round(a * 210)];
});

export var moonTex = makeTexture(256, 128, function (x, y, z) {
  var n = fbm(x * 4 + 5, y * 4, z * 4, 5);
  var crater = Math.pow(noise3(x * 9, y * 9, z * 9), 6) * 1.6;   // sparse darker pits
  var v = 215 + (n - 0.5) * 70 - crater * 60;
  v = Math.max(120, Math.min(255, v));
  return [v, v, v];
});

export function glowTexture(inner, outer) {
  var c = document.createElement("canvas"); c.width = c.height = 256;
  var g = c.getContext("2d"), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner); grd.addColorStop(0.35, outer); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
