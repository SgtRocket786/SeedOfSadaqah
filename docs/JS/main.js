/* ===============================
   Shared partials + nav wiring
================================= */

async function includePart(el, url) {
  const res = await fetch(url);
  el.innerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // depth=0 for *.html, depth=1 for projects/*.html
  const depth = document.body.getAttribute("data-depth") || "0";
  const prefix = depth === "1" ? "../" : "";

  // Inject header/footer partials
  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");
  if (headerHost)
    await includePart(headerHost, prefix + "partials/header.html");
  if (footerHost)
    await includePart(footerHost, prefix + "partials/footer.html");

  // After injection: rewrite nav links and logo to be depth-safe
  const navRoot = document.getElementById("navLinks");
  if (navRoot) {
    navRoot.querySelectorAll("a[data-href]").forEach((a) => {
      a.href = prefix + a.getAttribute("data-href");
    });
  }
  const brand = document.querySelector("a.brand");
  if (brand) brand.href = prefix + "index.html";
  document.querySelectorAll("img.brand-logo-img").forEach((img) => {
    img.src = prefix + "Assets/img/logo.jpg";
  });

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Active link highlight
  const current = (
    location.pathname.split("/").pop() || "index.html"
  ).toLowerCase();
  document.querySelectorAll(".nav-links a[href]").forEach((a) => {
    const target = (a.getAttribute("href") || "")
      .split("/")
      .pop()
      ?.toLowerCase();
    if (target === current) a.classList.add("active");
  });

  // Mobile hamburger
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const open = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", String(!open));
      if (!open) {
        navLinks.style.display = "flex";
        navLinks.style.flexDirection = "column";
        navLinks.style.position = "absolute";
        navLinks.style.right = "1rem";
        navLinks.style.top = "60px";
        navLinks.style.background = "white";
        navLinks.style.padding = "0.6rem";
        navLinks.style.border = "1px solid rgba(0,0,0,.08)";
        navLinks.style.borderRadius = "12px";
        navLinks.style.boxShadow = "0 10px 30px rgba(0,0,0,.08)";
      } else {
        navLinks.style.display = "";
        navLinks.removeAttribute("style");
        navLinks.className = "nav-links";
      }
    });
  }

  // Init slider & contact forms
  initHeroSlider();
  wireContactForms();
  wireCopyButtons();
  enhanceNavDismiss();
}

/* ===============================
   HERO SLIDER (stacked layout)
   - arrows, dots, autoplay, pause on hover/focus
   - swipe & keyboard support
================================= */

function initHeroSlider() {
  const root = document.querySelector(".slider");
  if (!root) return;

  const track = root.querySelector("#slides");
  if (!track) return;

  const slides = Array.from(track.children);
  if (!slides.length) return;

  // Buttons
  const prev = root.querySelector(".slider-btn.prev");
  const next = root.querySelector(".slider-btn.next");

  // Dots (auto-create if missing / count mismatch)
  let dotsWrap = root.querySelector(".slider-dots");
  if (!dotsWrap) {
    dotsWrap = document.createElement("div");
    dotsWrap.className = "slider-dots";
    root.appendChild(dotsWrap);
  }
  if (!dotsWrap.children.length || dotsWrap.children.length !== slides.length) {
    dotsWrap.innerHTML = ""; // reset
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "dot";
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      if (i === 0) b.setAttribute("aria-current", "true");
      dotsWrap.appendChild(b);
    });
  }
  const dots = Array.from(dotsWrap.querySelectorAll(".dot"));

  let index = 0;
  let timer = null;
  const AUTOPLAY_MS = 6000;

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-100 * index}%)`;
    dots.forEach((d, idx) =>
      d.setAttribute("aria-current", idx === index ? "true" : "false")
    );
  }

  function autoplay() {
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), AUTOPLAY_MS);
  }

  // Controls
  prev?.addEventListener("click", () => {
    go(index - 1);
    autoplay();
  });
  next?.addEventListener("click", () => {
    go(index + 1);
    autoplay();
  });
  dots.forEach((d, i) =>
    d.addEventListener("click", () => {
      go(i);
      autoplay();
    })
  );

  // Pause on hover/focus
  root.addEventListener("mouseenter", () => clearInterval(timer));
  root.addEventListener("mouseleave", autoplay);
  root.addEventListener("focusin", () => clearInterval(timer));
  root.addEventListener("focusout", autoplay);

  // Pause when tab hidden (saves CPU, avoids jumps)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearInterval(timer);
    else autoplay();
  });

  // Swipe support
  let startX = null;
  track.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener("pointerup", (e) => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    startX = null;
    autoplay();
  });

  // Keyboard (left/right)
  root.setAttribute("tabindex", "0"); // focusable slider
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      go(index - 1);
      autoplay();
    } else if (e.key === "ArrowRight") {
      go(index + 1);
      autoplay();
    }
  });

  // Init
  go(0);
  autoplay();
}

/* ===============================
   Contact forms: validate required
   + success pill message
================================= */

function wireContactForms() {
  function wire(formId, msgId) {
    const form = document.getElementById(formId);
    const msg = document.getElementById(msgId);
    if (!form || !msg) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const inputs = form.querySelectorAll(
        "input[required], textarea[required]"
      );
      let valid = true;

      inputs.forEach((el) => {
        if (!el.value.trim()) {
          valid = false;
          el.classList.add("error");
        } else {
          el.classList.remove("error");
        }
      });

      // Basic HTML5 email validity (if present)
      const email = form.querySelector('input[type="email"]');
      if (email && !email.checkValidity()) {
        valid = false;
        email.classList.add("error");
      }

      if (!valid) {
        msg.textContent = "Please fill out all fields before submitting.";
        msg.className = "note error";
        return;
      }

      // Simulated success
      msg.textContent = "Message sent! We’ll get back to you shortly.";
      msg.className = "note success";
      setTimeout(() => (msg.textContent = ""), 4000);
      form.reset();
    });
  }

  // Home & dedicated Contact page
  wire("contactFormHome", "contactMsgHome");
  wire("contactForm", "contactMsg");
}

/* ===============================
   Copy-to-clipboard for payment handles
================================= */
function wireCopyButtons() {
  const btns = document.querySelectorAll("button.copy[data-copy]");
  if (!btns.length) return;
  btns.forEach((b) => {
    b.addEventListener("click", async () => {
      const val = b.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(val);
        const note = b.nextElementSibling;
        if (note) {
          note.textContent = "Copied!";
          setTimeout(() => (note.textContent = ""), 1500);
        }
      } catch {
        const note = b.nextElementSibling;
        if (note) note.textContent = "Press Ctrl+C to copy";
      }
    });
  });
}

/* ===============================
   Nav: close on outside click / Esc
================================= */
function enhanceNavDismiss() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  if (!hamburger || !navLinks) return;

  document.addEventListener("click", (e) => {
    const open = hamburger.getAttribute("aria-expanded") === "true";
    if (!open) return;
    const within = navLinks.contains(e.target) || hamburger.contains(e.target);
    if (!within) {
      hamburger.setAttribute("aria-expanded", "false");
      navLinks.style.display = "";
      navLinks.removeAttribute("style");
      navLinks.className = "nav-links";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hamburger.setAttribute("aria-expanded", "false");
      navLinks.style.display = "";
      navLinks.removeAttribute("style");
      navLinks.className = "nav-links";
    }
  });
}
