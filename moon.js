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

  // ---- init ----------------------------------------------------------------

  function init() {
    renderTonight();
    setupReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
