/**
 * Wanderly Holidays – dashboard.js
 * Traveler dashboard behaviour. Loads after main.js (uses window.WH).
 *
 *  01. Sample data (TODO: replace with your bookings API)
 *  02. Sidebar (collapsible on tablet/mobile)
 *  03. Overview widgets
 *  04. My Bookings (table + mobile cards, status filter)
 *  05. Saved packages grid
 *  06. Tickets & invoices
 *  07. Messages (chat-style inbox)
 *  08. Itinerary print, logout
 */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const WH = window.WH || {};
  const { money, findPkg, esc, img, pkgImg, toast } = WH;
  const ROOT = document.body.dataset.root || "";

  /* ======================================================================
     01. SAMPLE DATA
     TODO: fetch these from your backend, e.g. fetch("/api/bookings").
     ====================================================================== */
  const BOOKINGS = [
    { ref: "WH-48K2QZ", pkg: "bali-bliss", start: "2026-12-18", travellers: 2, amount: 136479, status: "confirmed", booked: "2026-10-02" },
    { ref: "WH-77TP1M", pkg: "kerala-backwaters", start: "2027-01-24", travellers: 4, amount: 121758, status: "pending", booked: "2026-11-08" },
    { ref: "WH-21AB9C", pkg: "rajasthan-royal", start: "2026-03-10", travellers: 3, amount: 103919, status: "completed", booked: "2026-01-15" },
    { ref: "WH-09XY4D", pkg: "dubai-delights", start: "2026-06-05", travellers: 2, amount: 115479, status: "cancelled", booked: "2026-04-20" },
    { ref: "WH-63MN8P", pkg: "goa-beach-break", start: "2025-12-27", travellers: 2, amount: 31479, status: "completed", booked: "2025-11-30" }
  ];
  const STATUS = { pending: "Pending", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };
  const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const badge = (s) => `<span class="status status-${s}">${STATUS[s]}</span>`;
  const later = (fn, ms = 500) => setTimeout(fn, ms); // simulates network latency for skeletons

  /* ======================================================================
     02. SIDEBAR
     ====================================================================== */
  const sidebar = $(".wh-sidebar");
  const backdrop = $(".wh-dash-backdrop");
  const toggle = $(".wh-sidebar-toggle");
  const setSidebar = (open) => {
    sidebar?.classList.toggle("is-open", open);
    backdrop?.classList.toggle("show", open);
    toggle?.setAttribute("aria-expanded", String(open));
    if (open) $("a, button", sidebar)?.focus();
  };
  toggle?.addEventListener("click", () => setSidebar(!sidebar.classList.contains("is-open")));
  backdrop?.addEventListener("click", () => { setSidebar(false); toggle?.focus(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar?.classList.contains("is-open")) { setSidebar(false); toggle?.focus(); }
  });

  /* ======================================================================
     03. OVERVIEW
     ====================================================================== */
  const kpis = $("#dashKpis");
  if (kpis) {
    later(() => {
      const count = (s) => BOOKINGS.filter((b) => b.status === s).length;
      $$("[data-kpi]", kpis).forEach((el) => {
        const k = el.dataset.kpi;
        el.textContent = k === "saved" ? WH.getSaved().length : count(k);
      });
      kpis.setAttribute("aria-busy", "false");
    });
  }
  const recent = $("#recentBookings");
  if (recent) {
    later(() => {
      recent.innerHTML = BOOKINGS.slice(0, 3).map((b) => {
        const p = findPkg(b.pkg);
        return `<li class="d-flex align-items-center gap-3 py-3 border-bottom">
          <img src="${pkgImg(p, 120, 120)}" width="56" height="56" class="rounded-3" alt="" loading="lazy">
          <div class="flex-grow-1 min-w-0"><strong class="d-block text-truncate wh-text-ink">${esc(p.title)}</strong><small class="text-muted">${b.ref} · ${fmtDate(b.start)}</small></div>
          ${badge(b.status)}</li>`;
      }).join("");
      recent.setAttribute("aria-busy", "false");
    }, 650);
  }

  /* ======================================================================
     04. MY BOOKINGS
     ====================================================================== */
  const tbody = $("#bookingRows");
  const cards = $("#bookingCards");
  if (tbody || cards) {
    let filter = "all";
    const render = () => {
      const list = BOOKINGS.filter((b) => filter === "all" || b.status === filter);
      const empty = `<p class="text-muted p-3 mb-0">No ${filter === "all" ? "" : STATUS[filter].toLowerCase() + " "}bookings yet.</p>`;
      if (tbody) tbody.innerHTML = list.length ? list.map((b) => {
        const p = findPkg(b.pkg);
        return `<tr>
          <td><span class="fw-bold wh-text-ink wh-ltr">${b.ref}</span><br><small class="text-muted">Booked ${fmtDate(b.booked)}</small></td>
          <td><div class="d-flex align-items-center gap-3"><img src="${pkgImg(p, 96, 96)}" width="48" height="48" class="rounded-3" alt="" loading="lazy"><div><a href="${ROOT}package-details.html?id=${p.id}" class="fw-bold text-decoration-none">${esc(p.title)}</a><br><small class="text-muted">${p.days}D / ${p.nights}N</small></div></div></td>
          <td>${fmtDate(b.start)}</td>
          <td>${b.travellers}</td>
          <td class="fw-bold wh-text-ink">${money(b.amount)}</td>
          <td>${badge(b.status)}</td>
          <td class="text-end"><a class="btn btn-sm btn-outline-primary" href="itineraries.html#${b.ref}">Itinerary<span class="visually-hidden"> for ${b.ref}</span></a></td>
        </tr>`;
      }).join("") : `<tr><td colspan="7">${empty}</td></tr>`;
      if (cards) cards.innerHTML = list.length ? list.map((b) => {
        const p = findPkg(b.pkg);
        return `<article class="wh-dash-card">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2"><h3 class="h5 mb-0">${esc(p.title)}</h3>${badge(b.status)}</div>
          <dl class="row small mb-3 g-1">
            <dt class="col-5 text-muted fw-normal">Booking ID</dt><dd class="col-7 mb-0 fw-bold wh-ltr">${b.ref}</dd>
            <dt class="col-5 text-muted fw-normal">Start date</dt><dd class="col-7 mb-0">${fmtDate(b.start)}</dd>
            <dt class="col-5 text-muted fw-normal">Travellers</dt><dd class="col-7 mb-0">${b.travellers}</dd>
            <dt class="col-5 text-muted fw-normal">Amount</dt><dd class="col-7 mb-0 fw-bold">${money(b.amount)}</dd>
          </dl>
          <a class="btn btn-sm btn-outline-primary w-100" href="itineraries.html#${b.ref}">View itinerary</a>
        </article>`;
      }).join("") : empty;
      $("#bookingCount") && ($("#bookingCount").textContent = `${list.length} booking${list.length === 1 ? "" : "s"}`);
      [tbody?.closest("[aria-busy]"), cards].forEach((el) => el?.setAttribute("aria-busy", "false"));
    };
    $$("[data-status-filter]").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.statusFilter;
      $$("[data-status-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    }));
    later(render);
  }

  /* ======================================================================
     05. SAVED PACKAGES
     ====================================================================== */
  const savedGrid = $("#savedGrid");
  if (savedGrid) {
    const draw = () => {
      const ids = WH.getSaved();
      const list = ids.map(findPkg).filter(Boolean);
      $("#savedCount") && ($("#savedCount").textContent = `${list.length} saved`);
      savedGrid.innerHTML = list.length ? list.map((p) => `<div class="col-sm-6 col-xl-4">${WH.pkgCard(p, { extra: `<div class="d-flex gap-2 mb-3"><a class="btn btn-sm btn-accent flex-grow-1" href="${ROOT}booking.html?id=${p.id}">Book Now</a><button type="button" class="btn btn-sm btn-outline-primary" data-remove="${p.id}">Remove<span class="visually-hidden"> ${esc(p.title)}</span></button></div>` })}</div>`).join("")
        : `<div class="col-12"><div class="wh-empty"><i class="bi bi-heart" aria-hidden="true"></i><h2 class="h4 mt-3">No saved packages yet</h2><p class="text-muted">Tap the heart on any package to keep it here.</p><a class="btn btn-primary" href="${ROOT}domestic-packages.html">Browse packages</a></div></div>`;
      savedGrid.setAttribute("aria-busy", "false");
      WH.syncSaveButtons();
    };
    savedGrid.innerHTML = WH.skeletons(3, "col-sm-6 col-xl-4");
    later(draw);
    document.addEventListener("wh:saved", () => later(draw, 0));
    savedGrid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-remove]");
      if (!b) return;
      WH.setSaved(WH.getSaved().filter((x) => x !== b.dataset.remove));
      toast("Removed from saved packages", "bi-heart");
    });
  }

  /* ======================================================================
     06. TICKETS & INVOICES
     ====================================================================== */
  const docs = $("#docList");
  if (docs) {
    later(() => {
      const rows = BOOKINGS.filter((b) => b.status !== "cancelled").flatMap((b) => {
        const p = findPkg(b.pkg);
        return [
          { type: "E-ticket", icon: "bi-ticket-perforated", b, p },
          { type: "Invoice", icon: "bi-receipt", b, p },
          { type: "Hotel voucher", icon: "bi-building", b, p }
        ];
      });
      docs.innerHTML = rows.map((r) => `<li class="col-md-6"><div class="wh-doc">
        <span class="wh-doc-icon"><i class="bi ${r.icon}" aria-hidden="true"></i></span>
        <div class="flex-grow-1 min-w-0"><strong class="d-block wh-text-ink text-truncate">${r.type} – ${esc(r.p.title)}</strong><small class="text-muted"><span class="wh-ltr">${r.b.ref}</span> · Issued ${fmtDate(r.b.booked)} · PDF</small></div>
        <!-- TODO: link to the real PDF, e.g. href="/files/${r.b.ref}-${r.type}.pdf" download -->
        <button type="button" class="btn btn-sm btn-outline-primary" data-placeholder="PDF download"><i class="bi bi-download" aria-hidden="true"></i><span class="visually-hidden">Download ${r.type} for ${r.b.ref}</span></button>
      </div></li>`).join("");
      docs.setAttribute("aria-busy", "false");
    });
  }

  /* ======================================================================
     07. MESSAGES
     ====================================================================== */
  const THREADS = {
    agent: { name: "Meera – Your Travel Agent", msgs: [
      ["in", "Hi Aarav! Your Bali villa is confirmed for 18 Dec. Would you like me to add a sunset dinner at Jimbaran?", "10:02"],
      ["out", "Yes please, for the 20th if possible.", "10:15"],
      ["in", "Done. It's in your itinerary now. Your e-tickets will be ready 7 days before departure.", "10:21"]
    ] },
    support: { name: "24/7 Support", msgs: [["in", "Hello! How can we help you today?", "Yesterday"]] },
    visa: { name: "Visa Desk", msgs: [["in", "Your passport copy has been received. No visa is needed for Indonesia – visa on arrival applies.", "Mon"]] }
  };
  const chat = $("#chatMsgs");
  if (chat) {
    let active = "agent";
    const draw = () => {
      $("#chatName").textContent = THREADS[active].name;
      chat.innerHTML = THREADS[active].msgs.map(([d, t, time]) => `<div class="wh-msg ${d}"><span class="visually-hidden">${d === "out" ? "You" : THREADS[active].name}: </span>${esc(t)}<time>${esc(time)}</time></div>`).join("");
      chat.scrollTop = chat.scrollHeight;
    };
    $$("[data-thread]").forEach((b) => b.addEventListener("click", () => {
      active = b.dataset.thread;
      $$("[data-thread]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      draw();
    }));
    $("#chatForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#chatInput");
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      THREADS[active].msgs.push(["out", text, now]);
      input.value = "";
      draw();
      // TODO: send to your messaging backend / WebSocket. Demo auto-reply:
      later(() => { THREADS[active].msgs.push(["in", "Thanks – an agent will reply shortly (demo message).", now]); draw(); }, 900);
    });
    draw();
  }

  /* ======================================================================
     08. PRINT & LOGOUT
     ====================================================================== */
  $$("[data-logout]").forEach((b) => b.addEventListener("click", (e) => {
    e.preventDefault();
    // TODO: call your logout endpoint / clear auth token here.
    location.href = b.getAttribute("href") || `${ROOT}login.html`;
  }));
})();
