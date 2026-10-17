import { calm, every, injectStyle, onOpen, rand, sleep, turn, whenVisible } from "./shared";

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
<div class="pose rise"><svg viewBox="0 0 44 60" overflow="visible"><g class="rbody">${HEAD}<g class="rback"><path d="M21 25 C14 27 10 33 11.5 40"/><path d="M11.5 40 l3.5 1.5"/><path d="M12.5 4 l-4 -2 M10.5 9.5 l-5 0 M11.5 15 l-4 2.5"/></g></g>
<g class="rl rlz"><path d="M6 58 L13 51 L22 56 L31 52 L35 58Z M13 51 L19 55"/></g>
<g class="rl rla"><path d="M17 50 L27 52 L22 58 M22 58 l-2 0 M23 52 L34 54 L31 58 M31 58 l2 0"/></g>
<g class="rl rlb"><path d="M16 48 L22 52 L17 58 M17 58 l-2 0 M24 48 L29 52 L28 58 M28 58 l2 0"/></g>
<g class="rl rlc"><path d="M16 46 L14 52 L11 58 M11 58 l-2 0 M24 46 L28 51 L31 58 M31 58 l2 0"/></g>
<g class="rstaff"><path d="M32 12 L35 58"/><path d="M32 12 C31 8.5 36 8 36 12"/></g></svg></div>
<svg class="prop p-fire" viewBox="0 0 24 24" width="24" height="24"><path d="M2 22L20 18M3 18L21 22"/><path class="fl" d="M11 18C5 15 7 9 11 4C11 10 17 11 15.5 16C14.5 18 12.5 19 11 18Z"/><path class="fl2" d="M11 17C9 15 9.5 12.5 11 10.5C12.5 12.5 13 15 11 17Z"/></svg>
<svg class="prop p-pot" viewBox="0 0 28 30" width="28" height="30"><path d="M5 17H19L17.5 25H6.5Z"/><path d="M19 18C23 18 23 23 19 23"/><path d="M9 28L11 26M14 28L14 26M19 28L17 26"/><path class="st s1" d="M9 14C7 11 11 9 9 6"/><path class="st s2" d="M13 14C11 11 15 9 13 6"/><path class="st s3" d="M17 14C15 11 19 9 17 6"/></svg>
<div class="prop p-stars"><i style="left:0;top:8px"></i><i style="left:16px;top:0;animation-delay:-.7s"></i><i style="left:30px;top:10px;animation-delay:-1.4s"></i><i style="left:44px;top:2px;animation-delay:-.3s"></i></div>
<div class="pose lie"><svg viewBox="0 0 64 42" overflow="visible">
<g class="rock"><path d="M3 40 C0.6 30 3.6 19 11 15.4 C17 12.6 24 15.6 26.4 22 C28 28 27 34 27 40"/><path d="M8.4 24 l4.4 3.2 M14.2 33.4 l4.6 -2.4 M10.4 18.6 l3 .2"/><path d="M30 40 L17 6.6 M17 6.6 C15.4 3 20.6 1.8 21.4 5.6"/></g>
<g class="dbody"><path d="M26.4 22 C25.4 28 25.8 34 27.4 39.6"/><path d="M40.4 20.4 C46 22.6 48.6 27 49.6 31.6 C51 35 52 37 52.6 38.2"/><path d="M34 38 C38 35.4 43 35.6 47 38.6 M29.6 32.6 C31 35.4 31.6 37.6 31 39.6"/>
<path d="M29.4 25.6 C34 29.4 39 30 43.6 27.6 M43.6 27.6 c1.4 -.6 2.6 .2 2.4 1.4 c-.4 1.2 -1.8 1 -2.2 0"/><path d="M30 40.6 L58 40.6 M36 40.4 l-.6 1.3 M44 40.5 l.4 1.3"/>
<path d="M52.6 38.2 L55.6 33 C57.4 31.4 59.8 33.4 58.4 35.8 L57 40.4 M56.4 33.6 l.4 2"/></g>
<g class="dh"><path d="M27 21 C26 13 31 8.6 37 10 C41.4 11.2 42.6 16 40.4 20.4"/><path d="M28 11.6 C26 8.4 23.6 9 22.6 11.2"/><path d="M41 16.4 l3.2 2.2 l-2.8 1.2"/>
<path d="M36.4 22.4 C39.4 26.6 40 31.6 36.6 36 C33.6 32.6 32.6 27.4 33.4 22.6"/>
<circle class="dot eo" cx="36.9" cy="16" r=".75"/><path class="eh" d="M35.4 15.4 h3.2 M36 17 h1.8"/><path class="ec" d="M35.6 16.4 q1.6 1.2 3.2 0"/></g></svg></div>
<div class="pose fall"><svg viewBox="0 0 44 60" overflow="visible">${HEAD}<g class="lim a1"><path d="M20 28L4 18M4 18l-3 -3"/></g><g class="lim a2"><path d="M30 26L42 14M42 14l3 -2"/></g><g class="lim g1"><path d="M16 46L6 58M6 58l-3 1"/></g><g class="lim g2"><path d="M26 46L36 56M36 56l3 0"/></g></svg></div>
<svg class="wand" viewBox="0 0 16 16" width="16" height="16"><path d="M1 15L13 3"/><path class="wspark" d="M13 0.5v5M10.5 3h5"/></svg>
<div class="bubble"></div>
<div class="prop p-zs"><b>z</b><b style="animation-delay:-1.1s">z</b><b style="animation-delay:-2.2s">z</b></div>`;

const CSS = `
.scribe{position:absolute;left:0;bottom:-1px;pointer-events:none;visibility:hidden;will-change:transform;z-index:50;transition:translate .6s ease-in-out}
.scribe svg{display:block}
.scribe svg *{fill:none;stroke:var(--color-body);stroke-width:1.2px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.scribe svg .dot{fill:var(--color-body);stroke:none}
.scribe.ending[data-scene] .prop{animation:sc-out 2.2s ease-in forwards}
.scribe.ending[data-scene] .p-fire{transform-origin:50% 100%}
@keyframes sc-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.55)}}
.scribe .pose{display:none}
.scribe .gust{position:absolute;left:-21px;pointer-events:none;opacity:0}
.scribe .gust svg{display:block}
.scribe .wand{display:none;position:absolute;left:19px;top:12px;transform-origin:0 100%}
.scribe.casting .wand{display:block;animation:sc-wand .7s ease-out forwards}
.scribe .wspark{opacity:0;animation:sc-spark .7s ease-out forwards}
.scribe{--bub:var(--color-wash)}
.dark .scribe{--bub:var(--color-body)}
.scribe .bubble{display:none;position:absolute;left:-26px;top:-21px;width:80px;height:80px;border-radius:50%;pointer-events:none;
  border:1.3px solid color-mix(in srgb,var(--color-body) 75%,transparent);
  background:radial-gradient(circle at 30% 26%,rgba(255,255,255,.4) 0 7%,transparent 22%),color-mix(in srgb,var(--bub) 9%,transparent);
  box-shadow:inset 0 0 10px color-mix(in srgb,var(--bub) 25%,transparent),0 0 12px color-mix(in srgb,var(--bub) 25%,transparent)}
.scribe.bubbled .bubble{display:block;animation:sc-bubble .45s cubic-bezier(.2,1.4,.4,1)}
.scribe .fall{width:28px}
.scribe.falling .fall{display:block}
.scribe.falling .fall svg{animation:sc-tumble 1.7s ease-in-out infinite alternate;transform-origin:50% 50%}
.scribe .lim{transform-box:view-box}
.scribe .a1{transform-origin:20px 28px;animation:sc-flail .85s ease-in-out infinite alternate}
.scribe .a2{transform-origin:30px 26px;animation:sc-flail 1.05s ease-in-out infinite alternate-reverse}
.scribe .g1{transform-origin:16px 46px;animation:sc-flail 1.2s ease-in-out infinite alternate-reverse}
.scribe .g2{transform-origin:26px 46px;animation:sc-flail .95s ease-in-out infinite alternate}
@keyframes sc-wand{0%{transform:rotate(60deg)}60%{transform:rotate(-30deg)}100%{transform:rotate(-18deg)}}
@keyframes sc-spark{0%,45%{opacity:0;transform:scale(.3)}60%{opacity:1;transform:scale(1.4)}100%{opacity:.4;transform:scale(1)}}
@keyframes sc-bubble{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes sc-tumble{from{transform:rotate(-20deg)}to{transform:rotate(18deg)}}
@keyframes sc-flail{from{transform:rotate(-26deg)}to{transform:rotate(26deg)}}
.scribe.walking .walk,.scribe.writing .sit,.scribe.resting .sit{display:block}
.scribe.rising .rise{display:block}
.scribe .rise{width:28px}
.scribe .rl,.scribe .rback{display:none}
.scribe[data-rise=a] .rback,.scribe[data-rise=b] .rback{display:block}
.scribe[data-rise=z] .rlz,.scribe[data-rise=a] .rla,.scribe[data-rise=b] .rlb,.scribe[data-rise=c] .rlc{display:block}
.scribe .rbody{transform-origin:20px 46px}
.scribe .rstaff{transform-origin:35px 58px}
.scribe .prop{position:absolute;display:none}
.scribe[data-scene=fire] .p-fire{display:block;left:42px;bottom:0;animation:sc-in 1.6s ease-out}
.scribe[data-scene=tea] .p-pot{display:block;left:42px;bottom:0;animation:sc-in 1.2s ease-out}
.scribe[data-scene=stars] .p-stars{display:block;left:6px;top:-26px;width:56px;height:20px}
.scribe[data-scene=nap] .p-zs{display:block;left:8px;top:-16px}
.scribe.resting .parch,.scribe.resting .l1,.scribe.resting .l2,.scribe.resting .quill{display:none}
.scribe.resting .sit svg{transform-origin:50% 100%;transition:transform 1.4s ease-in-out}
.scribe[data-scene=stars] .sit svg{transform:rotate(-9deg)}
.scribe .lie{width:44px}
.scribe[data-nap] .lie{display:block;position:absolute;left:-14px;bottom:0}
.scribe .lie .dbody,.scribe .lie .dh{visibility:hidden}
.scribe[data-nap=doze] .lie .dbody,.scribe[data-nap=doze] .lie .dh{visibility:visible}
.scribe.resting[data-nap=doze] .sit{display:none}
.scribe .lie .rock{transform-box:view-box;transform-origin:0 40px}
.scribe .lie .dh{transform-box:view-box;transform-origin:30px 22px}
.scribe .lie .eo,.scribe .lie .eh,.scribe .lie .ec{display:none}
.scribe[data-eye=o] .lie .eo,.scribe[data-eye=h] .lie .eh,.scribe[data-eye=c] .lie .ec{display:block}
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
  // (Once his line is gone he keeps his last position, so the fall starts from where he really was.)
  const stick = () => {
    if (anchor && (anchor.open || !blog?.open)) return;
    el.style.translate = `0 ${dyOf(anchor)}px`;
  };
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
  // If the line he's standing on goes (his entry is opened, or the whole Blog folds away while he is
  // on an entry), the floor drops out: he falls, flailing, off the bottom of the screen and stays
  // gone until the page is refreshed. In calm mode he just steps back onto the heading line.
  let gone = false;
  // A hidden cheat: poking him is a bad idea.
  el.style.pointerEvents = "auto";
  el.style.cursor = "pointer";
  el.addEventListener("click", (e) => {
    // He lives inside the Blog heading, so keep the click from toggling the section.
    e.preventDefault();
    e.stopPropagation();
    if (!gone && !calm()) void fall();
  });
  (el as HTMLElement & { anchorTo?: (a: HTMLElement | null) => void }).anchorTo = (a) => {
    anchor = a;
    stick();
  };
  // A gust of wind: line-art streaks sweep across the heading (dir 1 blows to the right, -1 to the left).
  const gust = (dir: number) => {
    // He is mirrored with scaleX when facing left, and the streaks inherit that.
    const flip = /scaleX\(-1\)/.test(el.style.transform) ? -1 : 1;
    dir = dir * flip;
    const streak = (y: number, delay: number, len: number) => {
      const g = document.createElement("div");
      g.className = "gust";
      g.style.top = `${y}px`;
      g.innerHTML = `<svg viewBox="0 0 70 16" width="${len}" height="${len * 0.23}" style="transform:scaleX(${dir})"><path d="M0 8H46C55 8 60 2 55 0C51-2 46 3 50 7"/></svg>`;
      el.appendChild(g);
      // They blow in from the upwind side and fade out before reaching the bubble, never crossing it.
      const end = dir > 0 ? -(len + 18) : 88;
      g.animate(
        [
          { opacity: 0, transform: `translateX(${end - dir * 230}px)` },
          { opacity: 0.85, transform: `translateX(${end - dir * 130}px)`, offset: 0.3 },
          { opacity: 0.85, transform: `translateX(${end - dir * 50}px)`, offset: 0.65 },
          { opacity: 0, transform: `translateX(${end}px)` },
        ],
        { duration: 1300, delay, easing: "ease-out" },
      ).finished.then(() => g.remove());
    };
    [[-8, 0, 70], [6, 90, 56], [20, 40, 80], [34, 150, 60], [48, 70, 66], [14, 230, 74]].forEach(([y, d, l]) => streak(y, d, l));
  };

  // Getting up and sitting down: the same frames either way, a seated lean, a crouch pushing on his
  // staff, a stooped half-rise, then upright, with the body and staff swinging between them. Sitting
  // down plays them backwards.
  const RISE_BODY: [number, number, number][] = [[0, 42, 9], [0.16, 40, 8.5], [0.3, 36, 7.5], [0.42, 41, 8.8], [0.6, 26, 5], [0.82, 10, 1.5], [1, 0, 0]];
  const RISE_LEGS: [number, string][] = [[0, "z"], [0.14, "a"], [0.5, "b"], [0.76, "c"]];
  // The sit, lie and walk sprites are different drawings from the rise frames, so swapping them
  // is a pop. A copy of whatever is showing stays behind (pinned by its bottom edge, since the box grows upward) and fades out while the rise sprite fades in.
  const FADE_MS = 260;
  const leaveBehind = () => {
    el.querySelectorAll<HTMLElement>(":scope > .sit:not(.ghost), :scope > .lie:not(.ghost), :scope > .walk:not(.ghost)").forEach((n) => {
      if (getComputedStyle(n).display === "none") return;
      const ghost = n.cloneNode(true) as HTMLElement;
      ghost.classList.remove("pose");
      ghost.classList.add("ghost");
      // the lying sprite's parts are shown by data attributes on the hermit, which are about to go
      const parts = n.querySelectorAll<SVGElement>("*");
      ghost.querySelectorAll<SVGElement>("*").forEach((g, i) => (g.style.visibility = getComputedStyle(parts[i]).visibility));
      ghost.style.cssText = `display:block;position:absolute;left:${n.offsetLeft}px;bottom:${el.offsetHeight - n.offsetTop - n.offsetHeight}px;margin:0;pointer-events:none`;
      el.appendChild(ghost);
      ghost.animate({ opacity: [1, 0] }, { duration: FADE_MS, easing: "ease-in-out", fill: "forwards" });
      // a timer, not `finished`: other code cancels animations and a cancelled fade would strand the copy
      setTimeout(() => ghost.remove(), FADE_MS);
    });
  };
  const startRise = (ms: number, reverse = false) => {
    leaveBehind();
    el.classList.remove("writing", "resting", "walking");
    el.classList.add("rising");
    el.querySelector(".rise")?.animate({ opacity: [0, 1] }, { duration: FADE_MS, easing: "ease-in-out" });
    const swing = (sel: string, k: number) =>
      el.querySelector(sel)?.animate(
        RISE_BODY.map(([offset, deg, dy]) => ({ offset, transform: `translate(0,${k ? 0 : dy}px) rotate(${deg * (k || 1)}deg)`, easing: "ease-in-out" })),
        { duration: ms, fill: "forwards", direction: reverse ? "reverse" : "normal" },
      );
    swing(".rbody", 0);
    swing(".rstaff", 0.56);
    // each frame switches on when playback reaches it (backwards, when sitting down)
    RISE_LEGS.forEach(([t, frame], i) => {
      const at = reverse ? 1 - (RISE_LEGS[i + 1]?.[0] ?? 1) : t;
      if (at <= 0) el.dataset.rise = frame;
      else setTimeout(() => (el.dataset.rise = frame), at * ms);
    });
  };
  const endRise = (to: string) => {
    el.classList.remove("rising");
    el.classList.add(to);
    delete el.dataset.rise;
    el.querySelectorAll(".rbody, .rstaff").forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
  };
  const standUp = async (ms = 1000) => {
    startRise(ms);
    await sleep(ms);
    if (!gone) endRise("walking");
  };
  const sitDown = async (ms = 900) => {
    startRise(ms, true);
    await sleep(ms);
    if (!gone) endRise("writing");
  };

  const fall = async () => {
    gone = true;
    leaveBehind();
    // Cancelling a walk or hop would snap him back to where it began, so pin him where he is first.
    const here = getComputedStyle(el);
    const m = new DOMMatrix(here.transform);
    const heldY = here.translate;
    el.getAnimations().forEach((a) => a.cancel());
    setX(m.m41, m.a < 0 ? -1 : 1);
    el.style.translate = heldY === "none" ? "0 0" : heldY;
    el.classList.remove("writing", "resting", "walking", "ending");
    delete el.dataset.scene;
    delete el.dataset.nap;
    el.querySelectorAll(".sit:not(.ghost) svg, .lie:not(.ghost)").forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    const startY = parseFloat(el.style.translate.split(" ")[1]) || 0;

    // One continuous path, with no jumps in speed: he gets up with a start, stumbles forward and trips,
    // tumbles, flicks a wand as he falls, and the bubble pops up and slows him to a stop. It then drifts
    // up from rest, never stopping, until a gust adds sideways speed and blows it off the screen.
    const face = m.a < 0 ? -1 : 1;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const r = el.getBoundingClientRect();
    const dist = (dir > 0 ? innerWidth - r.left : r.right) + 200;
    const hopMs = 1000; // an old hermit getting up: slowly, with a stoop, no hopping
    const stumbleMs = 800;
    const preMs = hopMs + stumbleMs;
    const slipMs = 1300;
    const brakeMs = 1900;
    const flightMs = Math.min(8000, 5600 + dist * 1.2);
    const total = preMs + slipMs + brakeMs + flightMs;
    const vA = 0.055; // px per ms when the bubble appears
    const slipPx = (vA * slipMs) / 2;
    const brakePx = (vA * brakeMs) / 2;
    const rise = 190 + 0.18 * dist;
    const gustAt = 0.4;
    const x1 = rand(-20, 20);
    const smooth = (u: number) => u * u * (3 - 2 * u);
    const at = (ms: number) => {
      if (ms <= hopMs) return { x: 0, y: 0 };
      if (ms <= preMs) return { x: face * 16 * smooth((ms - hopMs) / stumbleMs), y: 0 };
      const m = ms - preMs;
      if (m <= slipMs) return { x: face * (16 + 6 * (m / slipMs)), y: (vA * m * m) / (2 * slipMs) };
      const xs = face * 22;
      if (m <= slipMs + brakeMs) {
        const u = (m - slipMs) / brakeMs;
        return { x: xs, y: slipPx + vA * brakeMs * (u / 2 + Math.sin(Math.PI * u) / (2 * Math.PI)) };
      }
      const t = (m - slipMs - brakeMs) / flightMs;
      const w = Math.max(0, (t - gustAt) / (1 - gustAt));
      return {
        x: xs + x1 * Math.min(1, t / gustAt) + dir * dist * w * w * (3 - 1.8 * w),
        y: slipPx + brakePx - rise * Math.pow(t, 1.6),
      };
    };
    const n = Math.round(total / 50);
    const keys = Array.from({ length: n + 1 }, (_, i) => {
      const p = at((i / n) * total);
      return { translate: `${p.x}px ${startY + p.y}px`, offset: i / n };
    });
    // Leaning and tripping forward, then toppling slowly over as he falls; the bubble catches him and
    // rights him as it forms.
    const lean = (ms: number, deg: number) => ({ rotate: `${face * deg}deg`, offset: ms / total, easing: "ease-in-out" });
    startRise(hopMs);
    setTimeout(() => endRise("walking"), hopMs);
    // The poses are rotated, not the element: his sideways position is in `transform`, so rotating the
    // element would swing him round a pivot far away.
    const tilt = [
      lean(0, 0),
      lean(hopMs, 0),
      lean(hopMs + 250, -7),
      lean(hopMs + 520, 15),
      lean(preMs, 36),
      lean(preMs + slipMs * 0.45, 84),
      lean(preMs + slipMs * 0.62, 84),
      lean(preMs + slipMs, 0),
      lean(total, 0),
    ];
    el.querySelectorAll(".pose").forEach((pose) => pose.animate(tilt, { duration: total, fill: "forwards", easing: "linear" }));
    const flight = el.animate(keys, { duration: total, fill: "forwards", easing: "linear" });
    await sleep(preMs);
    el.classList.remove("walking");
    el.classList.add("falling");
    await sleep(slipMs * 0.4);
    el.classList.add("casting");
    await sleep(slipMs * 0.6);
    el.classList.add("bubbled");
    setTimeout(() => el.classList.remove("casting"), 500);
    await sleep(brakeMs + flightMs * gustAt - 250);
    gust(dir);
    await flight.finished.catch(() => undefined);
    el.getAnimations().forEach((a) => a.cancel());
    el.remove();
  };
  const lineGone = () => {
    if (gone || !anchor) return false;
    if (anchor.open || !blog?.open) return true;
    return false;
  };
  blog?.addEventListener(
    "toggle",
    () => {
      if (gone) return;
      if (lineGone()) {
        if (calm()) {
          anchor = null;
          stick();
        } else void fall();
        return;
      }
      stick();
    },
    true,
  );
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
    if (calm() || gone) return;
    const speed = rand(0.011, 0.016); // px per ms
    await standUp(1000);
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
      if (gone) return;
      // (also runs if switching to calm mid-walk cancelled the animation)
      const m = new DOMMatrix(getComputedStyle(el).transform);
      x = m.m41;
      if (calm()) {
        el.classList.remove("walking");
        el.classList.add("writing");
      } else await sitDown(900);
    }
  };

  // Idle scenes: he sits and does something else for a good while (lights a fire and warms himself,
  // brews tea, watches the stars, naps), then goes back to his notes.
  const SCENES = ["fire", "tea", "stars", "nap"];
  const scene = async () => {
    if (calm() || gone) return;
    const name = SCENES[Math.floor(Math.random() * SCENES.length)];
    setX(x, 1); // props are drawn on his right-hand side
    el.classList.remove("walking", "writing");
    el.classList.add("resting");
    const slouch = el.querySelector<SVGElement>(".sit svg");
    try {
      if (name === "nap") {
        // A boulder rises behind him, he leans back against it and, with a couple of false starts, nods
        // off: the head droops, jerks up, droops further, and his eyes go from open to half shut to closed.
        const rock = el.querySelector(".lie .rock");
        const head = el.querySelector<SVGElement>(".lie .dh");
        el.dataset.nap = "rock";
        el.dataset.eye = "o";
        await rock?.animate([{ transform: "scaleY(.02)" }, { transform: "scaleY(1)" }], { duration: 650, easing: "cubic-bezier(.2,1.3,.4,1)", fill: "forwards" }).finished.catch(() => undefined);
        await sleep(350);
        el.dataset.nap = "doze";
        await sleep(900);
        const nod = (to: number, ms: number, eye: string, ease = "ease-in-out") => {
          el.dataset.eye = eye;
          return head?.animate([{ transform: head.style.transform || "rotate(0)" }, { transform: `rotate(${to}deg)` }], { duration: ms, easing: ease, fill: "forwards" }).finished.then(() => {
            if (head) head.style.transform = `rotate(${to}deg)`;
          }).catch(() => undefined);
        };
        await nod(9, 1300, "h");
        await nod(1, 300, "o", "ease-out");
        await sleep(500);
        await nod(13, 1500, "h");
        await nod(5, 350, "o", "ease-out");
        await sleep(400);
        await nod(26, 2000, "c");
        el.dataset.scene = name;
      } else el.dataset.scene = name;
      await new Promise((res) => setTimeout(res, rand(13, 22) * 1000));
      // The fire burns down (or the tea cools) over a couple of seconds before he gets up.
      if (!gone) {
        el.classList.add("ending");
        await new Promise((res) => setTimeout(res, 2200));
      }
    } finally {
      if (gone) return;
      el.classList.remove("ending");
      const wasNap = el.dataset.nap === "doze";
      delete el.dataset.scene;
      if (wasNap) {
        // He jerks awake, blinks, and the boulder sinks away as he gets back to his notes.
        const head = el.querySelector<SVGElement>(".lie .dh");
        el.dataset.eye = "h";
        await head?.animate([{ transform: head.style.transform || "rotate(26deg)" }, { transform: "rotate(-3deg)", offset: 0.5 }, { transform: "rotate(0)" }], { duration: 900, easing: "ease-out", fill: "forwards" }).finished.catch(() => undefined);
        el.dataset.eye = "o";
        await sleep(450);
      }
      slouch?.getAnimations().forEach((a) => a.cancel());
      el.classList.remove("resting");
      el.classList.add("writing");
      if (wasNap) {
        el.dataset.nap = "rock";
        await el.querySelector(".lie .rock")?.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.02)" }], { duration: 500, easing: "ease-in", fill: "forwards" }).finished.catch(() => undefined);
      }
      delete el.dataset.nap;
      delete el.dataset.eye;
      el.querySelectorAll(".lie .rock, .lie .dh").forEach((n) => {
        n.getAnimations().forEach((a) => a.cancel());
        (n as SVGElement).style.transform = "";
      });
    }
  };
  const act = () => turn(Math.random() < 0.5 ? scene : wander);

  window.addEventListener("motionchange", () => {
    if (!calm()) return;
    const here = getComputedStyle(el).transform;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transform = here === "none" ? "" : here;
    el.classList.remove("walking", "resting", "rising");
    delete el.dataset.scene;
    delete el.dataset.nap;
    delete el.dataset.eye;
    delete el.dataset.rise;
    el.classList.add("writing");
  });

  const visible = whenVisible(el, () => {});
  every(visible, 22, 40, act, rand(10, 16));
  onOpen(summary.closest("details"), () => turn(wander));
  (el as HTMLElement & { play?: () => Promise<unknown>; scene?: () => Promise<unknown> }).play = () => turn(wander);
  (el as HTMLElement & { scene?: () => Promise<unknown> }).scene = () => turn(scene);
}
