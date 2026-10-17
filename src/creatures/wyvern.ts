import { calm, every, injectStyle, onOpen, rand, sleep, turn, whenVisible } from "./shared";

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
<path d="M80 24 C83 21 88 20 92 22 L98 25 L93 27 C90 28 86 28 83 27 M83 27 C86 30 91 30 94 28 M87 23.5 l2.2 -.6"/>
<g transform="translate(98 11.5) scale(-.82 .82) translate(-7 0)"><path d="M19.5 12 C20 7 25 3.5 32 4 C28.5 6 26.5 8.6 25.5 12.6Z"/><path d="M25.8 13.2 C27.5 10 31.8 8.8 36.5 10 C32.8 11.2 30.5 13 29.4 15.6Z"/></g>
<path d="M80 24 C76 28 74 33 68 36 M83 27 C81 34 79 40 74 44 M77 26 l-2 -2 M74 29 l-2.4 -1.6 M71 32 l-2.6 -1.2"/>
<path d="M68 36 C60 34 52 34 44 37 M74 44 C66 49 52 49 44 44 M68 47 L65 54 L70 55 M50 48 L47 55 L52 56"/>
<path d="M44 37 C36 38 28 42 22 47 C18 51 12 51 9 49 C6 47 5 51 8 52 C11 53 11 49 9 49 M44 44 C38 47 32 51 26 54 C21 57 16 58 12 56"/>
<path d="M53 41 c-3 0 -4 3 -2 4.4 c2.4 1.4 5 -1 3.4 -3.4"/>${frames}</svg>`;

const PERCH = `<svg class="perch" viewBox="-31 0 124 84" overflow="visible">
<g class="phead"><g transform="translate(24 26) scale(.88) translate(-24 -26)"><path d="M7 18 L13 14 C17 11 23 11 27 14 C30 17 29 22 25 24 L15 23 C12 22 9 20 7 18Z M13 22 C16 25 21 25 24 23 "/><path d="M19.5 12 C20 7 25 3.5 32 4 C28.5 6 26.5 8.6 25.5 12.6Z"/><path d="M25.8 13.2 C27.5 10 31.8 8.8 36.5 10 C32.8 11.2 30.5 13 29.4 15.6Z"/><circle class="dot" cx="16" cy="17.5" r=".9"/></g></g>
<path d="M24.5 24 C24 31 28 36 31 41 M29 21.8 C34 27 38 32 41 39 M41 39 C47 40 52 43 55 49 C57.4 54 57.4 60 55 66 M31 41 C30 46 30.6 52 32.6 58 C34 62.4 36.4 68 38.4 73"/>
<path d="M34.5 28.6 l2.4 -3 M38.4 33.6 l3.2 -2.4"/>
<path d="M43.4 60 C47.6 57.6 53 60.6 53 66.4 C53 69.6 52 71.8 50.4 73 M42 73 L52 73 M29 73 L40 73 M42 73 l-2 2.4 M46 73 l0 2.6 M50 73 l1 2.4 M29 73 l-2 2.4 M33 73 l0 2.6 M37 73 l1 2.4 M46.6 63.6 c-2.4 0 -3.2 2.4 -1.6 3.6 c2 1.1 4 -.8 2.8 -2.8"/>
<path class="pwing" d="M44 42 L54 19 L51.8 14.4 M54 19 C65 19.5 77 29 82 47 L76.4 44 L75 52.4 L69.4 47 L66.6 54.6 L61 48.6 M54 19 L76.4 44 M54 19 L69.4 47"/>
<path class="ptail" d="M55 66 C63 68 68 64 73 60 C78 56 84 57 90 54 M52 73 C60 74 68 72 74 66.6 C79 62.4 85 61.4 91 56.4 M90 54 C92 51.4 96 52.4 95.4 55.6 C94.8 58 91.6 57.4 92 55.4"/></svg>`;

// Curled up asleep, in the manner of Smaug on his hoard: a spined hump, the wing folded on its flank,
// the tail wrapped round the front and the horned head laid down on it with one eye shut.
const SLEEP = `<svg class="sleepd" viewBox="0 0 80 46" overflow="visible">
<path d="M24 41 C22 32 28 22 38 19 C46 16.5 58 16 66 22 C72 27 73 35 70 42"/>
<path d="M34.5 20.4 L37.3 15.0 L40.3 18.4 L44.2 13.5 L46.4 17.4 L51.1 13.2 L52.5 17.4 L57.9 14.1 L58.6 18.4 L64.6 16.5 L64.2 20.9 L70.4 20.9 L68.7 25.0 L73.2 27.9 L71.2 30.5 L74.3 34.9 L71.5 36.6"/>
<path d="M35 27 L47 19.5 M47 19.5 L63 28.5 M47 19.5 L59 34 M47 19.5 L49 36 M63 28.5 Q60 30.5 59 34 Q54 33 49 36"/>
<g class="stail"><path d="M70 36.6 C62 39.8 48 39 34 39.2 C27 39.3 20 38 15 38.8"/>
<path d="M70.4 41.8 C60 42 46 41.9 34 41.9 C25 41.9 17 42 11.5 41.7 C7 41.4 5.2 38.6 7.4 36.6 C9.2 35 12.2 36.4 11.2 38.6"/>
</g>
<path d="M58 41.6 C59.4 37.6 64.4 37.6 65.8 41.6 M59.4 42 l-.8 1.8 M62 42 l0 1.9 M64.4 42 l.8 1.8"/>
<g class="shead"><path d="M3 36 L10.5 29.4 C15.5 25.6 23 25.4 28 28.4 C31.2 30.4 31 35.6 27.6 38 L9 38 C6 38 4 37.4 3 36Z"/>
<path d="M12.8 30.4 L19.6 29 M13.6 32.6 q2.6 1.8 5.4 -.2"/><circle class="dot" cx="5.6" cy="34" r=".7"/>
<path d="M22.6 27.6 C23.8 23 29.4 20.6 35 21.4 C31.4 23.2 29.6 25.4 28.8 28.4Z"/>
<path d="M29 28.6 C30.4 25.6 34 24.4 37.6 25.4 C34.6 26.6 33 28.4 32.2 30.6Z"/></g></svg>`;

const CSS = `
.wyv{position:absolute;left:0;top:0;width:60px;height:39px;pointer-events:none;visibility:hidden;will-change:transform;z-index:50}
.wyv svg{position:absolute;display:block}
.wyv svg *{fill:none;stroke:var(--color-body);stroke-width:1.3px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.wyv svg .dot{fill:var(--color-body);stroke:none}
.wyv .fly{left:0;top:0;width:60px}.wyv .perch{left:-4px;top:-2px;width:68px;display:none}
.wyv.perched .fly{display:none}.wyv.perched .perch{display:block}
.wyv .sleepd{left:2px;top:9px;width:56px;display:none;transform-origin:50% 100%}
.wyv .stail{transform-box:view-box;transform-origin:70px 40px}.wyv .shead{transform-box:view-box;transform-origin:28px 36px}
.wyv.sleeping .perch{display:none!important}
.wyv.sleeping .sleepd{display:block;animation:wv-sleepb 4.2s ease-in-out infinite}
@keyframes wv-sleepb{50%{transform:scaleY(1.035)}}
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
  el.innerHTML = FLY + PERCH + SLEEP;
  // It lives in the section's heading, which stays visible when the section is collapsed.
  const head = box.querySelector<HTMLElement>(":scope > summary") ?? box;
  if (getComputedStyle(head).position === "static") head.style.position = "relative";
  head.appendChild(el);
  const details = box as HTMLDetailsElement;

  // It lives on the page: perched somewhere, and every so often flying to another perch. It never
  // leaves the screen. A perch is the player box's top edge, a cover's top edge, a "Listen on" button
  // or the Music heading's rule, whichever are on screen.
  const pickPerch = (r: DOMRect, start = false) => {
    // Collapsed: the only place left is the heading's own rule.
    if (!details.open) {
      const hb = head.getBoundingClientRect();
      return { px: hb.width * rand(0.3, 0.8) - 30, py: hb.height - 37 };
    }
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
      // the cover's frame line floats about 5px above its top edge; that's where it sits
      add(b, b.top - r.top - 7, 1);
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
  const leg = async (path: [P, P, P, P], ms: number, flare: boolean, launch = false) => {
    const dir = path[3][0] >= path[0][0] ? 1 : -1;
    const keys = Array.from({ length: 28 }, (_, i) => {
      const t = i / 27;
      const e = t * t * (3 - 2 * t);
      const [x, y] = bez(...path, e);
      const [x2, y2] = bez(...path, Math.min(1, e + 0.02));
      let tilt = clamp((Math.atan2(y2 - y, Math.abs(x2 - x) + 0.01) * 180) / Math.PI, -26, 26);
      if (flare && e > 0.8) tilt = tilt + (-52 - tilt) * ((e - 0.8) / 0.2) ** 1.5;
      if (launch && t < 0.14) tilt = tilt + (-55 - tilt) * (1 - t / 0.14) ** 2;
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
    // crouch, spring up on raised wings, and only then swap to the flying sprite (nose-up, levelling out)
    const [b, h, w, t] = [".perch", ".phead", ".pwing", ".ptail"].map((c) => el.querySelector<SVGElement>(c)!);
    const pose = (n: SVGElement, to: string, ms: number, easing: string) => hold(n.animate([{}, { transform: to }], { duration: ms, easing, fill: "forwards" }));
    const reset = () => [b, h, w, t, el].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
    if (el.classList.contains("perched")) {
      await Promise.all([pose(b, "scale(1.05,.84)", 280, "ease-in"), pose(h, "rotate(-12deg) translate(0,3px)", 280, "ease-in"), pose(w, "rotate(-26deg) scale(1.25,1.2) translate(-2px,-3px)", 280, "ease-in"), pose(t, "rotate(8deg)", 280, "ease-in")]);
      await Promise.all([pose(b, "scale(.95,1.1)", 170, "ease-out"), pose(h, "rotate(8deg) translate(0,-2px)", 170, "ease-out"), pose(w, "rotate(-44deg) scale(1.45,1.35) translate(-3px,-6px)", 170, "ease-out"), hold(el.animate([{ translate: "0 0" }, { translate: "0 -9px" }], { duration: 170, easing: "ease-out", fill: "forwards" }))]);
    }
    reset();
    el.classList.remove("perched", "sleeping");
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
        true,
      );
    } finally {
      // (also runs if switching to calm mid-flight cancelled the animation)
      const m = new DOMMatrix(getComputedStyle(el).transform);
      cx = m.m41;
      cy = m.m42;
      el.classList.remove("flap", "glide");
      el.classList.add("perched");
      // touchdown: wings still spread, body squashed, head up; then it settles and folds them
      if (!calm()) {
        await Promise.all([
          hold(b.animate([{ transform: "scale(1.06,.86)" }, { transform: "scale(.99,1.03)", offset: 0.6 }, { transform: "none" }], { duration: 520, easing: "ease-out" })),
          hold(w.animate([{ transform: "rotate(-40deg) scale(1.4,1.3) translate(-3px,-5px)" }, { transform: "rotate(-22deg) scale(1.22,1.15) translate(-2px,-3px)", offset: 0.45 }, { transform: "rotate(3deg)", offset: 0.8 }, { transform: "none" }], { duration: 900, easing: "ease-in-out" })),
          hold(h.animate([{ transform: "rotate(10deg) translate(0,-3px)" }, { transform: "rotate(-4deg)", offset: 0.6 }, { transform: "none" }], { duration: 800, easing: "ease-out" })),
          hold(t.animate([{ transform: "rotate(-16deg)" }, { transform: "none" }], { duration: 700, easing: "ease-out" })),
        ]);
      }
    }
  };

  // Idle scenes while perched: curls up and sleeps, stretches its wings, yawns, or watches the wisp.
  const part = (cls: string) => el.querySelector<SVGElement>(`.perch ${cls}`)!;
  const puff = (dx: number, dy: number, big = 1) => {
    const o = document.createElement("span");
    o.style.cssText = `position:absolute;left:${dx}px;top:${dy}px;width:${6 * big}px;height:${6 * big}px;border:1px solid var(--color-body);border-radius:50%;pointer-events:none`;
    el.appendChild(o);
    o.animate(
      [
        { opacity: 0.8, transform: "translate(0,0) scale(.6)" },
        { opacity: 0, transform: `translate(${rand(-3, 6)}px,${-rand(14, 26)}px) scale(${1.8 * big})` },
      ],
      { duration: rand(1600, 2400), easing: "ease-out" },
    ).finished.then(() => o.remove());
  };
  const hold = (a: Animation) => a.finished.catch(() => undefined);
  const SCENES = ["sleep", "stretch", "yawn", "watch"] as const;
  const scene = async () => {
    if (calm() || el.classList.contains("flap") || el.classList.contains("glide")) return;
    const name = SCENES[Math.floor(Math.random() * SCENES.length)];
    const head = part(".phead");
    const wing = part(".pwing");
    // the perched sprite faces left by default; scaleX(-1) on the wrapper flips it
    if (name === "sleep") {
      // Hunkers down, curls into its coil and sleeps for a good while with slow breathing and the odd
      // puff of smoke from the nostril, then stretches back up.
      const body = el.querySelector<SVGElement>(".perch")!;
      const coil = el.querySelector<SVGElement>(".sleepd")!;
      const sh = coil.querySelector<SVGElement>(".shead")!;
      const st = coil.querySelector<SVGElement>(".stail")!;
      const go = (n: Element, keys: Keyframe[], ms: number, easing = "ease-in-out") => hold(n.animate(keys, { duration: ms, easing, fill: "forwards" }));
      // coil still half-risen: head lifted, tail trailing out, back a little taller
      const risen = [{ transform: "rotate(-26deg) translate(0,-3px)" }, { transform: "none" }];
      const trail = [{ transform: "rotate(-18deg) scaleX(.9)" }, { transform: "none" }];
      try {
        // 1 crouch: weight settles, wing tucks, head lowers
        await Promise.all([
          go(body, [{ transform: "none" }, { transform: "scale(1.04,.88)" }], 420),
          go(head, [{ transform: "rotate(0)" }, { transform: "rotate(-24deg) translate(1px,4px)" }], 420),
          go(part(".pwing"), [{ transform: "rotate(0)" }, { transform: "rotate(5deg)" }], 420),
        ]);
        // 2 lies down: body flattens, head almost on the ground
        await Promise.all([
          go(body, [{ transform: "scale(1.04,.88)" }, { transform: "scale(1.08,.72)" }], 450),
          go(head, [{ transform: "rotate(-24deg) translate(1px,4px)" }, { transform: "rotate(-48deg) translate(3px,9px)" }], 450),
        ]);
        // 3 the coil: swap to the lying sprite, then head and tail settle into it
        el.classList.add("sleeping");
        body.getAnimations().forEach((a) => a.cancel());
        head.getAnimations().forEach((a) => a.cancel());
        part(".pwing").getAnimations().forEach((a) => a.cancel());
        await Promise.all([
          go(coil, [{ transform: "scale(1,1.12)" }, { transform: "none" }], 700, "ease-out"),
          go(sh, risen, 700, "ease-out"),
          go(st, trail, 800, "ease-out"),
        ]);
        for (let i = 1; i <= 4; i++) setTimeout(() => el.classList.contains("sleeping") && puff(3, 26), i * 3000);
        await sleep(13000);
      } finally {
        if (el.classList.contains("sleeping")) {
          // wakes: head lifts, tail slides out, then it rises onto its feet
          await Promise.all([go(sh, [...risen].reverse(), 500), go(st, [...trail].reverse(), 500), go(coil, [{ transform: "none" }, { transform: "scale(1,1.1)" }], 500)]);
          el.classList.remove("sleeping");
          [sh, st, coil].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
          await Promise.all([
            go(body, [{ transform: "scale(1.08,.72)" }, { transform: "scale(1.04,.88)", offset: 0.5 }, { transform: "none" }], 700, "ease-out"),
            go(head, [{ transform: "rotate(-48deg) translate(3px,9px)" }, { transform: "rotate(-20deg) translate(1px,4px)", offset: 0.45 }, { transform: "rotate(8deg)", offset: 0.8 }, { transform: "rotate(0)" }], 700, "ease-out"),
          ]);
          [body, head].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));
        }
        sh.getAnimations().forEach((a) => a.cancel());
      }
    } else if (name === "stretch") {
      const spread = wing.animate([{ transform: "rotate(0) scale(1)" }, { transform: "rotate(-30deg) scale(1.3,1.25) translate(-2px,-4px)", offset: 0.35 }, { transform: "rotate(-30deg) scale(1.3,1.25) translate(-2px,-4px)", offset: 0.7 }, { transform: "rotate(6deg) scale(1)", offset: 0.85 }, { transform: "rotate(0) scale(1)" }], { duration: 4200, easing: "ease-in-out" });
      const lift = head.animate([{ transform: "rotate(0)" }, { transform: "rotate(12deg) translate(0,-2px)", offset: 0.35 }, { transform: "rotate(12deg) translate(0,-2px)", offset: 0.7 }, { transform: "rotate(0)" }], { duration: 4200, easing: "ease-in-out" });
      await Promise.all([hold(spread), hold(lift)]);
    } else if (name === "yawn") {
      const gape = head.animate([{ transform: "rotate(0) scale(1)" }, { transform: "rotate(16deg) scale(1.12) translate(0,-2px)", offset: 0.3 }, { transform: "rotate(16deg) scale(1.12) translate(0,-2px)", offset: 0.65 }, { transform: "rotate(0) scale(1)" }], { duration: 3200, easing: "ease-in-out" });
      setTimeout(() => puff(6, 6, 1.4), 1000);
      setTimeout(() => puff(4, 4, 1.1), 1500);
      await hold(gape);
      await head.animate([{ transform: "rotate(0)" }, { transform: "rotate(-5deg)", offset: 0.4 }, { transform: "rotate(0)" }], { duration: 700 }).finished.catch(() => undefined);
    } else {
      // watch: turns its head toward the wisp for a few seconds
      const w = document.querySelector<HTMLElement>(".wisp .core")?.getBoundingClientRect();
      const me = el.getBoundingClientRect();
      const toward = w ? Math.sign(w.left - me.left) : 1;
      const faceDir = el.style.transform.includes("scaleX(-1)") ? 1 : -1; // which way the sprite looks
      const ang = toward === faceDir ? -10 : 18;
      const look = head.animate([{ transform: "rotate(0)" }, { transform: `rotate(${ang}deg)`, offset: 0.2 }, { transform: `rotate(${ang * 0.4}deg)`, offset: 0.5 }, { transform: `rotate(${ang}deg)`, offset: 0.75 }, { transform: "rotate(0)" }], { duration: 6500, easing: "ease-in-out" });
      await hold(look);
    }
    await sleep(600);
  };
  // Poke it: it rears up with a hop, flares its wings and snorts out puffs of smoke. (It sits inside
  // the section heading, so the click must not toggle the section.)
  const react = async () => {
    if (calm() || !el.classList.contains("perched")) return;
    // a poke wakes it, and it is not pleased
    el.classList.remove("sleeping");
    const head = part(".phead");
    const wing = part(".pwing");
    const hop = el.animate([{ translate: "0 0" }, { translate: "0 -14px", offset: 0.35 }, { translate: "0 0" }], { duration: 650, easing: "ease-out" });
    const flare = wing.animate(
      [{ transform: "rotate(0) scale(1)" }, { transform: "rotate(-30deg) scale(1.3,1.25) translate(-2px,-4px)", offset: 0.3 }, { transform: "rotate(-30deg) scale(1.3,1.25) translate(-2px,-4px)", offset: 0.7 }, { transform: "rotate(0) scale(1)" }],
      { duration: 1700, easing: "ease-in-out" },
    );
    const roar = head.animate([{ transform: "rotate(0)" }, { transform: "rotate(18deg) translate(0,-2px)", offset: 0.25 }, { transform: "rotate(18deg) translate(0,-2px)", offset: 0.65 }, { transform: "rotate(0)" }], { duration: 1700, easing: "ease-in-out" });
    for (let i = 0; i < 5; i++) setTimeout(() => puff(4 + i, 4 + (i % 2) * 3, 1.1), 300 + i * 160);
    await Promise.all([hold(hop), hold(flare), hold(roar)]);
  };
  el.style.pointerEvents = "auto";
  el.style.cursor = "pointer";
  el.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    void react();
  });

  const act = () => turn(Math.random() < 0.55 ? scene : fly);

  window.addEventListener("motionchange", () => {
    if (!calm()) return;
    // Stop wherever it is; it settles there until full motion comes back.
    const here = getComputedStyle(el).transform;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transform = here === "none" ? "" : here;
  });

  const visible = whenVisible(box, () => {});
  every(visible, 12, 22, act, rand(6, 10));
  onOpen(box.closest("details"), () => turn(fly));
  // Collapsing the section sends it up to the top line as the content folds away.
  details.addEventListener("toggle", () => {
    if (!details.open) turn(fly);
  });
  (el as HTMLElement & { play?: () => Promise<unknown>; scene?: () => Promise<unknown> }).play = () => turn(fly);
  (el as HTMLElement & { scene?: () => Promise<unknown> }).scene = () => turn(scene);
}
