// Helpers shared by the page creatures. Each creature lives in its own module and is only
// downloaded once its section is about to scroll into view.

export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export function injectStyle(id: string, css: string) {
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

/** Calls back with true while the element is on screen and the tab is visible. */
export function whenVisible(el: Element, onChange: (visible: boolean) => void) {
  let onScreen = false;
  let last: boolean | null = null;
  const update = () => {
    const visible = onScreen && !document.hidden;
    if (visible !== last) onChange((last = visible));
  };
  new IntersectionObserver(
    (entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      update();
    },
    { rootMargin: "80px" },
  ).observe(el);
  document.addEventListener("visibilitychange", update);
  return () => onScreen && !document.hidden;
}

/**
 * Runs fn after `first` seconds and then every lo-hi seconds, counting only the time the thing is
 * actually on screen. Each creature keeps its own clock, so they drift apart on their own and one
 * never fires while you're looking elsewhere.
 */
export function every(isVisible: () => boolean, lo: number, hi: number, fn: () => void, first: number) {
  let wait = first;
  setInterval(() => {
    if (!isVisible()) return;
    wait -= 0.5;
    if (wait > 0) return;
    wait = rand(lo, hi);
    fn();
  }, 500);
}

/** Opening a section (clicking its heading) sets its creature off a moment later. */
export function onOpen(details: HTMLDetailsElement | null, fn: () => void) {
  details?.addEventListener("toggle", () => {
    if (details.open) setTimeout(fn, 500);
  });
}

/** "Reduce motion" is on: creatures fade in place instead of travelling, and nothing loops. */
export const calm = () => document.documentElement.dataset.motion === "calm";

export const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

/**
 * Only one creature moves at a time. Movements queue up and run one after another with a pause
 * between, so the page never has two things travelling at once.
 */
let stage: Promise<unknown> = Promise.resolve();
export function turn(move: () => Promise<unknown>) {
  const run = stage.then(move).catch(() => undefined);
  stage = run.then(() => sleep(1800));
  return run;
}
