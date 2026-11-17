/**
 * Wanderly Holidays – main.js
 * Vanilla ES6+. Depends on Bootstrap 5 bundle and plugins/packages.js
 * (window.WH_PACKAGES) on pages that list packages.
 *
 * MODULES
 *  01. Helpers
 *  02. Theme (dark/light) + direction (LTR/RTL)
 *  03. Header, back-to-top, reveal on scroll, year
 *  04. Toast
 *  05. Saved packages (favourites)
 *  06. Package card renderer + listing filters/sort
 *  07. Hero search -> listing page
 *  08. Form validation & submission (Formspree / Netlify / Mailchimp)
 *  09. Package details (dynamic by ?id=) + gallery lightbox + pricing
 *  10. Booking stepper
 *  11. Blog search / filter
 *  12. Countdown, counters, password toggle, misc
 */
(() => {
  "use strict";

  /* ======================================================================
     01. HELPERS
     ====================================================================== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    }
  };
  /** Root path from the current page to /pages (set via <body data-root>). */
  const ROOT = document.body.dataset.root || "";
  const PKGS = window.WH_PACKAGES || [];
  const findPkg = (id) => PKGS.find((p) => p.id === id);

  /**
   * Format a price in Indian Rupees.
   * TODO: change locale/currency for your market, e.g. ("en-US", "USD").
   */
  const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  const img = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}.webp`;
  /** Package image: local file from assets/images (p.image) or the seed placeholder fallback. */
  const pkgImg = (p, w, h, suffix = "") => p.image && !suffix
    ? `${document.body.dataset.root || ""}../assets/images/${encodeURIComponent(p.image)}`
    : img(p.seed + suffix, w, h);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const params = new URLSearchParams(location.search);

  document.documentElement.classList.remove("no-js");

  /* ======================================================================
     02. THEME + DIRECTION
     Keys: wanderly-theme ("light" | "dark"), wanderly-dir ("ltr" | "rtl")
     The early inline script in <head> applies saved values before paint.
     ====================================================================== */
  const THEME_KEY = "wanderly-theme";
  const DIR_KEY = "wanderly-dir";
  const mql = window.matchMedia("(prefers-color-scheme: dark)");

  /** Apply a theme to <html> and update every toggle button. */
  function applyTheme(theme) {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    html.setAttribute("data-bs-theme", theme);
    $$("[data-theme-toggle]").forEach((btn) => {
      const dark = theme === "dark";
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      const icon = $("i", btn);
      if (icon) icon.className = dark ? "bi bi-sun" : "bi bi-moon-stars";
    });
  }
  const savedTheme = store.get(THEME_KEY);
  applyTheme(savedTheme || (mql.matches ? "dark" : "light"));
  mql.addEventListener?.("change", (e) => { if (!store.get(THEME_KEY)) applyTheme(e.matches ? "dark" : "light"); });
  $$("[data-theme-toggle]").forEach((btn) => btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.classList.add("wh-theme-anim");
    applyTheme(next);
    store.set(THEME_KEY, next);
    setTimeout(() => document.documentElement.classList.remove("wh-theme-anim"), 350);
  }));

  /** Apply text direction and update the toggle label. */
  function applyDir(dir) {
    document.documentElement.setAttribute("dir", dir);
    $$("[data-dir-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(dir === "rtl"));
      btn.setAttribute("aria-label", dir === "rtl" ? "Switch to left-to-right layout" : "Switch to right-to-left layout");
      const lbl = $(".wh-dir-label", btn);
      if (lbl) lbl.textContent = dir === "rtl" ? "LTR" : "RTL";
    });
  }
  applyDir(store.get(DIR_KEY) || document.documentElement.getAttribute("dir") || "ltr");
  $$("[data-dir-toggle]").forEach((btn) => btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("dir") === "rtl" ? "ltr" : "rtl";
    applyDir(next);
    store.set(DIR_KEY, next);
  }));

  /* ======================================================================
     03. HEADER, BACK TO TOP, REVEAL, YEAR
     ====================================================================== */
  const header = $(".wh-header");
  const backTop = $(".wh-back-top");
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle("is-scrolled", y > 8);
    backTop?.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  backTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -60px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("is-visible"));
  }
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Bootstrap tooltips (used for form help tips & icons)
  if (window.bootstrap) $$('[data-bs-toggle="tooltip"]').forEach((el) => new bootstrap.Tooltip(el));

  /* ======================================================================
     04. TOAST
     ====================================================================== */
  let toastTimer;
  /** Show a short status message (also announced to screen readers). */
  function toast(msg, icon = "bi-check-circle") {
    let el = $("#whToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "whToast";
      el.className = "wh-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i><span>${esc(msg)}</span>`;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  window.WH = { toast, money, findPkg, store, img, pkgImg, esc };

  /* ======================================================================
     05. SAVED PACKAGES (favourites) – stored in localStorage "wanderly-saved"
     ====================================================================== */
  const SAVED_KEY = "wanderly-saved";
  const getSaved = () => store.get(SAVED_KEY, ["bali-bliss", "kerala-backwaters", "swiss-alps"]);
  const setSaved = (ids) => { store.set(SAVED_KEY, ids); document.dispatchEvent(new CustomEvent("wh:saved", { detail: ids })); };
  window.WH.getSaved = getSaved;
  window.WH.setSaved = setSaved;

  /** Sync every heart button with the saved list. */
  function syncSaveButtons() {
    const saved = getSaved();
    $$("[data-save]").forEach((btn) => {
      const on = saved.includes(btn.dataset.save);
      btn.setAttribute("aria-pressed", String(on));
      const name = btn.dataset.name || "package";
      btn.setAttribute("aria-label", on ? `Remove ${name} from saved packages` : `Save ${name}`);
    });
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-save]");
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.save;
    const saved = getSaved();
    const on = saved.includes(id);
    setSaved(on ? saved.filter((x) => x !== id) : [...saved, id]);
    syncSaveButtons();
    toast(on ? "Removed from saved packages" : "Saved – find it in your dashboard", on ? "bi-heart" : "bi-heart-fill");
  });
  syncSaveButtons();

  /* ======================================================================
     06. PACKAGE CARD RENDERER + LISTING
     ====================================================================== */
  const INCL = {
    flight: ["bi-airplane", "Flights included"], hotel: ["bi-building", "Hotel stay included"],
    meals: ["bi-cup-hot", "Meals included"], sightseeing: ["bi-camera", "Sightseeing included"],
    transfers: ["bi-car-front", "Transfers included"]
  };

  /**
   * Build a package card (markup mirrors the static cards in the HTML).
   * @param {object} p   package from WH_PACKAGES
   * @param {object} opt { headingLevel, extra } – extra = HTML appended to body
   */
  function pkgCard(p, opt = {}) {
    const h = opt.headingLevel || 3;
    const badges = [];
    if (p.old) badges.push(`<span class="wh-badge wh-badge-accent">Save ${Math.round((1 - p.price / p.old) * 100)}%</span>`);
    if (p.cat === "international" && p.visa) badges.push(`<span class="wh-badge"><i class="bi bi-passport" aria-hidden="true"></i>${esc(p.visa)}</span>`);
    if (p.cat === "international" && p.flight) badges.push(`<span class="wh-badge"><i class="bi bi-airplane" aria-hidden="true"></i>Flights incl.</span>`);
    const incl = p.incl.map((k) => `<li title="${INCL[k][1]}"><i class="bi ${INCL[k][0]}" aria-hidden="true"></i><span class="visually-hidden">${INCL[k][1]}</span></li>`).join("");
    return `
      <article class="wh-card wh-card-hover wh-pkg">
        <div class="wh-card-media">
          <img src="${pkgImg(p, 640, 440)}" width="640" height="440" alt="${esc(p.alt)}" loading="lazy" decoding="async">
          <div class="wh-pkg-badges">${badges.join("")}</div>
          <button type="button" class="wh-save" data-save="${p.id}" data-name="${esc(p.title)}" aria-pressed="false" aria-label="Save ${esc(p.title)}"><i class="bi bi-heart" aria-hidden="true"></i></button>
        </div>
        <div class="wh-card-body">
          <p class="wh-pkg-loc"><i class="bi bi-geo-alt" aria-hidden="true"></i>${esc(p.place)}</p>
          <p class="wh-pkg-code"><span class="visually-hidden">Package code: </span>${esc(p.code || "")}</p>
          <h${h} class="wh-card-title"><a href="${ROOT}package-details.html?id=${p.id}">${esc(p.title)}</a></h${h}>
          <div class="wh-pkg-meta">
            <span><i class="bi bi-clock" aria-hidden="true"></i>${p.days} days / ${p.nights} nights</span>
            <span class="wh-rating"><i class="bi bi-star-fill" aria-hidden="true"></i>${p.rating}<span>(${p.reviews})</span><span class="visually-hidden"> out of 5 from ${p.reviews} reviews</span></span>
          </div>
          <ul class="wh-incl" aria-label="Included in this package">${incl}</ul>
          ${opt.extra || ""}
          <div class="wh-pkg-foot">
            <p class="wh-price mb-0"><small>From</small><strong>${money(p.price)}</strong>${p.old ? `<s><span class="visually-hidden">Was </span>${money(p.old)}</s>` : ""} <span class="per">/ person</span></p>
            <a class="btn btn-sm btn-outline-primary" href="${ROOT}package-details.html?id=${p.id}">View Details<span class="visually-hidden"> for ${esc(p.title)}</span></a>
          </div>
        </div>
      </article>`;
  }
  window.WH.pkgCard = pkgCard;
  window.WH.syncSaveButtons = syncSaveButtons;

  /** Skeleton placeholders while a grid loads. */
  const skeletons = (n, col) => Array.from({ length: n }, () => `
      <div class="${col}" aria-hidden="true"><div class="skeleton-card">
        <div class="skeleton sk-media"></div>
        <div class="sk-body"><div class="skeleton sk-line w-40"></div><div class="skeleton sk-line lg w-80"></div><div class="skeleton sk-line w-60"></div><div class="skeleton sk-line"></div></div>
      </div></div>`).join("");
  window.WH.skeletons = skeletons;

  /** Render a grid of packages into a container (with skeleton first). */
  function renderGrid(el, list, col) {
    el.setAttribute("aria-busy", "true");
    el.innerHTML = skeletons(Math.min(list.length || 3, 6), col);
    // TODO: replace the timeout with your real API request.
    setTimeout(() => {
      el.innerHTML = list.length
        ? list.map((p) => `<div class="${col}">${pkgCard(p, { extra: (el.dataset.extra || "").startsWith("perks") ? perksHtml(p, el.dataset.extra) : "" })}</div>`).join("")
        : `<div class="col-12"><div class="wh-empty"><i class="bi bi-search" aria-hidden="true"></i><h3 class="h4 mt-3">No packages match these filters</h3><p class="text-muted mb-3">Try widening the budget or duration, or clear all filters.</p><button type="button" class="btn btn-outline-primary" data-clear-filters>Clear all filters</button></div></div>`;
      el.setAttribute("aria-busy", "false");
      syncSaveButtons();
    }, 450);
  }

  /** Honeymoon / family extra lines on cards. */
  function perksHtml(p, type) {
    if (type === "perks-honeymoon") {
      return p.perks.length ? `<ul class="wh-list-check small mb-3">${p.perks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
    }
    return `<div class="d-flex flex-wrap gap-2 mb-3">
      ${p.kids ? `<span class="wh-badge wh-badge-primary"><i class="bi bi-emoji-smile" aria-hidden="true"></i>${esc(p.kids)}</span>` : ""}
      ${p.group ? `<span class="wh-badge"><i class="bi bi-people" aria-hidden="true"></i>Group ${esc(p.group)}</span>` : ""}
      ${p.activity ? `<span class="wh-badge wh-badge-sand"><i class="bi bi-activity" aria-hidden="true"></i>${esc(p.activity)} pace</span>` : ""}
    </div>`;
  }

  /* Listing page with filter sidebar: <form id="pkgFilters" data-cat="domestic"> */
  const filterForm = $("#pkgFilters");
  const grid = $("#pkgGrid");
  if (filterForm && grid) {
    const cat = filterForm.dataset.cat;
    const sortSel = $("#pkgSort");
    const countEl = $("#pkgCount");
    const priceRange = $("#fPrice");
    const priceOut = $("#fPriceOut");
    const col = grid.dataset.col || "col-sm-6 col-xl-4";

    // Prefill from hero search query (?dest=&duration=&budget=)
    if (params.get("duration")) $$(`input[name="duration"][value="${params.get("duration")}"]`, filterForm).forEach((i) => { i.checked = true; });
    if (params.get("budget") && priceRange) priceRange.value = params.get("budget");
    if (params.get("dest")) { const s = $("#fSearch"); if (s) s.value = params.get("dest"); }
    ["theme", "region"].forEach((k) => params.getAll(k).forEach((v) => $$(`input[name="${k}"]`, filterForm).forEach((i) => { if (i.value === v) i.checked = true; })));

    const inDuration = (days, val) => {
      const [a, b] = val.split("-").map(Number);
      return days >= a && days <= b;
    };
    const apply = () => {
      const fd = new FormData(filterForm);
      const regions = fd.getAll("region");
      const themes = fd.getAll("theme");
      const durations = fd.getAll("duration");
      const visa = fd.getAll("visa");
      const flightOnly = fd.get("flight") === "1";
      const maxPrice = Number(fd.get("price") || Infinity);
      const q = String(fd.get("q") || "").trim().toLowerCase();
      let list = PKGS.filter((p) => p.cat === cat
        && (!regions.length || regions.includes(p.region))
        && (!themes.length || themes.includes(p.theme))
        && (!durations.length || durations.some((d) => inDuration(p.days, d)))
        && (!visa.length || visa.includes(p.visa))
        && (!flightOnly || p.flight)
        && p.price <= maxPrice
        && (!q || `${p.title} ${p.dest} ${p.place}`.toLowerCase().includes(q)));
      const sort = sortSel?.value || "popular";
      const sorters = {
        popular: (a, b) => b.reviews - a.reviews,
        "price-asc": (a, b) => a.price - b.price,
        "price-desc": (a, b) => b.price - a.price,
        rating: (a, b) => b.rating - a.rating,
        duration: (a, b) => a.days - b.days
      };
      list = list.sort(sorters[sort]);
      if (countEl) countEl.textContent = `${list.length} package${list.length === 1 ? "" : "s"} found`;
      if (priceOut && priceRange) priceOut.textContent = `Up to ${money(priceRange.value)}`;
      renderGrid(grid, list, col);
    };
    let t;
    const debounced = () => { clearTimeout(t); t = setTimeout(apply, 200); };
    filterForm.addEventListener("input", debounced);
    filterForm.addEventListener("submit", (e) => { e.preventDefault(); apply(); });
    sortSel?.addEventListener("change", apply);
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-clear-filters]")) return;
      filterForm.reset();
      if (priceRange) priceRange.value = priceRange.max;
      apply();
    });
    apply();
  }

  /* Simple tag-based grids: <div data-pkg-grid data-tag="honeymoon"> */
  $$("[data-pkg-grid]").forEach((el) => {
    const { tag, cat, ids, limit } = el.dataset;
    let list = PKGS.filter((p) => (!tag || p.tags.includes(tag)) && (!cat || p.cat === cat));
    if (ids) list = ids.split(",").map(findPkg).filter(Boolean);
    if (limit) list = list.slice(0, Number(limit));
    renderGrid(el, list, el.dataset.col || "col-sm-6 col-lg-4");
  });

  /* ======================================================================
     07. HERO SEARCH -> send to the right listing page
     ====================================================================== */
  $$("[data-hero-search]").forEach((form) => form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const type = fd.get("type");
    // Destination values look like "domestic", "international" or "international:Bali"
    const [scope, place] = String(fd.get("dest") || "domestic").split(":");
    const page = type === "honeymoon" || type === "family" ? "honeymoon-family-tours.html"
      : scope === "international" ? "international-packages.html" : "domestic-packages.html";
    const q = new URLSearchParams();
    if (place) q.set("dest", place);
    ["duration", "budget", "month"].forEach((k) => fd.get(k) && q.set(k, fd.get(k)));
    if (type === "family") q.set("tab", "family");
    location.href = `${ROOT}${page}${q.toString() ? "?" + q : ""}`;
  }));

  /* Open the right tab from ?tab= on Honeymoon & Family page */
  if (params.get("tab") && window.bootstrap) {
    const tabBtn = $(`[data-bs-target="#tab-${params.get("tab")}"]`);
    if (tabBtn) bootstrap.Tab.getOrCreateInstance(tabBtn).show();
  }

  /* ======================================================================
     08. FORM VALIDATION & SUBMISSION
     Usage: <form data-wh-validate novalidate action="https://formspree.io/f/XXXX">
     Each control sits inside .wh-field with an .invalid-feedback element.
     Optional per-field messages: data-msg-required, data-msg-type,
     data-msg-pattern, data-msg-min, data-msg-match="#otherField".
     ====================================================================== */
  const DEFAULT_MSG = {
    valueMissing: "This field is required.",
    typeMismatch: { email: "Please enter a valid email, like name@example.com.", url: "Please enter a valid web address.", tel: "Please enter a valid phone number." },
    patternMismatch: "Please check the format of this field.",
    tooShort: (el) => `Please use at least ${el.minLength} characters.`,
    rangeUnderflow: (el) => `Please choose ${el.min} or more.`,
    rangeOverflow: (el) => `Please choose ${el.max} or less.`
  };

  /** Return an error message for a field, or "" if valid. */
  function fieldError(el) {
    if (el.dataset.match) {
      const other = $(el.dataset.match);
      if (other && el.value && el.value !== other.value) return el.dataset.msgMatch || "The values do not match.";
    }
    if (el.type === "date" && el.value && el.min && el.value < el.min) return el.dataset.msgMin || "Please choose a future date.";
    const v = el.validity;
    if (v.valid) return "";
    if (v.valueMissing) return el.dataset.msgRequired || (el.type === "checkbox" ? "Please tick this box to continue." : DEFAULT_MSG.valueMissing);
    if (v.typeMismatch) return el.dataset.msgType || DEFAULT_MSG.typeMismatch[el.type] || "Please check this value.";
    if (v.patternMismatch) return el.dataset.msgPattern || DEFAULT_MSG.patternMismatch;
    if (v.tooShort) return el.dataset.msgMin || DEFAULT_MSG.tooShort(el);
    if (v.rangeUnderflow) return DEFAULT_MSG.rangeUnderflow(el);
    if (v.rangeOverflow) return DEFAULT_MSG.rangeOverflow(el);
    return "Please check this field.";
  }

  /** Validate one control and paint its .wh-field wrapper. */
  function validateField(el) {
    const wrap = el.closest(".wh-field");
    if (!wrap) return true;
    const msg = fieldError(el);
    const fb = $(".invalid-feedback", wrap);
    if (fb) fb.innerHTML = msg ? `<i class="bi bi-exclamation-circle" aria-hidden="true"></i>${esc(msg)}` : "";
    wrap.classList.toggle("is-invalid", !!msg);
    wrap.classList.toggle("is-valid", !msg && (el.value !== "" || el.checked));
    el.setAttribute("aria-invalid", String(!!msg));
    return !msg;
  }
  window.WH.validateField = validateField;

  /** Validate a set of controls; focus the first invalid one. */
  function validateAll(scope) {
    const fields = $$("input, select, textarea", scope).filter((el) => el.closest(".wh-field") && !el.disabled && el.type !== "hidden");
    let first = null;
    fields.forEach((el) => { if (!validateField(el) && !first) first = el; });
    if (first) first.focus();
    return !first;
  }
  window.WH.validateAll = validateAll;

  /** Show a status message under a form. */
  function formStatus(form, type, msg) {
    let box = $(".wh-form-status", form);
    if (!box) {
      box = document.createElement("div");
      box.className = "wh-form-status mt-3";
      box.setAttribute("role", type === "error" ? "alert" : "status");
      form.appendChild(box);
    }
    const icon = { success: "bi-check-circle-fill", error: "bi-exclamation-triangle-fill", info: "bi-info-circle-fill" }[type];
    box.className = `wh-form-status mt-3 show ${type}`;
    box.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i><span>${msg}</span>`;
  }

  $$("form[data-wh-validate]").forEach((form) => {
    form.setAttribute("novalidate", "");
    $$("input, select, textarea", form).forEach((el) => {
      el.addEventListener("blur", () => { if (el.value || el.closest(".wh-field.is-invalid")) validateField(el); });
      el.addEventListener("input", () => { if (el.closest(".wh-field.is-invalid")) validateField(el); });
      el.addEventListener("change", () => { if (el.type === "checkbox" || el.tagName === "SELECT") validateField(el); });
    });
    if (form.hasAttribute("data-wh-stepper")) return; // booking handles its own submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateAll(form)) { formStatus(form, "error", "Please fix the highlighted fields and try again."); return; }
      const action = form.getAttribute("action") || "";
      const btn = $('[type="submit"]', form);
      const success = form.dataset.success || "Thanks! We'll get back to you within 24 hours.";
      // Demo / placeholder endpoints: don't pretend a message was sent.
      if (!action || /YOUR_|xxxx|example/i.test(action) || form.dataset.demo !== undefined) {
        formStatus(form, "info", form.dataset.demoMsg || "Form is valid. This is a demo template, so nothing was sent – connect Formspree, Netlify or Mailchimp to receive submissions (see documentation).");
        return;
      }
      btn && (btn.disabled = true);
      try {
        const isNetlify = form.hasAttribute("data-netlify");
        const body = isNetlify ? new URLSearchParams(new FormData(form)).toString() : new FormData(form);
        const res = await fetch(isNetlify ? "/" : action, {
          method: "POST", body,
          headers: isNetlify ? { "Content-Type": "application/x-www-form-urlencoded" } : { Accept: "application/json" }
        });
        if (!res.ok) throw new Error("Request failed");
        formStatus(form, "success", success);
        form.reset();
        $$(".wh-field", form).forEach((w) => w.classList.remove("is-valid", "is-invalid"));
      } catch {
        formStatus(form, "error", "Sorry, we couldn't send that right now. Please try again or call us.");
      } finally {
        btn && (btn.disabled = false);
      }
    });
  });

  /* ======================================================================
     09. PACKAGE DETAILS
     ====================================================================== */
  const detail = $("[data-pkg-detail]");
  if (detail) {
    const p = findPkg(params.get("id")) || findPkg(detail.dataset.pkgDetail);
    if (p) {
      document.title = `${p.title} – ${p.days}D/${p.nights}N | Wanderly Holidays`;
      $$("[data-bind]").forEach((el) => {
        const k = el.dataset.bind;
        const map = {
          title: p.title, place: p.place, dest: p.dest, days: `${p.days} days / ${p.nights} nights`,
          price: money(p.price), old: p.old ? money(p.old) : "", rating: p.rating, reviews: `${p.reviews} reviews`,
          code: p.code || "", region: p.region, theme: p.theme.charAt(0).toUpperCase() + p.theme.slice(1), visa: p.visa || "Not required"
        };
        if (k in map) el.textContent = map[k];
      });
      $$("[data-bind-hide-old]").forEach((el) => { el.hidden = !p.old; });
      $$("[data-bind-visa]").forEach((el) => { el.hidden = !p.visa; });
      const gal = $$(".wh-gallery img");
      if (gal[0]) { gal[0].src = pkgImg(p, 1200, 900); gal[0].alt = p.alt; gal[0].closest("button").dataset.full = pkgImg(p, 1600, 1100); gal[0].closest("button").dataset.alt = p.alt; }
      $$("[data-book-link]").forEach((a) => { a.href = `${ROOT}booking.html?id=${p.id}`; });
      $$("[data-save-detail]").forEach((b) => { b.dataset.save = p.id; b.dataset.name = p.title; });
      $$("[data-crumb]").forEach((a) => {
        a.textContent = p.cat === "international" ? "International Packages" : "Domestic Packages";
        a.href = `${ROOT}${p.cat}-packages.html`;
      });
      detail.dataset.price = p.price;
      if (p.id !== detail.dataset.pkgDetail) {
        // Swap package-specific sample content for generic content built from the data.
        // TODO: add rich per-package content (overview, hotels, reviews) to packages.js.
        gal.slice(1).forEach((im, i) => {
          const alt = `${p.title}: ${p.dest} photo ${i + 2}`;
          im.src = img(`${p.seed}-g${i + 1}`, 600, 450); im.alt = alt;
          const btn = im.closest("button"); btn.dataset.full = img(`${p.seed}-g${i + 1}`, 1600, 1100); btn.dataset.alt = alt; btn.setAttribute("aria-label", `Open photo: ${alt}`);
        });
        if (gal[0]) gal[0].closest("button").setAttribute("aria-label", `Open photo: ${p.alt}`);
        const stops = p.dest.split(",").map((x) => x.trim());
        const inclNames = { flight: "Return flights", hotel: `${p.nights} nights in handpicked hotels`, meals: "Daily breakfast and selected meals", sightseeing: "Guided sightseeing with entry tickets", transfers: "Private airport and intercity transfers" };
        const excl = [!p.flight && "Flights (add during booking)", p.cat === "international" && p.visa !== "Visa free" && "Visa fees", "Travel insurance (add during booking)", "Personal expenses and tips"].filter(Boolean);
        const generic = {
          overview: `<p>${p.days} days across ${esc(p.dest)} with handpicked stays, private transfers and time to slow down. A travel expert plans every detail, and you can change dates or add extras during booking.</p>${p.perks.length ? `<ul class="wh-list-check row row-cols-md-2 g-0 mt-3">${p.perks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}`,
          inclusions: `<div class="col-md-6"><h3 class="h5 mb-3">Included</h3><ul class="wh-list-check">${p.incl.map((k) => `<li>${inclNames[k]}</li>`).join("")}<li>24/7 on-trip support</li></ul></div><div class="col-md-6"><h3 class="h5 mb-3">Not included</h3><ul class="wh-list-x">${excl.map((x) => `<li>${x}</li>`).join("")}</ul></div>`,
          hotels: stops.map((s, i) => `<div class="col-md-6"><div class="wh-hotel"><img src="${img(`${p.seed}-hotel${i}`, 224, 224)}" width="224" height="224" alt="Hotel room in ${esc(s)}" loading="lazy"><div><h3 class="h5 mb-1">Handpicked stay in ${esc(s)}</h3><p class="small text-muted mb-2">4-star or boutique · confirmed after booking</p></div></div></div>`).join(""),
          reviews: `<div class="col-12"><article class="wh-review"><p class="mb-0">Verified reviews for ${esc(p.title)} appear here. TODO: load reviews from your review platform.</p></article></div>`,
          "faq-flight": p.flight ? "Yes, return economy flights from major cities are included. Upgrades can be added during booking." : "Flights are not included. Add them during booking and we'll find the best fares."
        };
        $$("[data-generic]").forEach((el) => { if (generic[el.dataset.generic]) el.innerHTML = generic[el.dataset.generic]; });
      }
      // Build a generic day-by-day plan for packages without hand-written content.
      // TODO: replace with real itineraries per package (e.g. an "itinerary" array in packages.js).
      const acc = $("#itinAcc");
      if (acc && p.id !== detail.dataset.pkgDetail) {
        const stops = p.dest.split(",").map((x) => x.trim());
        const days = Array.from({ length: p.days }, (_, i) => {
          if (i === 0) return [`Arrive in ${stops[0]}`, `Meet your Wanderly representative, private transfer to your hotel and a relaxed welcome evening in ${stops[0]}.`];
          if (i === p.days - 1) return ["Departure", `Breakfast, free time for shopping and transfer for your onward journey. Your trip summary stays in your dashboard.`];
          const s = stops[Math.min(stops.length - 1, Math.floor((i / (p.days - 1)) * stops.length))];
          return [`Explore ${s}`, `Guided sightseeing around ${s} with local experiences, leisure time and dinner recommendations from your travel agent.`];
        });
        acc.innerHTML = days.map(([t, d], i) => `
          <div class="accordion-item">
            <h3 class="accordion-header" id="itinH${i}"><button class="accordion-button${i ? " collapsed" : ""}" type="button" data-bs-toggle="collapse" data-bs-target="#itinC${i}" aria-expanded="${!i}" aria-controls="itinC${i}"><span class="wh-day-pill">Day ${i + 1}</span>${esc(t)}</button></h3>
            <div id="itinC${i}" role="region" class="accordion-collapse collapse${i ? "" : " show"}" aria-labelledby="itinH${i}"><div class="accordion-body">${esc(d)}</div></div>
          </div>`).join("");
      }
      syncSaveButtons();
    }

    // Price calculator in the sticky summary
    const base = Number(detail.dataset.price || 28990);
    const adults = $("#sumAdults");
    const kids = $("#sumKids");
    const tiers = { 1: 1.35, 2: 1, 3: .97, 4: .94, 5: .92, 6: .9 };
    const recalc = () => {
      const a = Math.max(1, Number(adults?.value || 2));
      const k = Math.max(0, Number(kids?.value || 0));
      const per = Math.round(base * (tiers[Math.min(a, 6)] || .9));
      const total = per * a + Math.round(base * .5) * k;
      const tax = Math.round(total * .05);
      $("#sumPer") && ($("#sumPer").textContent = money(per));
      $("#sumSub") && ($("#sumSub").textContent = money(total));
      $("#sumTax") && ($("#sumTax").textContent = money(tax));
      $$("[data-sum-total]").forEach((el) => { el.textContent = money(total + tax); });
      $$("[data-tier-price]").forEach((td) => { td.textContent = money(Math.round(base * Number(td.dataset.tierPrice))); });
      const bl = $$("[data-book-link]");
      bl.forEach((link) => { const u = new URL(link.href, location.href); u.searchParams.set("adults", String(a)); u.searchParams.set("kids", String(k)); link.href = u.pathname.split("/").pop() + u.search; });
    };
    [adults, kids].forEach((i) => i?.addEventListener("change", recalc));
    recalc();
  }

  /* Number steppers: <div class="wh-stepper-input"><button data-step="-1">… */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (!b) return;
    const input = $("input", b.closest(".wh-stepper-input"));
    const min = Number(input.min || 0);
    const max = Number(input.max || 99);
    input.value = Math.min(max, Math.max(min, Number(input.value || 0) + Number(b.dataset.step)));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  /* Gallery lightbox (Bootstrap modal #whLightbox) */
  const lb = $("#whLightbox");
  if (lb && window.bootstrap) {
    const modal = bootstrap.Modal.getOrCreateInstance(lb);
    const lbImg = $("img", lb);
    const lbCap = $(".wh-lb-caption", lb);
    const items = $$("[data-lightbox]");
    let idx = 0;
    const show = (i) => {
      idx = (i + items.length) % items.length;
      const it = items[idx];
      lbImg.src = it.dataset.full;
      lbImg.alt = it.dataset.alt || "";
      lbCap.textContent = `${it.dataset.alt || ""} (${idx + 1} of ${items.length})`;
    };
    items.forEach((it, i) => it.addEventListener("click", () => { show(i); modal.show(); }));
    $("[data-lb-prev]", lb)?.addEventListener("click", () => show(idx - 1));
    $("[data-lb-next]", lb)?.addEventListener("click", () => show(idx + 1));
    lb.addEventListener("keydown", (e) => {
      const rtl = document.documentElement.dir === "rtl";
      if (e.key === "ArrowRight") show(idx + (rtl ? -1 : 1));
      if (e.key === "ArrowLeft") show(idx + (rtl ? 1 : -1));
    });
  }

  /* Scrollspy-like active state for the details sub-nav */
  const subnav = $(".wh-subnav");
  if (subnav && "IntersectionObserver" in window) {
    const links = $$("a", subnav);
    const so = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${en.target.id}`));
    }), { rootMargin: "-40% 0px -55% 0px" });
    links.forEach((l) => { const s = $(l.getAttribute("href")); s && so.observe(s); });
  }

  /* ======================================================================
     10. BOOKING STEPPER
     Steps: trip → travellers → add-ons → payment → confirmation
     No real payment is processed. TODO: connect Stripe Checkout / PayPal
     Buttons in the payment step (see documentation).
     ====================================================================== */
  const bForm = $("#bookingForm");
  if (bForm) {
    const panels = $$(".wh-step-panel", bForm);
    const steps = $$(".wh-progress li");
    const p = findPkg(params.get("id")) || findPkg("kerala-backwaters");
    let current = 0;
    const date = $("#bDate");
    if (date) {
      const t = new Date(); t.setDate(t.getDate() + 7);
      date.min = t.toISOString().slice(0, 10);
    }
    if (params.get("adults")) $("#bAdults").value = params.get("adults");
    if (params.get("kids")) $("#bKids").value = params.get("kids");
    $$("[data-b-title]").forEach((el) => { el.textContent = p.title; });
    $$("[data-b-meta]").forEach((el) => { el.textContent = `${p.days} days / ${p.nights} nights · ${p.place}`; });
    $$("[data-b-img]").forEach((el) => { el.src = pkgImg(p, 480, 320); el.alt = p.alt; });
    $("#bPackage") && ($("#bPackage").value = p.id);

    /** Recalculate the order summary. */
    const calc = () => {
      const a = Number($("#bAdults").value || 1);
      const k = Number($("#bKids").value || 0);
      const room = $("#bRoom").selectedOptions[0];
      const roomAdd = Number(room?.dataset.add || 0);
      const addons = $$('input[name="addons"]:checked', bForm).reduce((s, i) => s + Number(i.dataset.price) * (i.dataset.per === "person" ? a + k : 1), 0);
      const sub = p.price * a + Math.round(p.price * .5) * k + roomAdd * p.nights;
      const tax = Math.round((sub + addons) * .05);
      const total = sub + addons + tax;
      $("#bsTravellers").textContent = `${a} adult${a > 1 ? "s" : ""}${k ? `, ${k} child${k > 1 ? "ren" : ""}` : ""}`;
      $("#bsBase").textContent = money(sub);
      $("#bsAddons").textContent = money(addons);
      $("#bsTax").textContent = money(tax);
      $$("[data-b-total]").forEach((el) => { el.textContent = money(total); });
      $("#bsDate").textContent = date.value ? new Date(date.value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Not selected";
      return total;
    };
    bForm.addEventListener("input", calc);
    bForm.addEventListener("change", calc);

    /** Move to step i, updating progress and focus. */
    const go = (i) => {
      current = i;
      panels.forEach((pn, n) => pn.classList.toggle("is-active", n === i));
      steps.forEach((s, n) => {
        s.classList.toggle("is-done", n < i);
        s.classList.toggle("is-current", n === i);
        n === i ? s.setAttribute("aria-current", "step") : s.removeAttribute("aria-current");
      });
      const h = $("h2", panels[i]);
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      bForm.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    bForm.addEventListener("click", (e) => {
      if (e.target.closest("[data-next]")) {
        if (validateAll(panels[current])) {
          if (current === panels.length - 2) {
            // Payment step → confirmation (demo)
            const ref = "WH-" + Math.random().toString(36).slice(2, 8).toUpperCase();
            $("#bRef").textContent = ref;
            $("#bConfirmTotal").textContent = money(calc());
            $("#bConfirmEmail").textContent = $("#bEmail").value;
          }
          go(current + 1);
        }
      }
      if (e.target.closest("[data-prev]")) go(Math.max(0, current - 1));
    });
    bForm.addEventListener("submit", (e) => e.preventDefault());
    calc();
  }

  /* ======================================================================
     11. BLOG SEARCH / FILTER
     ====================================================================== */
  const blogList = $("#blogList");
  if (blogList) {
    const posts = $$("[data-post]", blogList);
    const search = $("#blogSearch");
    const empty = $("#blogEmpty");
    let cat = params.get("cat") || "all";
    if (params.get("q") && search) search.value = params.get("q");
    const run = () => {
      const q = (search?.value || "").toLowerCase().trim();
      let shown = 0;
      posts.forEach((el) => {
        const ok = (cat === "all" || el.dataset.cat === cat) && (!q || el.textContent.toLowerCase().includes(q));
        el.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      $$("[data-blog-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.blogCat === cat)));
      const c = $("#blogCount"); if (c) c.textContent = `${shown} article${shown === 1 ? "" : "s"}`;
    };
    $$("[data-blog-cat]").forEach((b) => b.addEventListener("click", () => { cat = b.dataset.blogCat; run(); }));
    search?.addEventListener("input", run);
    $("#blogSearchForm")?.addEventListener("submit", (e) => { e.preventDefault(); run(); });
    run();
  }

  /* ======================================================================
     12. COUNTDOWN, COUNTERS, PASSWORD TOGGLE, MISC
     ====================================================================== */
  /* <div class="wh-countdown" data-countdown="2026-12-31T23:59:59"> */
  $$("[data-countdown]").forEach((el) => {
    let end = new Date(el.dataset.countdown).getTime();
    if (Number.isNaN(end) || end < Date.now()) end = Date.now() + 1000 * 60 * 60 * 24 * 12; // TODO: set a real launch/offer date
    const parts = { d: $("[data-d]", el), h: $("[data-h]", el), m: $("[data-m]", el), s: $("[data-s]", el) };
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      parts.d && (parts.d.textContent = d);
      parts.h && (parts.h.textContent = String(h).padStart(2, "0"));
      parts.m && (parts.m.textContent = String(m).padStart(2, "0"));
      parts.s && (parts.s.textContent = String(s).padStart(2, "0"));
    };
    tick();
    setInterval(tick, 1000);
  });

  /* Count-up stats: <strong data-count="12000" data-suffix="+"> */
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth < 640;
    const fmt = (n) => new Intl.NumberFormat("en-IN").format(n);
    const co = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; co.unobserve(el);
      const target = Number(el.dataset.count), dec = Number(el.dataset.decimals || 0), suf = el.dataset.suffix || "";
      if (reduce) { el.textContent = (dec ? target.toFixed(dec) : fmt(target)) + suf; return; }
      const t0 = performance.now(), dur = 1400;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur), v = target * (1 - Math.pow(1 - k, 3));
        el.textContent = (dec ? v.toFixed(dec) : fmt(Math.round(v))) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: .5 });
    counters.forEach((c) => co.observe(c));
  }

  /* Horizontal carousels: <div data-carousel> with [data-carousel-prev]/[data-carousel-next] */
  $$("[data-carousel]").forEach((wrap) => {
    const track = $(".wh-track", wrap);
    if (!track) return;
    const step = (dir) => {
      const rtl = document.documentElement.dir === "rtl";
      const card = track.firstElementChild;
      const w = card ? card.getBoundingClientRect().width + 24 : track.clientWidth * .8;
      track.scrollBy({ left: dir * w * (rtl ? -1 : 1), behavior: "smooth" });
    };
    $("[data-carousel-prev]", wrap)?.addEventListener("click", () => step(-1));
    $("[data-carousel-next]", wrap)?.addEventListener("click", () => step(1));
  });

  /* Print buttons */
  $$("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));

  /* Show / hide password */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-toggle-pass]");
    if (!b) return;
    const input = $(b.dataset.togglePass);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    b.setAttribute("aria-pressed", String(show));
    b.setAttribute("aria-label", show ? "Hide password" : "Show password");
    $("i", b).className = show ? "bi bi-eye-slash" : "bi bi-eye";
  });

  /* Demo login → dashboard (no real auth). TODO: replace with your auth API. */
  $$("[data-demo-login]").forEach((form) => form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateAll(form)) return;
    formStatus(form, "info", "Demo mode: no account check is performed. Opening the sample traveler dashboard…");
    setTimeout(() => { location.href = form.dataset.demoLogin; }, 900);
  }));

  /* Social login / payment placeholders */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-placeholder]");
    if (!b) return;
    e.preventDefault();
    toast(`${b.dataset.placeholder} isn't connected yet – see documentation`, "bi-plug");
  });

  /* Close the mobile menu after choosing a same-page link */
  $$(".wh-header .navbar-collapse a[href^='#']").forEach((a) => a.addEventListener("click", () => {
    const c = $(".wh-header .navbar-collapse.show");
    if (c && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(c).hide();
  }));
})();
