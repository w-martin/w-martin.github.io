import { VERT } from "./gl";

// Clicking a cover (which also loads the player) briefly consumes it: a wall of fire sweeps up
// The Ladder and burns out; ice freezes outward from the click over Flight and then melts.
// Each runs a throwaway WebGL canvas for a couple of seconds, then releases it.
const CONSUME_MS: Record<string, number> = { fire: 2600, ice: 2700 };
const NOISE = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(7.1, 3.7); a *= 0.5; }
  return s;
}`;
const FIRE = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o; uniform float t;
${NOISE}
void main() {
  float v = 1.0 - uv.y;
  float k = t / 2.6;
  float up = mix(-0.1, 1.45, 1.0 - pow(1.0 - clamp(k / 0.2, 0.0, 1.0), 2.0));
  float lo = mix(-0.5, 1.5, smoothstep(0.42, 0.98, k));
  vec2 q = vec2(uv.x * 3.8, v * 2.4 - t * 5.2);
  float n = fbm(q + vec2(0.0, fbm(q * 1.7 + t * 1.8) * 1.2));
  float flick = 0.88 + 0.12 * sin(t * 21.0 + uv.x * 9.0);
  float top = smoothstep(0.0, 0.3, up - v + (n - 0.5) * 0.9);
  float bot = smoothstep(0.0, 0.36, v - lo + (n - 0.5) * 0.7);
  float f = top * bot;
  float heat = clamp(f * (0.3 + n * 1.0) * flick * 1.15, 0.0, 1.0);
  vec3 c = mix(vec3(0.5, 0.04, 0.0), vec3(1.0, 0.3, 0.02), smoothstep(0.06, 0.38, heat));
  c = mix(c, vec3(1.0, 0.7, 0.12), smoothstep(0.38, 0.72, heat));
  c = mix(c, vec3(1.0, 0.95, 0.66), smoothstep(0.82, 1.0, heat) * 0.6);
  float a = smoothstep(0.04, 0.3, f);
  // Colour is stronger than coverage, so the flames add light and the art shows through them.
  o = vec4(c * a * 1.05, a * 0.7);
}`;
const ICE = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o; uniform float t; uniform vec2 origin;
${NOISE}
void main() {
  float k = t / 2.7;
  float d = length(uv - origin);
  float up = mix(0.0, 1.9, 1.0 - pow(1.0 - clamp(k / 0.4, 0.0, 1.0), 2.0));
  float lo = mix(-0.4, 2.0, smoothstep(0.28, 0.98, k));
  float n = fbm(uv * 7.0);
  float s = d + (n - 0.5) * 0.35;
  float f = smoothstep(0.0, 0.10, up - s) * smoothstep(0.0, 0.14, s - lo);
  vec2 g = uv * 14.0 + n * 0.8; vec2 ip = floor(g), fp = fract(g);
  float m1 = 8.0, m2 = 8.0; vec2 cell = ip;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
vec2 b = vec2(float(i), float(j));
vec2 r = b + vec2(hash(ip + b), hash((ip + b) * 1.7 + 3.1)) - fp;
float dd = dot(r, r);
if (dd < m1) { m2 = m1; m1 = dd; cell = ip + b; } else if (dd < m2) { m2 = dd; }
  }
  float edge = smoothstep(0.0, 0.08, sqrt(m2) - sqrt(m1));
  vec3 base = mix(vec3(0.5, 0.74, 0.94), vec3(0.86, 0.95, 1.0), hash(cell) * 0.55 + n * 0.55);
  base = mix(vec3(0.97, 0.99, 1.0), base, edge * 0.55 + 0.45);
  float rim = smoothstep(0.0, 0.07, up - s) * (1.0 - smoothstep(0.07, 0.16, up - s));
  float glint = step(0.994, hash(floor(uv * 240.0) + floor(t * 12.0)));
  base += rim * 0.5 + glint * 0.9;
  float a = f * (0.74 + rim * 0.2);
  o = vec4(base * a, a);
}`;
const consuming = new WeakSet<Element>();

// Reduced motion: one slow colour wash that fades in and out, with no movement or flicker.
function calmWash(cover: HTMLElement, kind: string) {
  const wash = document.createElement("div");
  wash.className = "absolute inset-0 pointer-events-none";
  wash.style.background =
    kind === "fire"
      ? "radial-gradient(circle at 50% 70%, rgba(255,150,40,.55), rgba(255,90,20,.25))"
      : "radial-gradient(circle at 50% 40%, rgba(200,230,255,.6), rgba(150,200,255,.3))";
  consuming.add(cover);
  cover.appendChild(wash);
  wash
    .animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 1100, easing: "ease-in-out" })
    .finished.then(() => {
      wash.remove();
      consuming.delete(cover);
    });
}
export function consume(cover: HTMLElement, x: number, y: number) {
  const kind = cover.dataset.consume;
  if (!kind || consuming.has(cover)) return;
  if (document.documentElement.dataset.motion === "calm") return calmWash(cover, kind);
  const canvas = document.createElement("canvas");
  canvas.className = "absolute inset-0 w-full h-full pointer-events-none";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cover.clientWidth * dpr);
  canvas.height = Math.round(cover.clientHeight * dpr);
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true });
  if (!gl) return;
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, kind === "fire" ? FIRE : ICE);
  if (!vs || !fs) return;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.viewport(0, 0, canvas.width, canvas.height);
  const uT = gl.getUniformLocation(prog, "t");
  gl.uniform2f(gl.getUniformLocation(prog, "origin"), x, y);

  consuming.add(cover);
  cover.appendChild(canvas);
  const start = performance.now();
  const step = (now: number) => {
    const t = now - start;
    if (t >= (CONSUME_MS[kind] ?? 1600)) {
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      consuming.delete(cover);
      return;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uT, t / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
