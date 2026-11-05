/* Procedural noise helpers and the canvas texture builder. Uses the global THREE (loaded in index.html). */


/* ---------- Procedural noise ---------- */
function hash(x, y, z) {
  var s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function smooth(t) { return t * t * (3 - 2 * t); }
export function noise3(x, y, z) {
  var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  var xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  function l(a, b, t) { return a + (b - a) * t; }
  return l(
    l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), xf), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), xf), yf),
    l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), xf), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), xf), yf),
    zf);
}
export function fbm(x, y, z, oct) {
  var v = 0, a = 0.5, f = 1;
  for (var i = 0; i < oct; i++) { v += a * noise3(x * f, y * f, z * f); f *= 2; a *= 0.5; }
  return v;
}

/* Equirectangular canvas texture; sampled on the sphere so there is no seam */
export function makeTexture(w, h, fn) {
  var c = document.createElement("canvas");
  c.width = w; c.height = h;
  var ctx = c.getContext("2d"), img = ctx.createImageData(w, h), d = img.data;
  for (var py = 0; py < h; py++) {
    var lat = (py / h - 0.5) * Math.PI;
    for (var px = 0; px < w; px++) {
      var lon = (px / w) * Math.PI * 2;
      var x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon);
      var col = fn(x, y, z), i = (py * w + px) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = col.length > 3 ? col[3] : 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  var t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}
export function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
