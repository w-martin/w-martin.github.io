import { calm, every, injectStyle, onOpen, rand, sleep, turn, whenVisible } from "./shared";

// A will-o'-the-wisp: a small fae light that hovers beside the projects in the Software section.
// Its glow lights up the project it's visiting (a nudge to read it), it drifts between them leaving
// a trail of fading motes, and on arriving it loops once around the title. It never leaves the page.
// The wisp: a simple circular light in the page's single-weight grey line art, like the dragon and
// the hermit. A ring with a dot at its heart and four fine rays that twinkle, and a thin halo that
// pulses out. It drifts between projects shedding tiny plus-shaped sparks, and now and then spins on
// the spot. It never leaves the page.
const SPARK = `<svg viewBox="0 0 24 24" width="22" height="22"><g class="spin"><circle cx="12" cy="12" r="5"/><circle class="dot" cx="12" cy="12" r="1.6"/><g class="rays"><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/></g></g></svg>`;
const MOTE = `<svg viewBox="0 0 10 10" width="9" height="9"><path d="M5 0.8v8.4M0.8 5h8.4"/></svg>`;

const CSS = `
.wisp-layer{position:absolute;inset:0;pointer-events:none;z-index:50}
.wisp-layer svg{display:block;overflow:visible}
.wisp-layer svg *{fill:none;stroke:var(--color-body);stroke-width:1.2px;stroke-linecap:round;vector-effect:non-scaling-stroke}
.wisp-layer svg .dot{fill:var(--color-body);stroke:none}
.wisp{position:absolute;left:0;top:0;width:0;height:0}
.wisp .lamp{position:absolute;left:-110px;top:-60px;width:220px;height:120px;border-radius:50%;opacity:.3;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--color-accent) 22%,transparent),transparent);
  animation:ws-breathe 4.2s ease-in-out infinite alternate}
.wisp .core{position:absolute;left:-11px;top:-11px;width:22px;height:22px;animation:ws-bob 5.5s ease-in-out infinite}
.wisp .rays{transform-box:fill-box;transform-origin:center;animation:ws-twinkle 2.4s ease-in-out infinite alternate}
.wisp .spin{transform-box:fill-box;transform-origin:center}
.wisp .core.spinning .spin{animation:ws-spin 2.4s cubic-bezier(.45,0,.25,1)}
.wisp .core::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--color-body);opacity:0;
  animation:ws-halo 3s ease-out infinite}
.wisp-layer .mote{position:absolute;width:9px;height:9px;margin:-4.5px 0 0 -4.5px}
@keyframes ws-breathe{from{opacity:.2;transform:scale(.92)}to{opacity:.38;transform:scale(1.05)}}
@keyframes ws-bob{0%,100%{transform:translate(0,0)}25%{transform:translate(5px,-4px)}50%{transform:translate(1px,-8px)}75%{transform:translate(-5px,-3px)}}
@keyframes ws-twinkle{from{transform:scale(.82) rotate(-6deg);opacity:.7}to{transform:scale(1.08) rotate(8deg);opacity:1}}
@keyframes ws-halo{from{transform:scale(.8);opacity:.5}to{transform:scale(1.9);opacity:0}}
@keyframes ws-spin{from{transform:rotate(0)}to{transform:rotate(1080deg)}}
`;

type P = [number, number];
const ease = (t: number) => t * t * (3 - 2 * t);

export function mountWisp(section: HTMLElement) {
  injectStyle("creature-wisp", CSS);
  if (getComputedStyle(section).position === "static") section.style.position = "relative";
  const layer = document.createElement("div");
  layer.className = "wisp-layer";
  layer.setAttribute("aria-hidden", "true");
  const el = document.createElement("div");
  el.className = "wisp";
  el.innerHTML = `<div class="lamp"></div><div class="core">${SPARK}</div>`;
  layer.appendChild(el);
  // It lives in the heading, which stays visible when the section is collapsed.
  const head = section.querySelector<HTMLElement>(":scope > summary") ?? section;
  if (getComputedStyle(head).position === "static") head.style.position = "relative";
  head.appendChild(layer);
  const details = section as HTMLDetailsElement;
  const core = el.querySelector<HTMLElement>(".core")!;
  const lamp = el.querySelector<HTMLElement>(".lamp")!;

  // Collapsed: it hangs just past the heading's words on the top line.
  const topSpot = (): P => {
    const hb = head.getBoundingClientRect();
    return [Math.min(hb.width - 30, 190), hb.height / 2];
  };

  const stops = (): P[] => {
    if (!details.open) return [topSpot()];
    const box = section.getBoundingClientRect();
    return [...section.querySelectorAll<HTMLElement>("h3")].map((h) => {
      const r = h.getBoundingClientRect();
      return [r.left - box.left + Math.min(r.width, 160) + 18, r.top - box.top + r.height / 2 + 6];
    });
  };

  let at = 0;
  let pos: P = [0, 0];
  const put = (p: P) => {
    pos = p;
    el.style.transform = `translate(${p[0]}px,${p[1]}px)`;
  };
  const home = () => {
    const s = stops();
    if (s.length) put(s[Math.min(at, s.length - 1)]);
  };
  home();
  addEventListener("resize", home);

  // A spark shed along the way: it hangs where it was dropped and fades while drifting up.
  const mote = (x: number, y: number) => {
    const m = document.createElement("span");
    m.className = "mote";
    m.innerHTML = MOTE;
    m.style.cssText = `left:${x}px;top:${y}px`;
    layer.appendChild(m);
    m.animate(
      [
        { opacity: 0.9, transform: "translate(0,0) scale(1)" },
        { opacity: 0, transform: `translate(${rand(-8, 8)}px,${rand(-16, -6)}px) scale(.3)` },
      ],
      { duration: rand(1100, 1700), easing: "ease-out" },
    ).finished.then(() => m.remove());
  };

  const drift = async () => {
    const s = stops();
    const closed = !details.open;
    if (calm() || (!closed && s.length < 2)) return;
    // It favours the top of the section: half the time it heads back to the first project. Collapsed,
    // it just goes to the top line.
    let next = closed ? 0 : Math.random() < 0.5 ? 0 : Math.floor(Math.random() * s.length);
    if (!closed && next === at) next = (next + 1) % s.length;
    if (closed && Math.hypot(s[0][0] - pos[0], s[0][1] - pos[1]) < 12) return;
    const [x1, y1] = pos;
    const [x2, y2] = s[next];
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const sway = rand(18, 38) * (Math.random() < 0.5 ? -1 : 1);
    const ms = Math.max(2400, dist / 0.055);
    const point = (t: number): P => {
      const e = ease(t);
      const bend = Math.sin(e * Math.PI) * sway;
      return [x1 + (x2 - x1) * e + bend * 0.6, y1 + (y2 - y1) * e + bend];
    };
    const keys = Array.from({ length: 32 }, (_, i) => {
      const [px, py] = point(i / 31);
      return { transform: `translate(${px}px,${py}px)`, offset: i / 31 };
    });
    // motes dropped at intervals along the path
    for (let i = 2; i < 30; i += 2) {
      const [px, py] = point(i / 31);
      setTimeout(() => mote(px + rand(-4, 4), py + rand(-3, 5)), (i / 31) * ms);
    }
    try {
      const anim = el.animate(keys, { duration: ms, fill: "forwards" });
      await anim.finished;
      anim.cancel();
      at = next;
      put([x2, y2]);
      // arrival: the light swells over the title and loops once around it
      lamp.animate(
        [{ transform: "scale(1)", opacity: 0.5 }, { transform: "scale(1.5)", opacity: 0.85, offset: 0.4 }, { transform: "scale(1)", opacity: 0.5 }],
        { duration: 2200, easing: "ease-in-out" },
      );
      const orbit = Array.from({ length: 24 }, (_, i) => {
        const a = (i / 23) * 6.283 - 1.57;
        return { transform: `translate(${Math.cos(a) * 16}px,${(Math.sin(a) + 1) * 11}px)`, offset: i / 23 };
      });
      await core.animate(orbit, { duration: 1900, easing: "ease-in-out" }).finished;
    } finally {
      // (also runs if switching to calm mid-glide cancelled the animation)
      const m = new DOMMatrix(getComputedStyle(el).transform);
      pos = [m.m41, m.m42];
    }
  };

  window.addEventListener("motionchange", () => {
    if (!calm()) return;
    const here = getComputedStyle(el).transform;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transform = here === "none" ? "" : here;
  });

  // Spinning in place: the ring and rays spin on the spot and fling out a spiral of sparks.
  const spin = async () => {
    if (calm()) return;
    core.classList.add("spinning");
    // a spiral of sparks flung outward while it whirls
    for (let i = 0; i < 16; i++)
      setTimeout(() => {
        const a = i * 0.9;
        const r0 = 6 + i * 2.2;
        const dx = Math.cos(a) * r0;
        const dy = Math.sin(a) * r0;
        const [px, py] = pos;
        mote(px + dx, py + dy);
      }, i * 140);
    lamp.animate([{ transform: "scale(1)", opacity: 0.45 }, { transform: "scale(1.4)", opacity: 0.8, offset: 0.5 }, { transform: "scale(1)", opacity: 0.45 }], { duration: 2600, easing: "ease-in-out" });
    try {
      await sleep(2700);
    } finally {
      core.classList.remove("spinning");
    }
  };

  // The pointer, for the "peek" scene (desktop only).
  let mouse: P | null = null;
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") mouse = [e.clientX, e.clientY];
  });

  // Idle scenes: splits in two and rejoins, traces a loop round where it is, dims and rests, or leans
  // toward the cursor.
  const SCENES = ["split", "loop", "rest", "peek"] as const;
  const scene = async () => {
    if (calm()) return;
    const name = SCENES[Math.floor(Math.random() * SCENES.length)];
    if (name === "split") {
      const twin = core.cloneNode(true) as HTMLElement;
      twin.style.animation = "none";
      twin.querySelectorAll<SVGElement>("*").forEach((n) => (n.style.animation = "none"));
      el.appendChild(twin);
      const orbit = (sign: number, r: number) =>
        Array.from({ length: 41 }, (_, i) => {
          const t = i / 40;
          const grow = Math.sin(t * Math.PI); // out and back
          const a = sign * t * 6.283 * 2.5;
          return { transform: `translate(${Math.cos(a) * r * grow}px,${Math.sin(a) * r * grow * 0.6}px)`, offset: t };
        });
      const a = core.animate(orbit(1, 26), { duration: 5200, easing: "ease-in-out" });
      const b = twin.animate(orbit(-1, 26), { duration: 5200, easing: "ease-in-out" });
      await Promise.all([a.finished, b.finished]).catch(() => undefined);
      twin.remove();
    } else if (name === "loop") {
      const keys = Array.from({ length: 49 }, (_, i) => {
        const t = i / 48;
        const a = t * 6.283 - 1.57;
        return { transform: `translate(${Math.cos(a) * 34}px,${(Math.sin(a) + 1) * 20}px)`, offset: t };
      });
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const t = i / 19;
          const a = t * 6.283 - 1.57;
          mote(pos[0] + Math.cos(a) * 34, pos[1] + (Math.sin(a) + 1) * 20 - 6);
        }, (i / 19) * 4200);
      }
      await core.animate(keys, { duration: 4400, easing: "ease-in-out" }).finished.catch(() => undefined);
    } else if (name === "rest") {
      const dim = [{ opacity: 1 }, { opacity: 0.18, offset: 0.2 }, { opacity: 0.18, offset: 0.8 }, { opacity: 1 }];
      const a = core.animate(dim, { duration: 9000, easing: "ease-in-out" });
      const b = lamp.animate([{ opacity: 0.45 }, { opacity: 0.05, offset: 0.2 }, { opacity: 0.05, offset: 0.8 }, { opacity: 0.45 }], { duration: 9000, easing: "ease-in-out" });
      await Promise.all([a.finished, b.finished]).catch(() => undefined);
    } else {
      if (!mouse) return;
      const me = core.getBoundingClientRect();
      let dx = mouse[0] - (me.left + me.width / 2);
      let dy = mouse[1] - (me.top + me.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(46, d * 0.25);
      dx = (dx / d) * reach;
      dy = (dy / d) * reach;
      await core
        .animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx}px,${dy}px)`, offset: 0.3 }, { transform: `translate(${dx * 0.9}px,${dy * 0.9}px)`, offset: 0.7 }, { transform: "translate(0,0)" }], { duration: 4500, easing: "ease-in-out" })
        .finished.catch(() => undefined);
    }
  };
  const act = () => turn(Math.random() < 0.5 ? scene : drift);

  const visible = whenVisible(section, () => {});
  every(visible, 10, 20, act, rand(11, 16));
  every(visible, 24, 40, () => turn(spin), rand(18, 26));
  onOpen(section as HTMLDetailsElement, () => turn(drift));
  details.addEventListener("toggle", () => {
    if (!details.open) turn(drift);
  });
  (el as HTMLElement & { play?: () => Promise<unknown>; scene?: () => Promise<unknown> }).play = () => turn(drift);
  (el as HTMLElement & { scene?: () => Promise<unknown> }).scene = () => turn(scene);
}
