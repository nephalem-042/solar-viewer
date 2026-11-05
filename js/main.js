import { sunTex, earthTex, cloudTex, moonTex, glowTexture } from "./textures.js";

/* ---------- Scene ---------- */
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060d);
var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);

// Stars
(function () {
  var n = 1500, pos = new Float32Array(n * 3);
  for (var i = 0; i < n; i++) {
    var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 200 + Math.random() * 100, s = Math.sqrt(1 - u * u);
    pos[i * 3] = r * s * Math.cos(th); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(th);
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfe4ff, size: 1.2, sizeAttenuation: false })));
})();

// Sun
var sun = new THREE.Mesh(new THREE.SphereGeometry(3.5, 48, 32), new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffd23c }));
scene.add(sun);
var glow = new THREE.Sprite(new THREE.SpriteMaterial({
  color: 0xffc83a,
  map: glowTexture("rgba(255,255,255,0.9)", "rgba(255,255,255,0.3)"),
  blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
}));
glow.scale.set(20, 20, 1);
scene.add(glow);
scene.add(new THREE.PointLight(0xfff2cc, 1.6, 0, 0));
scene.add(new THREE.AmbientLight(0x1a2438, 0.9));

// Earth system: pivot -> earth (tilted) -> moon pivot
var EARTH_DIST = 15, MOON_DIST = 2.6;
var earthOrbit = new THREE.Object3D(); scene.add(earthOrbit);
var earthHolder = new THREE.Object3D(); earthHolder.position.x = EARTH_DIST; earthOrbit.add(earthHolder);
var earthTilt = new THREE.Object3D(); earthTilt.rotation.z = 23.4 * Math.PI / 180; earthHolder.add(earthTilt);
var earth = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 32), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.9, metalness: 0 }));
earthTilt.add(earth);
var clouds = new THREE.Mesh(new THREE.SphereGeometry(1.34, 48, 32), new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, depthWrite: false, roughness: 1 }));
earthTilt.add(clouds);
var atmo = new THREE.Sprite(new THREE.SpriteMaterial({
  color: 0x5aa0ff,
  map: glowTexture("rgba(255,255,255,0)", "rgba(255,255,255,0.35)"),
  blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
}));
atmo.scale.set(4.2, 4.2, 1); earthHolder.add(atmo);

var moonPivot = new THREE.Object3D(); moonPivot.rotation.x = 5 * Math.PI / 180; earthHolder.add(moonPivot);
var moon = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 24), new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1 }));
moon.position.x = MOON_DIST; moonPivot.add(moon);

// Orbit guides
function ring(r, color, opacity, parent) {
  var pts = [];
  for (var i = 0; i <= 128; i++) { var a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  var l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }));
  parent.add(l);
}
ring(EARTH_DIST, 0x3a5a8c, 0.45, scene);
var moonRingHolder = new THREE.Object3D(); earthHolder.add(moonRingHolder);
ring(MOON_DIST, 0x8aa0c0, 0.3, moonRingHolder);
moonRingHolder.rotation.x = 5 * Math.PI / 180;

/* ---------- Camera: drag to orbit, wheel/pinch to zoom ---------- */
var yaw = 0.6, pitch = 0.45, dist = 34, targetDist = 34;
var pointers = {}, lastPinch = 0;
var el = renderer.domElement;
el.addEventListener("pointerdown", function (e) { el.setPointerCapture(e.pointerId); pointers[e.pointerId] = { x: e.clientX, y: e.clientY }; });
el.addEventListener("pointerup", function (e) { delete pointers[e.pointerId]; lastPinch = 0; });
el.addEventListener("pointercancel", function (e) { delete pointers[e.pointerId]; lastPinch = 0; });
el.addEventListener("pointermove", function (e) {
  var p = pointers[e.pointerId]; if (!p) return;
  var ids = Object.keys(pointers);
  if (ids.length === 1) {
    yaw -= (e.clientX - p.x) * 0.006;
    pitch = Math.max(-1.35, Math.min(1.35, pitch + (e.clientY - p.y) * 0.006));
  }
  p.x = e.clientX; p.y = e.clientY;
  if (ids.length === 2) {
    var a = pointers[ids[0]], b = pointers[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (lastPinch) targetDist = clamp(targetDist * (lastPinch / d), 6, 90);
    lastPinch = d;
  }
});
el.addEventListener("wheel", function (e) { e.preventDefault(); targetDist = clamp(targetDist * (1 + e.deltaY * 0.001), 6, 90); }, { passive: false });
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function resize() {
  var w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize); resize();

/* ---------- Loop ---------- */
var speedEl = document.getElementById("speed"), dayEl = document.getElementById("day"), phaseEl = document.getElementById("phase");
var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var simDay = 0, last = performance.now(), idle = 0;
var tmpE = new THREE.Vector3(), tmpM = new THREE.Vector3();

function frame(now) {
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  var speed = parseFloat(speedEl.value) * (reduced ? 0.3 : 1);
  simDay += dt * speed * 20;                               // 20 simulated days per second at x1

  earthOrbit.rotation.y = -simDay / 365.25 * Math.PI * 2;
  earth.rotation.y = simDay * 0.35;
  clouds.rotation.y = simDay * 0.4;
  moonPivot.rotation.y = -simDay / 27.3 * Math.PI * 2;
  moon.rotation.y = -moonPivot.rotation.y;                  // keep the same face toward Earth
  sun.rotation.y = simDay * 0.01;

  earthHolder.getWorldPosition(tmpE); moon.getWorldPosition(tmpM);
  var toSun = tmpE.clone().negate().normalize(), toMoon = tmpM.sub(tmpE).normalize();
  var illum = (1 - toSun.dot(toMoon)) / 2;                  // 0 new moon, 1 full moon
  dayEl.textContent = Math.floor(simDay);
  phaseEl.textContent = Math.round(illum * 100) + "%";

  if (!Object.keys(pointers).length && !reduced) yaw += dt * 0.04;   // slow drift while idle
  dist += (targetDist - dist) * 0.1;
  camera.position.set(
    Math.sin(yaw) * Math.cos(pitch) * dist,
    Math.sin(pitch) * dist,
    Math.cos(yaw) * Math.cos(pitch) * dist
  );
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
