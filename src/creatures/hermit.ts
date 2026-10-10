import { calm, every, injectStyle, onOpen, rand, turn, whenVisible } from "./shared";

// A scrawny old scribe in single-weight line art. Now and then he walks along the Blog heading's
// rule, sits to write notes on parchment, then gets up and wanders off.
const HEAD =
  '<path d="M18 13 C18 8 20 4 25 1.5 C24 6 28 9 29 13"/><path d="M28 12.5 C30 13.5 31 15 33.5 17.5 L29.6 18.4 C29.2 19.4 28.6 20.2 28 21"/><circle class="dot" cx="26.6" cy="14.6" r=".8"/><path d="M25 12.8 l3 -.6"/><path d="M28 21 C27 28 28 33 26 40 M26 21 C24 28 25 33 22 38 M30 20 C31 26 30 30 29 33"/><path d="M18 13 C13 18 12 26 14 34 C13 40 12 44 12 46"/><path d="M26 40 C27 43 28 45 28 46"/><path d="M11 46 L14 44 L17 46 L20 44 L23 46 L26 44 L29 46"/><path d="M22 26 C26 28 29 28 32 27"/>';
const WALK = (legs: string, staff: string) =>
  `<svg viewBox="0 0 44 60" overflow="visible">${HEAD}<path d="${legs}"/><path d="${staff}"/><path d="M32 12 C31 8.5 36 8 36 12"/></svg>`;
const SVG = `<div class="pose walk"><div class="wa">${WALK("M16 46 L14 52 L11 58 M11 58 l-2 0 M24 46 L28 51 L31 58 M31 58 l2 0", "M32 12 L35 58")}</div><div class="wb">${WALK("M18 46 L19 52 L17 58 M17 58 l-2 0 M23 46 L22 52 L23 58 M23 58 l2 0", "M32 12 L34 58")}</div></div>
<div class="pose sit"><svg viewBox="0 0 54 44" overflow="visible">
<path d="M16 17 C16 12 18 8 23 5.5 C22 10 26 12 27 16"/><path d="M26 15.5 C28 16.5 29 18 31.5 20.5 L27.6 21.4 C27.2 22.4 26.6 23.2 26 24"/><circle class="dot" cx="24.6" cy="17.6" r=".8"/>
<path d="M26 24 C25 29 26 32 24 36 M24 24 C22 29 23 32 20 35"/><path d="M16 17 C11 22 10 29 13 37"/>
<path d="M7 42 L13 34 L22 40 L31 36 L34 42Z"/><path d="M22 28 C26 30 30 31 34 30"/>
<path class="parch" d="M31 31 L45 27 L48 37 L34 41Z"/><path class="l1" d="M35 34 L44 31.5"/><path class="l2" d="M36 37 L45 34.5"/>
<g class="quill"><path d="M34 30 L43 20"/><path d="M43 20 C45 16 48 16 49 18 C47 20 45 21 43 20"/></g></svg></div>
<svg class="prop p-fire" viewBox="0 0 24 24" width="24" height="24"><path d="M2 22L20 18M3 18L21 22"/><path class="fl" d="M11 18C5 15 7 9 11 4C11 10 17 11 15.5 16C14.5 18 12.5 19 11 18Z"/><path class="fl2" d="M11 17C9 15 9.5 12.5 11 10.5C12.5 12.5 13 15 11 17Z"/></svg>
<svg class="prop p-pot" viewBox="0 0 28 30" width="28" height="30"><path d="M5 17H19L17.5 25H6.5Z"/><path d="M19 18C23 18 23 23 19 23"/><path d="M9 28L11 26M14 28L14 26M19 28L17 26"/><path class="st s1" d="M9 14C7 11 11 9 9 6"/><path class="st s2" d="M13 14C11 11 15 9 13 6"/><path class="st s3" d="M17 14C15 11 19 9 17 6"/></svg>
<div class="prop p-stars"><i style="left:0;top:8px"></i><i style="left:16px;top:0;animation-delay:-.7s"></i><i style="left:30px;top:10px;animation-delay:-1.4s"></i><i style="left:44px;top:2px;animation-delay:-.3s"></i></div>
<div class="prop p-zs"><b>z</b><b style="animation-delay:-1.1s">z</b><b style="animation-delay:-2.2s">z</b></div>`;

const CSS = `
.scribe{position:absolute;left:0;bottom:-1px;pointer-events:none;visibility:hidden;will-change:transform;z-index:50;transition:translate .6s ease-in-out}
.scribe svg{display:block}
.scribe svg *{fill:none;stroke:var(--color-body);stroke-width:1.2px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.scribe svg .dot{fill:var(--color-body);stroke:none}
.scribe .pose{display:none}
.scribe.walking .walk,.scribe.writing .sit,.scribe.resting .sit{display:block}
.scribe .prop{position:absolute;display:none}
.scribe[data-scene=fire] .p-fire{display:block;left:42px;bottom:0;animation:sc-in 1.6s ease-out}
.scribe[data-scene=tea] .p-pot{display:block;left:42px;bottom:0;animation:sc-in 1.2s ease-out}
.scribe[data-scene=stars] .p-stars{display:block;left:6px;top:-26px;width:56px;height:20px}
.scribe[data-scene=nap] .p-zs{display:block;left:26px;top:-6px}
.scribe.resting .parch,.scribe.resting .l1,.scribe.resting .l2,.scribe.resting .quill{display:none}
.scribe.resting .sit svg{transform-origin:50% 100%;transition:transform 1.4s ease-in-out}
.scribe[data-scene=stars] .sit svg{transform:rotate(-9deg)}
.scribe[data-scene=nap] .sit svg{transform:rotate(8deg) translateY(2px)}
.scribe[data-scene=tea] .sit svg{animation:sc-sip 5s ease-in-out infinite}
.scribe .fl,.scribe .fl2{transform-box:fill-box;transform-origin:50% 100%;animation:sc-flick .7s ease-in-out infinite alternate}
.scribe .fl2{animation-duration:.5s;animation-delay:-.2s}
.scribe .st{animation:sc-steam 2.4s ease-out infinite;opacity:0}.scribe .s2{animation-delay:-.8s}.scribe .s3{animation-delay:-1.6s}
.scribe .p-stars i{position:absolute;width:7px;height:7px;animation:sc-twinkle 2s ease-in-out infinite}
.scribe .p-stars i::before,.scribe .p-stars i::after{content:"";position:absolute;background:var(--color-body)}
.scribe .p-stars i::before{left:3px;top:0;width:1px;height:7px}.scribe .p-stars i::after{left:0;top:3px;width:7px;height:1px}
.scribe .p-zs b{position:absolute;left:0;top:0;font:700 10px/1 var(--font-sans,sans-serif);color:var(--color-body);opacity:0;animation:sc-z 3.3s ease-out infinite}
@keyframes sc-in{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
@keyframes sc-flick{from{transform:scale(1,1) skewX(-3deg)}to{transform:scale(.9,1.12) skewX(3deg)}}
@keyframes sc-steam{0%{opacity:0;transform:translateY(3px)}30%{opacity:.8}100%{opacity:0;transform:translateY(-7px)}}
@keyframes sc-twinkle{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
@keyframes sc-z{0%{opacity:0;transform:translate(0,0) scale(.7)}25%{opacity:.9}100%{opacity:0;transform:translate(14px,-20px) scale(1.3)}}
@keyframes sc-sip{0%,60%,100%{transform:rotate(0)}70%,80%{transform:rotate(-7deg)}}
.scribe .walk{width:28px}.scribe .sit{width:38px}
.scribe .wb{display:none}
.scribe.walking .wa{animation:sc-a 1.1s steps(1,end) infinite}
.scribe.walking .wb{display:block;position:absolute;left:0;top:0;width:100%;animation:sc-b 1.1s steps(1,end) infinite}
.scribe.walking .walk{position:relative}
@keyframes sc-a{0%,49.9%{opacity:1}50%,100%{opacity:0}}
@keyframes sc-b{0%,49.9%{opacity:0}50%,100%{opacity:1}}
.scribe .quill{transform-box:fill-box;transform-origin:0 100%}
.scribe.writing .quill{animation:sc-write .45s ease-in-out infinite alternate}
.scribe .l1,.scribe .l2{stroke-dasharray:11;stroke-dashoffset:11}
.scribe.writing .l1{animation:sc-line 3.2s ease-out forwards}
.scribe.writing .l2{animation:sc-line 3.2s ease-out 3.4s forwards}
@keyframes sc-write{from{transform:rotate(-3deg)}to{transform:rotate(5deg) translateY(1px)}}
@keyframes sc-line{to{stroke-dashoffset:0}}
`;

export function mountHermit(summary: HTMLElement) {
  injectStyle("creature-scribe", CSS);
  summary.style.position = "relative";
  const el = document.createElement("div");
  el.className = "scribe";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = SVG;
  summary.appendChild(el);

  // He lives on the Blog heading's rule: sitting and writing most of the time, now and then getting
  // up to walk to a new spot. He never leaves the screen. Rarely he hops to the rule under a closed
  // entry (never an open one: that's a wall of text, and he'd be a distraction).
  let anchor: HTMLElement | null = null;
  let x = 0;
  let face = 1;
  const dyOf = (a: HTMLElement | null) =>
    a ? a.getBoundingClientRect().bottom - summary.getBoundingClientRect().bottom - 1 : 0;
  // Vertical position is the CSS `translate` property, separate from the walking `transform`, and is
  // recomputed whenever the layout changes, so he stays on his line when entries open.
  const stick = () => (el.style.translate = `0 ${dyOf(anchor)}px`);
  const setX = (nx: number, f = face) => {
    x = nx;
    face = f;
    el.style.transform = `translateX(${nx}px) scaleX(${f})`;
  };
  const width = () => summary.clientWidth;
  const clampX = (v: number) => Math.min(Math.max(v, 16), Math.max(40, width() - 60));
  setX(clampX(rand(0.15, 0.85) * width()), Math.random() < 0.5 ? 1 : -1);
  el.classList.add("writing");
  el.style.visibility = "visible";
  stick();

  const blog = summary.closest("details");
  blog?.addEventListener("toggle", () => {
    if (!blog.open) anchor = null; // the entries he was on have folded away: back to the heading line
    stick();
  });
  blog?.addEventListener("toggle", stick, true);
  new ResizeObserver(stick).observe(blog ?? summary);
  addEventListener("resize", stick);

  const railsNow = () => {
    const rails: (HTMLElement | null)[] = [null, null];
    document.querySelectorAll<HTMLDetailsElement>("#blog [id^=post-]").forEach((post) => {
      const b = post.getBoundingClientRect();
      if (!post.open && parseFloat(getComputedStyle(post).borderBottomWidth) > 0 && b.bottom > 60 && b.bottom < innerHeight)
        rails.push(post);
    });
    return rails;
  };

  const slide = async (to: number, speed: number) => {
    if (Math.abs(to - x) < 2) return;
    const f = to >= x ? 1 : -1;
    const anim = el.animate(
      [{ transform: `translateX(${x}px) scaleX(${f})` }, { transform: `translateX(${to}px) scaleX(${f})` }],
      { duration: Math.abs(to - x) / speed, fill: "forwards", easing: "ease-in-out" },
    );
    await anim.finished;
    anim.cancel();
    setX(to, f);
  };

  // A hop up or down to another rule: a short arc, never straight from sitting.
  const jump = async (to: number, target: HTMLElement | null) => {
    const f = to >= x ? 1 : -1;
    const y1 = dyOf(anchor);
    const y2 = dyOf(target);
    const lift = Math.min(y1, y2) - 26;
    const at = (t: number) => `translateX(${x + (to - x) * t}px) scaleX(${f})`;
    const anim = el.animate(
      [
        { transform: at(0), translate: `0 ${y1}px`, offset: 0 },
        { transform: at(0.5), translate: `0 ${lift}px`, offset: 0.5, easing: "ease-in" },
        { transform: at(1), translate: `0 ${y2}px`, offset: 1 },
      ],
      { duration: 800, fill: "forwards", easing: "ease-out" },
    );
    await anim.finished;
    anchor = target;
    anim.cancel();
    setX(to, f);
    stick();
  };

  const wander = async () => {
    if (calm()) return;
    const speed = rand(0.011, 0.016); // px per ms
    el.classList.remove("writing");
    el.classList.add("walking");
    try {
      if (Math.random() < 0.15 && visible()) {
        const others = railsNow().filter((r) => r !== anchor);
        const next = others[Math.floor(Math.random() * others.length)];
        if (next !== undefined) {
          await slide(clampX(x + (Math.random() < 0.5 ? -1 : 1) * rand(70, 150)), speed);
          await jump(clampX(x + (Math.random() < 0.5 ? -1 : 1) * rand(90, 220)), next);
          await slide(clampX(x + (Math.random() < 0.5 ? -1 : 1) * rand(70, 150)), speed);
          return;
        }
      }
      let target = clampX(rand(0.08, 0.9) * width());
      for (let i = 0; i < 4 && Math.abs(target - x) < 90; i++) target = clampX(rand(0.08, 0.9) * width());
      await slide(target, speed);
    } finally {
      // (also runs if switching to calm mid-walk cancelled the animation)
      const m = new DOMMatrix(getComputedStyle(el).transform);
      x = m.m41;
      el.classList.remove("walking");
      el.classList.add("writing");
    }
  };

  // Idle scenes: he sits and does something else for a good while (lights a fire and warms himself,
  // brews tea, watches the stars, naps), then goes back to his notes.
  const SCENES = ["fire", "tea", "stars", "nap"];
  const scene = async () => {
    if (calm()) return;
    const name = SCENES[Math.floor(Math.random() * SCENES.length)];
    setX(x, 1); // props are drawn on his right-hand side
    el.classList.remove("walking", "writing");
    el.classList.add("resting");
    el.dataset.scene = name;
    try {
      await new Promise((res) => setTimeout(res, rand(13, 22) * 1000));
    } finally {
      delete el.dataset.scene;
      el.classList.remove("resting");
      el.classList.add("writing");
    }
  };
  const act = () => turn(Math.random() < 0.5 ? scene : wander);

  window.addEventListener("motionchange", () => {
    if (!calm()) return;
    const here = getComputedStyle(el).transform;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transform = here === "none" ? "" : here;
    el.classList.remove("walking", "resting");
    delete el.dataset.scene;
    el.classList.add("writing");
  });

  const visible = whenVisible(el, () => {});
  every(visible, 22, 40, act, rand(10, 16));
  onOpen(summary.closest("details"), () => turn(wander));
  (el as HTMLElement & { play?: () => Promise<unknown>; scene?: () => Promise<unknown> }).play = () => turn(wander);
  (el as HTMLElement & { scene?: () => Promise<unknown> }).scene = () => turn(scene);
}
