/* ==========================================================
   Travlova — frontend
   Renders offer cards from /api/offers (mock data today,
   the exact same render code works once that endpoint calls
   real partner APIs — see Travlova-Project-Full-Guide).
   ========================================================== */

function fmt(n) { return "$" + Number(n).toLocaleString("en-US"); }

function goHref(offerId, providerName) {
  return `/go/${encodeURIComponent(offerId)}/${encodeURIComponent(providerName)}`;
}

function showToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

function checkIcon(val) {
  return val ? '<span class="check-yes">&#10003;</span>' : '<span class="check-no">&#10005;</span>';
}

/* ---- compare table builder (shared shape across flights/stays/cars/escapes) ---- */
function buildCompareTable(offer, opts) {
  const providers = offer.providers;
  const rows = opts.rows; // [{label, key, type: 'check'|'text', getValue(p)}]
  let thead = `<tr><th class="provider-cell" style="min-width:150px"></th>`;
  providers.forEach((p) => {
    thead += `<th class="provider-cell ${p.recommended ? "recommended-col" : ""}">
      ${p.recommended ? '<span class="rec-pill">Recommended</span><br>' : ""}
      <div class="provider-name">${p.name}</div>
      ${p.recommended ? '<div class="best-price-tag">Travlova &middot; Best Price</div>' : ""}
    </th>`;
  });
  thead += `</tr>`;

  let body = "";
  rows.forEach((row) => {
    body += `<tr><td>${row.label}</td>`;
    providers.forEach((p) => {
      const v = row.getValue(p);
      const cellContent = row.type === "check" ? checkIcon(v) : (v ?? "&mdash;");
      body += `<td class="${p.recommended ? "recommended-col" : ""}">${cellContent}</td>`;
    });
    body += `</tr>`;
  });

  let priceRow = `<tr class="total-row"><td>${opts.priceLabel}</td>`;
  providers.forEach((p) => {
    priceRow += `<td class="${p.recommended ? "recommended-col" : ""}">${fmt(opts.getPrice(p))}</td>`;
  });
  priceRow += `</tr>`;

  let btnRow = `<tr><td></td>`;
  providers.forEach((p) => {
    if (p.more) {
      btnRow += `<td class="${p.recommended ? "recommended-col" : ""}"><a class="view-all-link" href="${goHref(offer.id, p.name)}">View All Deals</a></td>`;
    } else {
      btnRow += `<td class="${p.recommended ? "recommended-col" : ""}">
        <a class="book-btn ${p.recommended ? "" : "ghost"}" href="${goHref(offer.id, p.name)}">${opts.btnLabel}</a>
      </td>`;
    }
  });
  btnRow += `</tr>`;

  return `<div class="compare-wrap">
    <div class="compare-label">Compare prices across 10+ ${opts.siteWord}</div>
    <div style="overflow-x:auto">
      <table class="compare-table">
        <thead>${thead}</thead>
        <tbody>${body}${priceRow}${btnRow}</tbody>
      </table>
    </div>
  </div>`;
}

/* ---------------- FLIGHTS ---------------- */
function renderFlightCard(offer) {
  const best = offer.providers.find((p) => p.recommended) || offer.providers[0];
  const table = buildCompareTable(offer, {
    siteWord: "sites",
    priceLabel: "Total Price",
    btnLabel: "View Deal",
    getPrice: (p) => p.price,
    rows: [
      { label: "Checked Baggage", type: "text", getValue: () => offer.baggage },
      { label: "Carry-on", type: "text", getValue: () => offer.carryOn },
      { label: "Free Cancellation", type: "check", getValue: (p) => !!p.freeCancellation },
      { label: "Price Guarantee", type: "check", getValue: (p) => !!p.priceGuarantee },
    ],
  });

  return `<article class="offer-card">
    <div class="offer-top">
      <div class="offer-media">&#9992;&#65039;</div>
      <div class="offer-info">
        <span class="offer-tag">${offer.airline} &middot; ${offer.flightNo} &middot; ${offer.cabin}</span>
        <div class="flight-route">
          <div class="flight-point"><div class="time">${offer.route.depart}</div><div class="code">${offer.route.fromCode}</div></div>
          <div class="flight-mid"><div class="line"></div>${offer.route.duration} &middot; ${offer.route.stops}</div>
          <div class="flight-point"><div class="time">${offer.route.arrive}</div><div class="code">${offer.route.toCode}</div></div>
        </div>
        <div class="offer-meta"><span>${offer.route.fromCity}</span><span>&rarr;</span><span>${offer.route.toCity}</span></div>
      </div>
      <div class="offer-price-box">
        <span class="from">Total Price</span>
        <div class="price">${fmt(best.price)}</div>
        <a class="book-btn" style="display:inline-block;width:auto;padding:10px 20px" href="${goHref(offer.id, best.name)}">View Deal</a>
      </div>
    </div>
    ${table}
  </article>`;
}

/* ---------------- STAYS ---------------- */
function renderStayCard(offer) {
  const best = offer.providers.find((p) => p.recommended) || offer.providers[0];
  const table = buildCompareTable(offer, {
    siteWord: "booking sites",
    priceLabel: `Total Price (${offer.nights} nights)`,
    btnLabel: "View Deal",
    getPrice: (p) => p.total,
    rows: [
      { label: "Free Cancellation", type: "check", getValue: (p) => !!p.freeCancellation },
      { label: "Free Breakfast", type: "check", getValue: (p) => !!p.freeBreakfast },
      { label: "Pay at Hotel", type: "check", getValue: (p) => !!p.payAtHotel },
      { label: "Wi-Fi", type: "check", getValue: (p) => !!p.wifi },
    ],
  });

  return `<article class="offer-card">
    <div class="offer-top">
      <div class="offer-media">&#127976;</div>
      <div class="offer-info">
        <span class="offer-tag">${offer.ratingLabel}</span>
        <div class="offer-title">${offer.name}</div>
        <div class="offer-meta"><span>${offer.location}</span></div>
        <div class="offer-meta">${offer.amenities.map((a) => `<span>${a}</span>`).join("")}</div>
      </div>
      <div class="offer-rating">
        <div>
          <div class="rating-badge">${offer.rating}</div>
        </div>
        <div class="rating-text"><b>${offer.ratingLabel}</b>${offer.reviews.toLocaleString()} reviews</div>
      </div>
      <div class="offer-price-box">
        <span class="from">Best price per night</span>
        <div class="price">${fmt(best.pricePerNight)}</div>
        <a class="book-btn" style="display:inline-block;width:auto;padding:10px 20px" href="${goHref(offer.id, best.name)}">View Deal</a>
      </div>
    </div>
    ${table}
  </article>`;
}

/* ---------------- CARS ---------------- */
function renderCarCard(offer) {
  const best = offer.providers.find((p) => p.recommended) || offer.providers[0];
  const table = buildCompareTable(offer, {
    siteWord: "car rental sites",
    priceLabel: "Total Price",
    btnLabel: "Book Now",
    getPrice: (p) => p.total,
    rows: [
      { label: "Free Cancellation", type: "check", getValue: (p) => !!p.freeCancellation },
      { label: "Unlimited Mileage", type: "check", getValue: (p) => !!p.unlimitedMileage },
      { label: "Collision Damage Waiver", type: "check", getValue: (p) => !!p.cdw },
      { label: "Theft Protection", type: "check", getValue: (p) => !!p.theftProtection },
      { label: "Third Party Liability", type: "check", getValue: (p) => !!p.thirdPartyLiability },
      { label: "Airport Shuttle", type: "check", getValue: (p) => !!p.airportShuttle },
    ],
  });

  return `<article class="offer-card">
    <div class="offer-top">
      <div class="offer-media">&#128664;</div>
      <div class="offer-info">
        <span class="offer-tag">${offer.type}</span>
        <div class="offer-title">${offer.name}</div>
        <div class="offer-meta">
          <span>&#128100; ${offer.seats} Seats</span>
          <span>&#128188; ${offer.bags} Bags</span>
          <span>&#9881;&#65039; ${offer.transmission}</span>
          <span>&#10052;&#65039; Air Conditioning</span>
        </div>
        <div class="offer-meta"><span>&#9989; ${offer.fuelPolicy} Fuel Policy</span></div>
      </div>
      <div class="offer-rating">
        ${offer.greatDeal ? '<span class="great-deal-pill">Great Deal</span><br>' : ""}
        <div class="rating-badge">${offer.rating}</div>
        <div class="rating-text"><b>${offer.ratingLabel}</b>${offer.reviews.toLocaleString()} reviews</div>
      </div>
      <div class="offer-price-box">
        <span class="from">Total price for ${offer.days} days</span>
        <div class="price">${fmt(best.total)}</div>
        <a class="book-btn" style="display:inline-block;width:auto;padding:10px 20px" href="${goHref(offer.id, best.name)}">View Details</a>
      </div>
    </div>
    ${table}
  </article>`;
}

/* ---------------- ESCAPES ---------------- */
function renderEscapeCard(offer) {
  const best = offer.providers.find((p) => p.recommended) || offer.providers[0];
  const table = buildCompareTable(offer, {
    siteWord: "sites",
    priceLabel: "Total Price (per person)",
    btnLabel: "View Deal",
    getPrice: (p) => p.price,
    rows: [
      { label: "Hotel + Flight", type: "check", getValue: () => true },
      { label: "Breakfast", type: "check", getValue: () => offer.perks.includes("Breakfast Included") },
      { label: "Airport Transfer", type: "check", getValue: () => offer.perks.includes("Airport Transfer") },
      { label: "Free Cancellation", type: "check", getValue: () => offer.perks.includes("Free Cancellation") },
    ],
  });

  return `<article class="offer-card escape-card">
    <div class="offer-top">
      <div class="offer-media">&#127967;&#65039;</div>
      <div class="escape-head-row">
        <div class="offer-info">
          ${offer.greatDeal ? '<span class="great-deal-pill">Great Deal</span><br>' : ""}
          <div class="offer-title">${offer.name}</div>
          <div class="offer-meta"><span>${offer.location}</span></div>
          <div class="stars">${"&#9733;".repeat(offer.stars)}</div>
          <div class="perk-row">${offer.perks.map((p) => `<span>${p}</span>`).join("")}<span>${offer.nights} Nights</span></div>
        </div>
        <div class="offer-price-box">
          <span class="from">Starting from</span>
          <div class="price">${fmt(best.price)}</div>
          <span class="per">per person</span>
          <div class="rating-text" style="margin-bottom:8px"><b>${offer.rating} &middot; ${offer.reviews.toLocaleString()} reviews</b></div>
          <a class="book-btn" style="display:inline-block;width:auto;padding:10px 20px" href="${goHref(offer.id, best.name)}">View Deal</a>
        </div>
      </div>
    </div>
    ${table}
  </article>`;
}

const RENDERERS = {
  flights: renderFlightCard,
  stays: renderStayCard,
  cars: renderCarCard,
  escapes: renderEscapeCard,
};

const COUNT_WORD = {
  flights: "flights found",
  stays: "properties found",
  cars: "cars found",
  escapes: "escapes found",
};

const loadedOffers = {};

function renderStayResults(offers) {
  const target = document.querySelector("#stays-list");
  const count = document.querySelector("#results-count");
  if (!target) return;
  const destination = (document.querySelector("#stay-destination")?.value || "").trim().toLowerCase();
  const sort = document.querySelector("#stays-sort")?.value || "recommended";
  let visible = offers.slice();
  if (destination) visible = visible.filter(o => (String(o.name || "") + " " + String(o.location || "")).toLowerCase().includes(destination));
  if (sort === "price-asc") visible.sort((a,b) => Math.min(...(a.providers || []).map(p => Number(p.total ?? p.price ?? Infinity))) - Math.min(...(b.providers || []).map(p => Number(p.total ?? p.price ?? Infinity))));
  if (sort === "rating-desc") visible.sort((a,b) => Number(b.rating || 0) - Number(a.rating || 0));
  target.innerHTML = visible.length ? visible.map(RENDERERS.stays).join("") : '<div style="padding:28px"><h3>No sample stays match this search</h3><p>Try “Dubai” or clear the destination. This prototype does not search live hotel inventory.</p></div>';
  if (count) { count.textContent = visible.length + " sample " + (visible.length === 1 ? "property" : "properties"); const note = document.createElement("span"); note.textContent = "Illustrative data only — taxes and availability are not verified"; count.appendChild(note); }
}

async function loadResults(type, targetSelector, countSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  const countEl = document.querySelector(countSelector);
  target.innerHTML = '<p style="padding:30px;color:var(--muted)">Loading sample offers…</p>';
  try {
    const res = await fetch("/api/offers?type=" + encodeURIComponent(type));
    if (!res.ok) throw new Error("Request failed (" + res.status + ")");
    const offers = await res.json();
    if (!Array.isArray(offers)) throw new Error("Unexpected response format");
    loadedOffers[type] = offers;
    if (type === "stays") { renderStayResults(offers); document.querySelector("#stays-sort")?.addEventListener("change", () => renderStayResults(loadedOffers.stays || [])); }
    else { target.innerHTML = offers.map(RENDERERS[type]).join(""); if (countEl) countEl.textContent = offers.length + " sample " + (COUNT_WORD[type] || "offers"); }
    const status = document.querySelector("#stays-status"); if (status && type === "stays") status.textContent = "Sample data loaded. Live provider inventory is not connected.";
  } catch (e) {
    target.innerHTML = '<div style="padding:28px"><h3>We couldn’t load sample offers</h3><p>Please try again in a moment. No live prices or availability are being shown.</p><button type="button" class="btn-primary" id="retry-stays">Try again</button></div>';
    document.querySelector("#retry-stays")?.addEventListener("click", () => loadResults(type, targetSelector, countSelector));
    if (countEl) countEl.textContent = "Offers unavailable";
  }
}

function wireSearchForm(formSelector) {
  const form = document.querySelector(formSelector);
  if (!form) return;
  const checkIn = form.elements.checkIn;
  const checkOut = form.elements.checkOut;
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10);
  if (checkIn) checkIn.min = today;
  if (checkOut) checkOut.min = today;
  checkIn?.addEventListener("change", () => { if (checkIn.value) { checkOut.min = checkIn.value; if (checkOut.value && checkOut.value <= checkIn.value) checkOut.value = ""; } });
  const params = new URLSearchParams(window.location.search);
  ["destination","checkIn","checkOut","guests"].forEach(key => { const field = form.elements[key]; if (field && params.has(key)) field.value = params.get(key); });
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (checkIn.value && checkOut.value && checkOut.value <= checkIn.value) { checkOut.setCustomValidity("Check-out must be after check-in."); checkOut.reportValidity(); checkOut.setCustomValidity(""); return; }
    const q = new URLSearchParams();
    ["destination","checkIn","checkOut","guests"].forEach(key => { const field = form.elements[key]; if (field && field.value) q.set(key, field.value.trim()); });
    window.history.replaceState({}, "", window.location.pathname + "?" + q.toString());
    if (loadedOffers.stays) renderStayResults(loadedOffers.stays);
    const status = document.querySelector("#stays-status"); if (status) status.textContent = "Showing matching sample listings only; live inventory search is not connected.";
    document.querySelector(".results-main")?.scrollIntoView({behavior:"smooth",block:"start"});
  });
}
function wireMobileNav() {
  const toggle = document.querySelector(".mobile-toggle");
  const nav = document.querySelector(".header-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

document.addEventListener("DOMContentLoaded", wireMobileNav);
