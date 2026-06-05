/* ============================================================
   Jayni Patel — Editorial / Architecture-firm interactions
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Nav scroll state ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 30) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  function closeMenu() { links.classList.remove("open"); toggle.classList.remove("open"); }
  toggle.addEventListener("click", function () {
    links.classList.toggle("open");
    toggle.classList.toggle("open");
  });
  links.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });

  /* ---- Hero: sliding banners with animated text ---- */
  (function initHeroSlider() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
    var texts = Array.prototype.slice.call(document.querySelectorAll(".hslide-text"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero__dot"));
    var prev = document.getElementById("heroPrev");
    var next = document.getElementById("heroNext");
    var textsWrap = document.getElementById("heroTexts");
    if (slides.length < 2) return;

    var n = slides.length, cur = 0, timer = null;
    var DELAY = 5500;

    // size the (absolutely-stacked) text container to the tallest slide's text
    function sizeTexts() {
      if (!textsWrap) return;
      var max = 0;
      texts.forEach(function (t) { max = Math.max(max, t.scrollHeight); });
      textsWrap.style.height = max + "px";
    }
    sizeTexts();
    window.addEventListener("load", sizeTexts);
    window.addEventListener("resize", sizeTexts);

    function go(i) {
      i = (i + n) % n;
      if (i === cur) return;
      slides[cur].classList.remove("active");
      texts[cur].classList.remove("active");
      dots[cur].classList.remove("active");
      cur = i;
      slides[cur].classList.add("active");
      texts[cur].classList.add("active");
      dots[cur].classList.add("active");
    }
    function nextSlide() { go(cur + 1); }
    function start() { if (!prefersReduced) timer = setInterval(nextSlide, DELAY); }
    function reset() { clearInterval(timer); start(); }

    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); reset(); }); });
    if (next) next.addEventListener("click", function () { go(cur + 1); reset(); });
    if (prev) prev.addEventListener("click", function () { go(cur - 1); reset(); });

    start();
  })();

  /* ---- Reveal / clip / mask on scroll (everything outside hero) ---- */
  var revealEls = document.querySelectorAll(".reveal, [data-reveal-clip], .contact .mask");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Parallax on scroll ---- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;
  function applyParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
      var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
      el.style.transform = "scale(1.12) translateY(" + offset.toFixed(1) + "px)";
    });
    ticking = false;
  }
  if (!prefersReduced && parallaxEls.length) {
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", applyParallax);
    applyParallax();
  }

  /* ---- Custom cursor ---- */
  var cursor = document.getElementById("cursor");
  if (cursor && finePointer && !prefersReduced) {
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
    document.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    document.addEventListener("mouseleave", function () { cursor.classList.add("hide"); });
    document.addEventListener("mouseenter", function () { cursor.classList.remove("hide"); });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a, button, [data-cursor]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("grow"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("grow"); });
    });
  }

  /* ---- Showreel horizontal scroll arrows ---- */
  var reel = document.getElementById("reel");
  var prev = document.getElementById("reelPrev");
  var next = document.getElementById("reelNext");
  function scrollAmount() {
    var card = reel && reel.querySelector(".rcard, .card");
    return card ? card.offsetWidth + 24 : 400;
  }
  if (reel && prev && next) {
    prev.addEventListener("click", function () { reel.scrollBy({ left: -scrollAmount(), behavior: "smooth" }); });
    next.addEventListener("click", function () { reel.scrollBy({ left: scrollAmount(), behavior: "smooth" }); });
  }

  /* ---- Lightbox ---- */
  var lightbox = document.getElementById("lightbox");
  var lbCat = document.getElementById("lbCat");
  var lbTitle = document.getElementById("lbTitle");
  var lastFocused = null;
  function openLightbox(cat, title) {
    lbCat.textContent = cat || "";
    lbTitle.textContent = title || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }
  document.querySelectorAll(".card").forEach(function (card) {
    function open() {
      lastFocused = card;
      openLightbox(card.getAttribute("data-cat"), card.getAttribute("data-title"));
    }
    card.addEventListener("click", open);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
  lightbox.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeLightbox); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
  });

  /* ---- Duplicate marquee tracks for seamless loops ---- */
  ["stripTrack", "marqueeTrack", "reelTrack"].forEach(function (id) {
    var track = document.getElementById(id);
    if (track) track.innerHTML += track.innerHTML;
  });

  /* ---- Services: pinned, scroll-driven blur text scroller (GSAP ScrollTrigger) ---- */
  (function initServices() {
    var section = document.getElementById("services");
    var stage = document.getElementById("srvStage");
    var words = document.getElementById("srvWords");
    var descs = document.getElementById("srvDescs");
    var bar = document.getElementById("srvBar");
    if (!section || !stage || !words || !descs || !window.gsap || !window.ScrollTrigger) return;
    if (prefersReduced) return; // keep static fallback list (.no-js)

    gsap.registerPlugin(ScrollTrigger);
    section.classList.remove("no-js");

    var wordEls = Array.prototype.slice.call(words.children);
    var descEls = Array.prototype.slice.call(descs.children);
    var n = wordEls.length;
    var cur = 0;

    function sizeStacks() {
      var wh = 0, dh = 0;
      wordEls.forEach(function (el) { wh = Math.max(wh, el.scrollHeight); });
      descEls.forEach(function (el) { dh = Math.max(dh, el.scrollHeight); });
      words.style.height = wh + "px";
      descs.style.height = dh + "px";
    }
    sizeStacks();

    // initial state — first service sharp & centered, the rest hidden below with heavy blur
    gsap.set(wordEls, { autoAlpha: 0, filter: "blur(18px)", yPercent: 60 });
    gsap.set(descEls, { autoAlpha: 0, filter: "blur(8px)", y: 24 });
    gsap.set(wordEls[0], { autoAlpha: 1, filter: "blur(0px)", yPercent: 0 });
    gsap.set(descEls[0], { autoAlpha: 1, filter: "blur(0px)", y: 0 });

    function goTo(i, dir) {
      if (i === cur || i < 0 || i >= n) return;
      var d = dir || (i > cur ? 1 : -1);
      var outW = wordEls[cur], inW = wordEls[i];
      var outD = descEls[cur], inD = descEls[i];
      gsap.killTweensOf([outW, inW, outD, inD]);

      // outgoing — blur + fade, drift opposite the entry direction
      gsap.to(outW, { autoAlpha: 0, filter: "blur(14px)", yPercent: -d * 35, duration: 0.6, ease: "power2.in" });
      gsap.to(outD, { autoAlpha: 0, filter: "blur(8px)", y: -d * 16, duration: 0.45, ease: "power2.in" });

      // incoming — comes from below (or above on up-scroll), heavy blur -> perfectly sharp
      gsap.fromTo(inW,
        { autoAlpha: 0, filter: "blur(18px)", yPercent: d * 60 },
        { autoAlpha: 1, filter: "blur(0px)", yPercent: 0, duration: 1.05, ease: "power3.out" });
      gsap.fromTo(inD,
        { autoAlpha: 0, filter: "blur(8px)", y: d * 22 },
        { autoAlpha: 1, filter: "blur(0px)", y: 0, duration: 0.9, ease: "power3.out", delay: 0.08 });

      cur = i;
    }

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      // shorter pinned distance → each service advances with less scrolling
      end: function () { return "+=" + (window.innerHeight * 0.6 * (n - 1)); },
      pin: true,
      pinSpacing: true,
      scrub: 1,
      snap: { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.6 }, delay: 0.04, ease: "power1.inOut" },
      invalidateOnRefresh: true,
      onRefresh: sizeStacks,
      onUpdate: function (self) {
        var i = Math.round(self.progress * (n - 1));
        if (i !== cur) goTo(i, self.direction);
        if (bar) bar.style.width = (self.progress * 100).toFixed(1) + "%";
      }
    });

    ScrollTrigger.refresh();
  })();

  /* ---- Featured podcast: click poster to play (avoids Error 153 on file://) ---- */
  var podcastPlay = document.getElementById("podcastPlay");
  var podcastFrame = document.getElementById("podcastFrame");
  if (podcastPlay && podcastFrame) {
    podcastPlay.addEventListener("click", function () {
      var id = podcastFrame.getAttribute("data-ytid");
      // YouTube embeds refuse to play from a local file:// origin (Error 153) — open on YouTube instead
      if (location.protocol === "file:") {
        window.open("https://youtu.be/" + id, "_blank", "noopener");
        return;
      }
      podcastFrame.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' + id +
        '?autoplay=1&rel=0&modestbranding=1" title="Jayni Patel — Full Podcast Episode" ' +
        'frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>';
    });
  }

  /* ---- Contact form → emails the inquiry (FormSubmit) ---- */
  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");
  var EMAIL_ENDPOINT = "https://formsubmit.co/ajax/jaynipatel02@gmail.com";
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function showNote(msg) {
    if (!note) return;
    note.textContent = msg;
    note.hidden = false;
  }
  if (form) {
    var sendBtn = form.querySelector(".btn-send");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var btnLabel = sendBtn ? sendBtn.innerHTML : "";
      if (sendBtn) { sendBtn.disabled = true; sendBtn.innerHTML = "<span>Sending…</span>"; }
      if (note) note.hidden = true;

      fetch(EMAIL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: "New inquiry from your portfolio website",
          _template: "table",
          _captcha: "false",
          Name: val("name"),
          Phone: val("phone"),
          Email: val("email"),
          Requirement: val("requirement"),
          Message: val("message")
        })
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          showNote("Thank you — your inquiry has been sent. I'll be in touch shortly.");
          form.reset();
        })
        .catch(function () {
          showNote("Sorry, something went wrong. Please email jaynipatel02@gmail.com or WhatsApp 9904720772.");
        })
        .then(function () {
          if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = btnLabel; }
        });
    });
  }
})();
