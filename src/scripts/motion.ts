// Staggered, once-only scroll reveals + subtle parallax. Progressive enhancement:
// without JS the `js` class never lands and everything is visible.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
  group.querySelectorAll<HTMLElement>(':scope > [data-reveal]').forEach((el, i) => {
    el.style.setProperty('--d', `${i * 70}ms`);
  });
});

const wipeTargets = new Map<Element, Element>();
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      (wipeTargets.get(e.target) ?? e.target).classList.add('is-in');
      io.unobserve(e.target); // fire once
    }
  },
  { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
);
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
// A fully clipped element (clip-path inset 100%) has zero visible area, so the
// observer never reports it. Watch the unclipped parent instead.
document.querySelectorAll<HTMLElement>('[data-wipe]').forEach((el) => {
  const watch = el.parentElement ?? el;
  wipeTargets.set(watch, el);
  io.observe(watch);
});

if (!reduce) {
  const items = [...document.querySelectorAll<HTMLElement>('[data-parallax]')].map((el) => ({
    el,
    speed: parseFloat(el.dataset.parallax || '0'),
    box: (el.parentElement ?? el) as HTMLElement,
  }));
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const { el, speed, box } of items) {
      const r = box.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const offset = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  // Let the hero intro (CSS scale animation) finish before parallax takes over its transform.
  const hero = document.querySelector<HTMLElement>('.intro-img');
  if (hero) items.splice(items.findIndex((i) => i.el === hero), 1);
  hero?.addEventListener('animationend', () => {
    items.push({ el: hero, speed: parseFloat(hero.dataset.parallax || '0'), box: hero.parentElement as HTMLElement });
    update();
  }, { once: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
