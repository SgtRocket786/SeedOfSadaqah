// Home page enhancements: impact counters when visible
(function () {
  const nums = document.querySelectorAll(".kpi .num[data-count]");
  if (!nums.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function animate(el) {
    const target = parseInt(el.getAttribute("data-count") || "0", 10);
    const isPercent = el.hasAttribute("data-percent");
    const start = performance.now();
    const DURATION = 1400;

    function frame(now) {
      const t = Math.min(1, (now - start) / DURATION);
      const v = Math.round(target * easeOut(t));
      el.textContent = isPercent ? `${v}%` : `${v.toLocaleString()}`;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const once = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animate(e.target);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  nums.forEach((n) => once.observe(n));
})();
