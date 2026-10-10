import { VERT } from "./gl";

// Heat shimmer: the cover art, re-drawn on the GPU with a small travelling ripple, shown only
// where the mask allows (the fire and sky), stronger towards the bottom where the heat is.
type Shimmer = { gl: WebGL2RenderingContext; t: WebGLUniformLocation | null; maskReady: boolean };
const shimmers = new Map<HTMLCanvasElement, Shimmer | null>();

const FRAG = `#version 300 es
precision mediump float;
in vec2 uv; out vec4 o;
uniform sampler2D art, msk; uniform float t;
void main() {
  float m = texture(msk, uv).a;
  float amp = 0.0042 * m * (0.35 + 0.65 * uv.y);
  float a = sin(uv.y * 70.0 - t * 2.2 + sin(uv.x * 11.0 + t * 0.7) * 2.2);
  float b = sin(uv.y * 37.0 - t * 1.3 + uv.x * 9.0);
  vec3 c = texture(art, uv + vec2(a * 0.7 + b * 0.5, b * 0.25) * amp).rgb;
  o = vec4(c * m, m);
}`;
function initShimmer(canvas: HTMLCanvasElement, art: HTMLImageElement): Shimmer | null {
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const texture = (unit: number, source: TexImageSource, mip: boolean) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  texture(0, art, true);
  gl.uniform1i(gl.getUniformLocation(prog, "art"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "msk"), 1);

  const state: Shimmer = { gl, t: gl.getUniformLocation(prog, "t"), maskReady: false };
  const mask = new Image();
  mask.onload = () => {
    texture(1, mask, false);
    state.maskReady = true;
  };
  mask.src = canvas.dataset.mask ?? "";

  new ResizeObserver(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }).observe(canvas);
  return state;
}

export function drawShimmer(canvas: HTMLCanvasElement, cover: Element, t: number) {
  if (!shimmers.has(canvas)) {
    const art = cover.querySelector<HTMLImageElement>("img.cover-art");
    shimmers.set(canvas, art ? initShimmer(canvas, art) : null);
  }
  const s = shimmers.get(canvas);
  if (!s?.maskReady) return;
  s.gl.clearColor(0, 0, 0, 0);
  s.gl.clear(s.gl.COLOR_BUFFER_BIT);
  s.gl.uniform1f(s.t, t / 1000);
  s.gl.drawArrays(s.gl.TRIANGLE_STRIP, 0, 4);
}
