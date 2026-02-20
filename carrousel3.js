(function () {
  function qs(root, sel) { return root.querySelector(sel); }
  function qsa(root, sel) { return Array.from(root.querySelectorAll(sel)); }

  function buildLightbox(root) {
    const lb = document.createElement("div");
    lb.className = "c3__lb";
    lb.innerHTML = `
      <div class="c3__lb__backdrop" data-c3-lb-close></div>
      <div class="c3__lb__content">
        <button class="c3__lb__close" type="button" aria-label="Cerrar" data-c3-lb-close>×</button>
        <button class="c3__lb__nav c3__lb__nav--prev" type="button" aria-label="Anterior" data-c3-lb-prev></button>
        <img class="c3__lb__img" alt="">
        <button class="c3__lb__nav c3__lb__nav--next" type="button" aria-label="Siguiente" data-c3-lb-next></button>
      </div>
    `;
    document.body.appendChild(lb);
    return lb;
  }

  function initCarousel(root) {
    const stage = qs(root, "[data-c3-stage]");
    const btnPrev = qs(root, "[data-c3-prev]");
    const btnNext = qs(root, "[data-c3-next]");
    if (!stage || !btnPrev || !btnNext) return;

    const imgs = qsa(stage, "img");
    if (imgs.length === 0) return;

    stage.innerHTML = "";
    const slides = imgs.map((img) => {
      const wrap = document.createElement("div");
      wrap.className = "c3__slide";
      wrap.appendChild(img);
      stage.appendChild(wrap);
      return wrap;
    });

    let index = 0;

    let lb = document.querySelector(".c3__lb");
    if (!lb) lb = buildLightbox(root);

    const lbImg = qs(lb, ".c3__lb__img");
    const lbPrev = qs(lb, "[data-c3-lb-prev]");
    const lbNext = qs(lb, "[data-c3-lb-next]");
    const lbCloseEls = qsa(lb, "[data-c3-lb-close]");

    function clamp(i) {
      if (i < 0) return 0;
      if (i > slides.length - 1) return slides.length - 1;
      return i;
    }

    function render() {
      slides.forEach((s) => s.classList.remove("is-prev", "is-current", "is-next"));

      const prev = index - 1;
      const next = index + 1;

      if (prev >= 0) slides[prev].classList.add("is-prev");
      slides[index].classList.add("is-current");
      if (next <= slides.length - 1) slides[next].classList.add("is-next");

      btnPrev.disabled = index === 0;
      btnNext.disabled = index === slides.length - 1;

      if (lb.classList.contains("is-open")) {
        lbPrev.disabled = index === 0;
        lbNext.disabled = index === slides.length - 1;
      }
    }

    function goTo(i) {
      index = clamp(i);
      render();
    }

    function openLightbox() {
      const img = slides[index].querySelector("img");
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      lb.classList.add("is-open");
      document.documentElement.style.overflow = "hidden";
      lbPrev.disabled = index === 0;
      lbNext.disabled = index === slides.length - 1;
    }

    function closeLightbox() {
      lb.classList.remove("is-open");
      document.documentElement.style.overflow = "";
    }

    function syncLightboxImage() {
      if (!lb.classList.contains("is-open")) return;
      const img = slides[index].querySelector("img");
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      lbPrev.disabled = index === 0;
      lbNext.disabled = index === slides.length - 1;
    }

    btnPrev.addEventListener("click", () => { goTo(index - 1); syncLightboxImage(); });
    btnNext.addEventListener("click", () => { goTo(index + 1); syncLightboxImage(); });

    stage.addEventListener("click", (e) => {
      const cur = slides[index];
      const img = cur.querySelector("img");
      if (img && (e.target === img || cur.contains(e.target))) openLightbox();
    });

    lbPrev.addEventListener("click", () => { goTo(index - 1); syncLightboxImage(); });
    lbNext.addEventListener("click", () => { goTo(index + 1); syncLightboxImage(); });

    lbCloseEls.forEach((el) => el.addEventListener("click", closeLightbox));

    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") { goTo(index - 1); syncLightboxImage(); }
      if (e.key === "ArrowRight") { goTo(index + 1); syncLightboxImage(); }
    });

    let sx = 0, sy = 0, tracking = false;

    function onStart(ev) {
      if (!lb.classList.contains("is-open")) return;
      tracking = true;
      const t = ev.touches ? ev.touches[0] : ev;
      sx = t.clientX; sy = t.clientY;
    }

    function onEnd(ev) {
      if (!tracking || !lb.classList.contains("is-open")) return;
      tracking = false;
      const t = ev.changedTouches ? ev.changedTouches[0] : ev;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;

      if (Math.abs(dx) < 35 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) { goTo(index + 1); syncLightboxImage(); }
      else { goTo(index - 1); syncLightboxImage(); }
    }

    lb.addEventListener("touchstart", onStart, { passive: true });
    lb.addEventListener("touchend", onEnd, { passive: true });

    render();
  }

  function boot() {
    document.querySelectorAll("[data-c3]").forEach(initCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
