/* ============================================================
   Soma — moon.js
   Computes the moon's phase and the Hindu lunar day (tithi),
   then finds the next fasting day. Astronomy is deliberately
   lightweight: an age-since-new-moon model, accurate to well
   within a day — plenty for a fasting calendar.
   ============================================================ */

(function () {
  "use strict";

  var SYNODIC = 29.530588853;          // mean length of a lunar month (days)
  var NEW_MOON_JD = 2451550.1;         // reference new moon: 2000-01-06 18:14 UTC

  // ---- core astronomy ------------------------------------------------------

  function toJulian(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  // fraction of the way through the lunation, 0 (new) .. 1 (next new)
  function lunationFraction(date) {
    var age = (toJulian(date) - NEW_MOON_JD) % SYNODIC;
    if (age < 0) age += SYNODIC;
    return age / SYNODIC;
  }

  // illuminated fraction of the disc, 0 .. 1
  function illumination(fraction) {
    return (1 - Math.cos(2 * Math.PI * fraction)) / 2;
  }

  function phaseName(f) {
    if (f < 0.02 || f > 0.98) return "New Moon";
    if (f < 0.24) return "Waxing Crescent";
    if (f < 0.26) return "First Quarter";
    if (f < 0.49) return "Waxing Gibbous";
    if (f < 0.51) return "Full Moon";
    if (f < 0.74) return "Waning Gibbous";
    if (f < 0.76) return "Last Quarter";
    return "Waning Crescent";
  }

  // map a phase name to its rendered image slug
  function phaseSlug(name) {
    return name.toLowerCase().replace(" moon", "").replace(/\s+/g, "-");
  }

  // ---- the Hindu lunar day (tithi) -----------------------------------------

  var TITHI_NAMES = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi"
  ];
  var TITHI_DEVA = [
    "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पञ्चमी",
    "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी",
    "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी"
  ];

  // index 1..30 across the whole month (1..15 Shukla, 16..30 Krishna)
  function tithiIndex(fraction) {
    return Math.min(30, Math.floor(fraction * 30) + 1);
  }

  function tithi(fraction) {
    var idx = tithiIndex(fraction);
    var waxing = idx <= 15;
    var n = waxing ? idx : idx - 15;   // 1..15 within the paksha

    var name, deva;
    if (n === 15) {
      name = waxing ? "Purnima" : "Amavasya";
      deva = waxing ? "पूर्णिमा" : "अमावस्या";
    } else {
      name = TITHI_NAMES[n - 1];
      deva = TITHI_DEVA[n - 1];
    }

    return {
      index: idx,
      number: n,
      paksha: waxing ? "Shukla Paksha" : "Krishna Paksha",
      pakshaDeva: waxing ? "शुक्ल पक्ष" : "कृष्ण पक्ष",
      name: name,
      deva: deva
    };
  }

  // is a given tithi a Soma fast?
  function fastFor(t) {
    if (t.number === 11) return "Ekadashi";
    if (t.number === 13) return "Pradosh";
    if (t.index === 15) return "Purnima";
    if (t.index === 30) return "Amavasya";
    return null;
  }

  // scan forward day by day, sampling each evening, for the next fast
  function nextFast(from) {
    for (var d = 0; d <= 45; d++) {
      var day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + d, 18, 0, 0);
      var name = fastFor(tithi(lunationFraction(day)));
      if (name) return { name: name, days: d, date: day };
    }
    return null;
  }

  // ---- rendering -----------------------------------------------------------

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function whenLabel(days, date) {
    if (days === 0) return "tonight";
    if (days === 1) return "tomorrow";
    var when = date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    return "in " + days + " days · " + when;
  }

  function renderTonight() {
    var host = document.getElementById("tonight-grid");
    if (!host) return;

    var now = new Date();
    var f = lunationFraction(now);
    var lit = illumination(f);
    var phase = phaseName(f);
    var t = tithi(f);
    var next = nextFast(now);
    var pct = Math.round(lit * 100);

    var nextHtml = "";
    if (next) {
      nextHtml =
        '<p class="next-fast">Next fast · <strong>' + esc(next.name) + "</strong> " +
        '<span class="when">' + esc(whenLabel(next.days, next.date)) + "</span></p>";
    }

    host.innerHTML =
      '<img class="phase-img" src="assets/phases/' + phaseSlug(phase) + '.webp" ' +
        'width="130" height="130" loading="lazy" ' +
        'alt="' + esc(phase) + ", " + pct + '% illuminated" />' +
      '<div class="tonight-copy">' +
        '<p class="phase-name">' + esc(phase) + "</p>" +
        '<p class="phase-sub">' + pct + "% illuminated</p>" +
        '<p class="tithi"><span class="deva">' + esc(t.deva) + "</span>" +
          esc(t.name) + " · " + esc(t.paksha) + "</p>" +
      "</div>" +
      nextHtml;
  }

  // ---- scroll reveal -------------------------------------------------------

  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14 });
    items.forEach(function (el) { io.observe(el); });
  }

  // ---- hero moon: ambient rotation + zoom, plus scroll parallax ------------

  function setupParallax() {
    var moon = document.querySelector(".hero-bg");
    if (!moon) return;
    if (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    moon.style.willChange = "transform";
    moon.style.transformOrigin = "62% 42%"; // pivot on the disc, not the frame

    var ROT_AMP = 15;       // rotation sways to +/-15deg, then reverses back
    var ROT_PERIOD = 200;   // seconds for one full sway out-and-back
    var ZOOM_MID = 1.12;    // resting zoom
    var ZOOM_AMP = 0.12;    // breathe between 1.00x and 1.24x
    var ZOOM_PERIOD = 120;  // seconds for a full in-and-out breath
    var MOON_X = 0.20;      // nudge the moon right (fraction of viewport width)

    // One continuous loop. It reads scroll each frame, so parallax and the
    // ambient motion share a single transform and never fight. No overscan is
    // needed: the photo's sky and the page background are both black, so any
    // edge revealed by the rotation/zoom is invisible.
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var t = (ts - start) / 1000; // seconds elapsed
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;

      var shift = y * 0.42;                       // scroll parallax drift
      var rot = ROT_AMP * Math.sin(t * (2 * Math.PI) / ROT_PERIOD); // sway +/-15deg
      var zoom = ZOOM_MID + ZOOM_AMP * Math.sin(t * (2 * Math.PI) / ZOOM_PERIOD);

      var dx = (moon.clientWidth || window.innerWidth) * MOON_X;

      moon.style.transform =
        "translate(" + dx.toFixed(1) + "px, " + shift.toFixed(1) + "px) " +
        "rotate(" + rot.toFixed(2) + "deg) " +
        "scale(" + zoom.toFixed(4) + ")";

      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  // ---- analytics -----------------------------------------------------------

  // Thin wrapper over PostHog (initialised by the snippet in <head>). The
  // array stub queues calls until the real library loads, so this is safe to
  // call immediately; no-ops gracefully if the script is blocked or absent.
  function track(name, data) {
    if (!window.posthog || typeof window.posthog.capture !== "function") return;
    window.posthog.capture(name, data || {});
  }

  // Attribute every "open the app" click to where on the page it happened, so
  // the landing→app CTR can be broken down by placement.
  function setupAnalytics() {
    var links = document.querySelectorAll('a[href^="/app"]');
    links.forEach(function (a) {
      a.addEventListener("click", function () {
        var loc = a.classList.contains("nav-cta") ? "nav"
          : a.closest("#follow") ? "follow"
          : a.closest(".hero") ? "hero"
          : "other";
        track("open_app_click", { location: loc });
      });
    });
  }

  // ---- email capture -------------------------------------------------------

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setupSubscribe() {
    var form = document.getElementById("subscribe");
    if (!form) return;
    var input = form.querySelector('input[name="email"]');
    var honeypot = form.querySelector('input[name="company"]');
    var button = form.querySelector('button[type="submit"]');
    var msg = form.querySelector(".subscribe-msg");

    function setMsg(text, kind) {
      if (!msg) return;
      msg.textContent = text;
      msg.className = "subscribe-msg" + (kind ? " is-" + kind : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input && input.value ? input.value : "").trim();

      // Honeypot tripped — silently pretend success so bots learn nothing.
      if (honeypot && honeypot.value) {
        setMsg("Thanks — you're on the list.", "ok");
        form.reset();
        return;
      }
      if (!EMAIL_RE.test(email)) {
        setMsg("Please enter a valid email address.", "err");
        if (input) input.focus();
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }
      setMsg("", null);

      fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, source: "landing" }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (r) {
          if (r.ok && r.data && r.data.ok) {
            setMsg("Thanks — you're on the list.", "ok");
            form.reset();
            track("email_subscribed", { source: "landing" });
          } else {
            setMsg(
              (r.data && r.data.error) || "Something went wrong. Please try again.",
              "err",
            );
          }
        })
        .catch(function () {
          setMsg("Network error. Please try again.", "err");
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.textContent = "Notify me";
          }
        });
    });
  }

  // ---- init ----------------------------------------------------------------

  function init() {
    renderTonight();
    setupReveal();
    setupParallax();
    setupAnalytics();
    setupSubscribe();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
