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
  var backdrop = document.getElementById("navBackdrop");
  function setMenu(open) {
    links.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    if (backdrop) backdrop.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function closeMenu() { setMenu(false); }
  toggle.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
  links.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  if (backdrop) backdrop.addEventListener("click", closeMenu);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---- Hero: sliding banners with animated text ---- */
  (function initHeroSlider() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
    var texts = Array.prototype.slice.call(document.querySelectorAll(".hslide-text"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero__dot"));
    if (slides.length < 2) return;

    var videos = slides.map(function (s) { return s.querySelector("video"); });
    var n = slides.length, cur = 0, timer = null;
    var DELAY = 5500;

    // only the visible slide's video loads/plays — saves bandwidth on mobile
    function playActive() {
      videos.forEach(function (v, i) {
        if (!v) return;
        if (i === cur) { v.play().catch(function () {}); }
        else { try { v.pause(); } catch (e) {} }
      });
    }

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
      playActive();
    }
    function nextSlide() { go(cur + 1); }
    function start() { if (!prefersReduced) timer = setInterval(nextSlide, DELAY); }
    function reset() { clearInterval(timer); start(); }

    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); reset(); }); });

    playActive();
    start();
  })();

  /* ---- Reveal / clip / mask on scroll (robust: IO + scroll fallback) ----
     A scroll/position check is used alongside IntersectionObserver because the
     pinned (GSAP) Services section can make IO miss elements below it, leaving
     them stuck invisible (e.g. the testimonials). The fallback guarantees any
     element within the viewport gets revealed. */
  var revealEls = Array.prototype.slice.call(
    document.querySelectorAll(".reveal, [data-reveal-clip], .contact .mask")
  );
  function revealInView() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = revealEls.length - 1; i >= 0; i--) {
      var el = revealEls[i];
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        el.classList.add("in");
        revealEls.splice(i, 1); // reveal once
      }
    }
  }
  revealInView();
  window.addEventListener("scroll", revealInView, { passive: true });
  window.addEventListener("resize", revealInView, { passive: true });
  window.addEventListener("load", revealInView);
  setTimeout(revealInView, 400);

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

  /* ---- Showreel: lazy-load the Instagram reel iframes only when scrolled near ---- */
  var showreel = document.getElementById("showreel");
  function loadReels() {
    if (!showreel) return;
    showreel.querySelectorAll("iframe[data-src]").forEach(function (f) {
      f.src = f.getAttribute("data-src");
      f.removeAttribute("data-src");
    });
  }
  if (showreel && "IntersectionObserver" in window) {
    var reelIO = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        loadReels();
        reelIO.disconnect();
      }
    }, { rootMargin: "700px 0px" });
    reelIO.observe(showreel);
  } else {
    loadReels();
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

  /* ---- Reel: auto-scroll + manual drag/swipe (left↔right) ---- */
  (function initReelScroller() {
    var reel = document.getElementById("reel");
    var track = document.getElementById("reelTrack");
    if (!reel || !track) return;

    var SPEED = 0.5;        // px per frame for the gentle auto-scroll
    var half = 0;           // width of one (un-duplicated) copy
    var paused = false, resumeTO = null;

    function measure() { half = track.scrollWidth / 2; }
    function normalize() {
      if (!half) return;
      if (reel.scrollLeft >= half) reel.scrollLeft -= half;
      else if (reel.scrollLeft < 0) reel.scrollLeft += half;
    }
    function pause() { paused = true; clearTimeout(resumeTO); }
    function resumeSoon(delay) { clearTimeout(resumeTO); resumeTO = setTimeout(function () { paused = false; }, delay || 1600); }

    function tick() {
      if (!paused) { reel.scrollLeft += SPEED; normalize(); }
      requestAnimationFrame(tick);
    }

    // keep the loop seamless when the user scrolls/drags manually
    reel.addEventListener("scroll", normalize, { passive: true });

    // pause while interacting, resume shortly after
    reel.addEventListener("mouseenter", pause);
    reel.addEventListener("mouseleave", function () { resumeSoon(800); });
    reel.addEventListener("wheel", function () { pause(); resumeSoon(); }, { passive: true });
    reel.addEventListener("touchstart", pause, { passive: true });
    reel.addEventListener("touchend", function () { resumeSoon(); }, { passive: true });

    // click-drag to scroll (desktop mouse)
    var dragging = false, startX = 0, startLeft = 0;
    reel.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return; // touch uses native scroll
      dragging = true; startX = e.clientX; startLeft = reel.scrollLeft;
      reel.classList.add("dragging"); pause();
      try { reel.setPointerCapture(e.pointerId); } catch (err) {}
    });
    reel.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      reel.scrollLeft = startLeft - (e.clientX - startX);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false; reel.classList.remove("dragging"); resumeSoon();
    }
    reel.addEventListener("pointerup", endDrag);
    reel.addEventListener("pointercancel", endDrag);

    measure();
    window.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    if (!prefersReduced) requestAnimationFrame(tick);
  })();

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
