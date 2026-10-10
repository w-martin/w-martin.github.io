import { calm, every, injectStyle, onOpen, rand, turn, whenVisible } from "./shared";

// A small Celtic-style wyvern that glides in, lands on the top edge of the player box, idles, and
// flies off. The flap is three wing poses cycled with CSS; the flight is a few Bezier legs.
// Wing outlines for the three flap poses; the shoulder is at (66,36).
const WING = {
  up: "M66 36 C66 26 60 15 50 7 L38 11 Q41 16 34 21 Q37 27 40 31 Q46 35 50 39 Q58 39 66 36 M50 7 L34 21 M50 7 L40 31",
  mid: "M66 36 C58 31 44 27 28 26 L16 24 Q20 29 14 34 Q18 38 22 42 Q34 42 46 41 Q58 41 66 36 M28 26 L14 34 M28 26 L22 42",
  down: "M66 36 C66 46 62 56 52 62 L40 59 Q44 55 36 49 Q40 45 42 41 Q52 41 58 40 Q62 39 66 36 M52 62 L36 49 M52 62 L42 41",
};
// Poses in time order; the CSS delay index runs backwards through the cycle.
const FLAP = ["up", "mid", "down", "mid"] as const;
const frames = FLAP.map(
  (pose, step) =>
    `<g class="wf${step === 1 ? " pm" : ""}" style="--i:${(4 - step) % 4}"><path d="${WING[pose]}"/></g>`,
).join("");

// Single-weight line art: a bat-winged dragon with a long neck, horns, a spined back and a Celtic
// spiral at the tail tip.
const FLY = `<svg class="fly" viewBox="0 0 104 66" overflow="visible">
<path d="M80 24 C83 21 88 20 92 22 L98 25 L93 27 C90 28 86 28 83 27 M83 27 C86 30 91 30 94 28 M82 21 C80 17 76 15 72 16 M85 20 C85 15 82 12 79 11 M87 23.5 l2.2 -.6"/>
<path d="M80 24 C76 28 74 33 68 36 M83 27 C81 34 79 40 74 44 M77 26 l-2 -2 M74 29 l-2.4 -1.6 M71 32 l-2.6 -1.2"/>
<path d="M68 36 C60 34 52 34 44 37 M74 44 C66 49 52 49 44 44 M68 47 L65 54 L70 55 M50 48 L47 55 L52 56"/>
<path d="M44 37 C36 38 28 42 22 47 C18 51 12 51 9 49 C6 47 5 51 8 52 C11 53 11 49 9 49 M44 44 C38 47 32 51 26 54 C21 57 16 58 12 56"/>
<path d="M53 41 c-3 0 -4 3 -2 4.4 c2.4 1.4 5 -1 3.4 -3.4"/>${frames}</svg>`;

const PERCH = `<svg class="perch" viewBox="0 0 62 84" overflow="visible">
<g class="phead"><path d="M7 18 L13 14 C17 11 23 11 27 14 C30 17 29 22 25 24 L15 23 C12 22 9 20 7 18Z M13 22 C16 25 21 25 24 23 M24 12 C27 7 32 6 36 8 M27 14 C32 11 36 12 38 15"/><circle class="dot" cx="16" cy="17.5" r=".9"/></g>
<path d="M24 24 C24 31 28 35 31 39 M29 22 C33 28 35 33 37 39 M37 39 C45 43 49 53 47 65 M31 39 C25 45 25 55 29 65 M39 55 c-3 0 -4 3 -2 4.4 c2.4 1.4 5 -1 3.4 -3.4"/>
<path class="pwing" d="M42 41 C52 39 58 47 58 59 L52 55 L50 61 L46 55 L44 59Z"/>
<path class="ptail" d="M47 65 C55 65 59 71 56 76 C53 80 47 78 49 74 C50 72 53 73 53 75"/>
<path d="M24 71 l8 0 M24 71 l-2 3 M28 71 l0 3 M32 71 l-1 3 M42 71 l8 0 M42 71 l-2 3 M46 71 l0 3 M50 71 l-1 3"/></svg>`;

const CSS = `
main{overflow-x:clip}
.wyv{position:absolute;left:0;top:0;width:60px;height:39px;pointer-events:none;visibility:hidden;will-change:transform}
.wyv svg{position:absolute;display:block}
.wyv svg *{fill:none;stroke:var(--color-body);stroke-width:1.3px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.wyv svg .dot{fill:var(--color-body);stroke:none}
.wyv .fly{left:0;top:0;width:60px}.wyv .perch{left:13px;top:-2px;width:34px;display:none}
.wyv.perched .fly{display:none}.wyv.perched .perch{display:block}
.wyv .wf{opacity:0}
.wyv.glide .wf.pm{opacity:1}
.wyv.flap .wf{animation:wv-show .8s steps(1,end) infinite;animation-delay:calc(var(--i) * -.2s)}
.wyv .ptail{transform-box:fill-box;transform-origin:0 0}
.wyv.perched .ptail{animation:wv-tail 2.4s ease-in-out infinite alternate}
.wyv .phead{transform-box:view-box;transform-origin:24px 26px}
.wyv .pwing{transform-box:view-box;transform-origin:44px 42px}
.wyv.perched .phead{animation:wv-preen 8s ease-in-out infinite;animation-delay:var(--pd,0s)}
.wyv.perched .pwing{animation:wv-wing 8s ease-in-out infinite;animation-delay:var(--pd,0s)}
.wyv.perched .perch{animation:wv-breathe 3s ease-in-out infinite;transform-origin:50% 100%}
@keyframes wv-show{0%,24.9%{opacity:1}25%,100%{opacity:0}}
/* Preening: the head dips down to the folded wing, nibbles along it, and comes back up while the
   wing lifts to meet it; then a long still pause before the next one. */
@keyframes wv-preen{
  0%,22%{transform:rotate(0)}
  30%{transform:rotate(-34deg) translate(2px,3px)}
  35%{transform:rotate(-26deg) translate(2px,3px)}
  40%{transform:rotate(-36deg) translate(3px,4px)}
  45%{transform:rotate(-27deg) translate(2px,3px)}
  50%{transform:rotate(-37deg) translate(3px,4px)}
  56%{transform:rotate(6deg)}
  62%{transform:rotate(-3deg)}
  70%,100%{transform:rotate(0)}
}
@keyframes wv-wing{
  0%,24%{transform:rotate(0)}
  32%,50%{transform:rotate(-14deg) translate(-1px,-2px)}
  58%{transform:rotate(4deg)}
  66%,100%{transform:rotate(0)}
}
@keyframes wv-tail{from{transform:rotate(-7deg)}to{transform:rotate(8deg)}}
@keyframes wv-breathe{50%{transform:scaleY(1.025)}}
`;

type P = [number, number];
const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t;
  return [
    u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0],
    u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1],
  ];
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));


export function mountWyvern(box: HTMLElement) {
  injectStyle("creature-wyvern", CSS);
  if (getComputedStyle(box).position === "static") box.style.position = "relative";
  const el = document.createElement("div");
  el.className = "wyv perched";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = FLY + PERCH;
  box.appendChild(el);

  // It lives on the page: perched somewhere, and every so often flying to another perch. It never
  // leaves the screen. A perch is the player box's top edge, a cover's top edge, a "Listen on" button
  // or the Music heading's rule, whichever are on screen.
  const pickPerch = (r: DOMRect, start = false) => {
    // The player box's top edge is the favourite perch. (The dragon lives on the Music section, since
    // loading a song replaces the player's contents.)
    const pr = document.getElementById("bandcamp-player")?.getBoundingClientRect();
    // On a phone the covers stack and the player box is a long way down, so it's a less likely perch.
    const narrow = innerWidth < 640;
    const spots = pr ? [{ left: pr.left - r.left, width: pr.width * 0.45, top: pr.top - r.top, weight: narrow ? 1 : 3 }] : [];
    if (!spots.length) spots.push({ left: 0, width: r.width * 0.45, top: 0, weight: 3 });
    const onScreen = (b: DOMRect) => b.top > 60 && b.bottom < innerHeight;
    const add = (b: DOMRect, top: number, weight: number, from = 0, to = 1) =>
      onScreen(b) && spots.push({ left: b.left - r.left + b.width * from, width: b.width * (to - from), top, weight });
    document.querySelectorAll<HTMLElement>("[data-cover]").forEach((c) => {
      const b = c.getBoundingClientRect();
      add(b, b.top - r.top, 1);
    });
    document.querySelectorAll<HTMLElement>("#music a.inline-block").forEach((a) => {
      const b = a.getBoundingClientRect();
      add(b, b.top - r.top, 1);
    });
    const rule = document.querySelector<HTMLElement>("#music > summary")?.getBoundingClientRect();
    if (rule) add(rule, rule.bottom - r.top, narrow ? 5 : 2, 0.25, 0.95);
    // At the start it settles on the Music heading's rule, at the top of its section.
    if (start && rule) return { px: (rule.left - r.left) + rule.width * rand(0.3, 0.8) - 30, py: rule.bottom - r.top - 37 };
    let roll = Math.random() * spots.reduce((n, sp) => n + sp.weight, 0);
    const spot = spots.find((sp) => (roll -= sp.weight) < 0) ?? spots[0];
    return { px: spot.left + rand(0.1, 0.85) * spot.width - 30, py: spot.top - 37 };
  };

  let cx = 0;
  let cy = 0;
  const place = (x: number, y: number, dir: number) => {
    cx = x;
    cy = y;
    el.style.transform = `translate(${x}px,${y}px) scaleX(${dir === 1 ? -1 : 1})`;
  };
  const first = pickPerch(box.getBoundingClientRect(), true);
  place(first.px, first.py, Math.random() < 0.5 ? 1 : -1);
  el.style.visibility = "visible";

  /** One flight leg along a Bezier path; the sprite faces its direction of travel. */
  const leg = async (path: [P, P, P, P], ms: number, flare: boolean) => {
    const dir = path[3][0] >= path[0][0] ? 1 : -1;
    const keys = Array.from({ length: 28 }, (_, i) => {
      const t = i / 27;
      const e = t * t * (3 - 2 * t);
      const [x, y] = bez(...path, e);
      const [x2, y2] = bez(...path, Math.min(1, e + 0.02));
      let tilt = clamp((Math.atan2(y2 - y, Math.abs(x2 - x) + 0.01) * 180) / Math.PI, -26, 26);
      if (flare && e > 0.84) tilt = tilt + (-34 - tilt) * ((e - 0.84) / 0.16);
      return { transform: `translate(${x}px,${y}px) scaleX(${dir}) rotate(${tilt}deg)`, offset: t };
    });
    const anim = el.animate(keys, { duration: ms, fill: "forwards" });
    await anim.finished;
    anim.cancel();
    place(path[3][0], path[3][1], dir);
  };

  const fly = async () => {
    if (calm()) return;
    const r = box.getBoundingClientRect();
    let next = pickPerch(r);
    for (let tries = 0; tries < 4 && Math.hypot(next.px - cx, next.py - cy) < 90; tries++) next = pickPerch(r);
    const dist = Math.hypot(next.px - cx, next.py - cy);
    if (dist < 90) return;
    // Going down, it glides on spread wings; any other way it flaps.
    const down = next.py - cy > 40;
    const side = (next.px - cx) * 0.22;
    el.classList.remove("perched");
    el.classList.add(down ? "glide" : "flap");
    try {
      await leg(
        [
          [cx, cy],
          [cx + side, cy - (down ? rand(0, 14) : rand(60, 130))],
          [next.px - side, next.py - (down ? rand(36, 80) : rand(50, 120))],
          [next.px, next.py],
        ],
        Math.min(4200, Math.max(2200, dist / 0.1)),
        true,
      );
    } finally {
      // (also runs if switching to calm mid-flight cancelled the animation)
      const m = new DOMMatrix(getComputedStyle(el).transform);
      cx = m.m41;
      cy = m.m42;
      el.classList.remove("flap", "glide");
      el.classList.add("perched");
    }
  };

  window.addEventListener("motionchange", () => {
    if (!calm()) return;
    // Stop wherever it is; it settles there until full motion comes back.
    const here = getComputedStyle(el).transform;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transform = here === "none" ? "" : here;
  });

  const visible = whenVisible(box, () => {});
  every(visible, 14, 26, () => turn(fly), rand(7, 11));
  onOpen(box.closest("details"), () => turn(fly));
  (el as HTMLElement & { play?: () => Promise<unknown> }).play = () => turn(fly);
}
