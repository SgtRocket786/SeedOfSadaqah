async function includePart(el, url) {
  const res = await fetch(url);
  el.innerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", async () => {
  const depth = document.body.getAttribute("data-depth") || "0";
  const prefix = depth === "1" ? "../" : "";
  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");
  if (headerHost)
    await includePart(headerHost, prefix + "partials/header.html");
  if (footerHost)
    await includePart(footerHost, prefix + "partials/footer.html");

  // fix header links now that header is injected
  const navRoot = document.getElementById("navLinks");
  if (navRoot) {
    navRoot.querySelectorAll("a[data-href]").forEach((a) => {
      a.href = prefix + a.getAttribute("data-href");
    });
    const brand = document.querySelector(".brand");
    if (brand) brand.href = prefix + "index.html";
  }

  // Footer year
  setTimeout(() => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }, 200);

  // After load, wire up events
  setTimeout(() => {
    const links = document.querySelectorAll(".nav-links a");
    links.forEach((a) => {
      const current = location.pathname.split("/").pop();
      const target = a.getAttribute("href").split("/").pop();
      if (current === target) a.classList.add("active");
    });
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
  }, 300);
});

// ===== HERO SLIDER (clean) =====
// ===== HERO SLIDER (stacked layout) =====
(function () {
  const root = document.querySelector(".slider");
  if (!root) return;

  const track = root.querySelector("#slides");
  const slides = Array.from(track.children);
  const dots = Array.from(root.querySelectorAll(".dot"));
  const prev = root.querySelector(".slider-btn.prev");
  const next = root.querySelector(".slider-btn.next");

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

  // Pause on hover/focus; resume on leave
  root.addEventListener("mouseenter", () => clearInterval(timer));
  root.addEventListener("mouseleave", autoplay);
  root.addEventListener("focusin", () => clearInterval(timer));
  root.addEventListener("focusout", autoplay);

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

  go(0);
  autoplay();
})();

// ===== END HERO SLIDER =====

// ===== Contact form validation & success state =====
(function () {
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

      if (!valid) {
        msg.textContent = "Please fill out all fields before submitting.";
        msg.className = "note error";
        return;
      }

      // If valid
      msg.textContent = "Message sent! We’ll get back to you shortly.";
      msg.className = "note success";
      setTimeout(() => (msg.textContent = ""), 4000);
      form.reset();
    });
  }
  wire("contactFormHome", "contactMsgHome");
  wire("contactForm", "contactMsg");
})();
// ===== END Contact form validation & success state =====
