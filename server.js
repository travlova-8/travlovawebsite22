/**
 * Travlova — backend
 * --------------------------------------------------------------
 * Zero external dependencies on purpose: this runs with nothing
 * but `node server.js`. When you're ready to go live, this file
 * is small enough to lift into Express on Render/Railway as-is.
 *
 * What's real:
 *   - /go/:offerId/:provider   the actual affiliate redirect model
 *   - click logging            every redirect is logged before it fires
 *   - static file serving      the whole public/ site
 *
 * What's still mock (see Travlova-Project-Full-Guide):
 *   - data/offers.json         swap this for real partner API calls
 *   - data/clicks.json         swap this for Postgres before launch
 * --------------------------------------------------------------
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");

const OFFERS = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "offers.json"), "utf8"));
const AFFILIATE_CONFIG = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "affiliateConfig.json"), "utf8"));
const CLICKS_PATH = path.join(DATA_DIR, "clicks.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJSON(res, status, data) {
  send(res, status, JSON.stringify(data), { "Content-Type": "application/json; charset=utf-8" });
}

function findOfferById(offerId) {
  for (const category of Object.keys(OFFERS)) {
    const hit = OFFERS[category].find((o) => o.id === offerId);
    if (hit) return { category, offer: hit };
  }
  return null;
}

/**
 * Appends one click record to data/clicks.json BEFORE the redirect fires.
 * Mirrors logClick() from the guide's server.js snippet.
 */
function logClick({ offerId, category, provider, price, ip, userAgent }) {
  let clicks = [];
  try {
    clicks = JSON.parse(fs.readFileSync(CLICKS_PATH, "utf8"));
  } catch (e) {
    clicks = [];
  }
  clicks.push({
    clickId: `clk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    offerId,
    category,
    provider,
    price,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  });
  fs.writeFile(CLICKS_PATH, JSON.stringify(clicks, null, 2), () => {});
}

/**
 * GET /go/:offerId/:provider  — the heart of the affiliate model.
 * 1) look up the offer + the chosen provider's row
 * 2) log the click BEFORE redirecting
 * 3) attach YOUR affiliate id server-side (never exposed to the page)
 * 4) 302 redirect straight to the partner
 */
function handleGo(req, res, offerId, providerName) {
  const found = findOfferById(offerId);
  if (!found) return send(res, 404, "Deal not found");

  const { category, offer } = found;
  const providerRow = offer.providers.find((p) => p.name === decodeURIComponent(providerName));
  if (!providerRow) return send(res, 404, "Deal not found");

  // The row that actually books is either this provider, or — when the
  // visitor clicks Travlova's own "Best Price" button — whichever real
  // partner is holding that best price (targetProvider).
  const bookingPartner = providerRow.targetProvider || providerRow.name;
  const cfg = AFFILIATE_CONFIG[bookingPartner] || AFFILIATE_CONFIG.default;

  logClick({
    offerId,
    category,
    provider: bookingPartner,
    price: providerRow.price || providerRow.total || providerRow.pricePerNight,
    ip: req.socket.remoteAddress,
    userAgent: req.headers["user-agent"] || "",
  });

  const target = new URL(cfg.domain);
  target.searchParams.set(cfg.param, cfg.id);
  target.searchParams.set("utm_source", "travlova");
  target.searchParams.set("utm_medium", "metasearch");

  res.writeHead(302, { Location: target.toString() });
  res.end();
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname);

  // Prevent path traversal outside of public/
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Friendly fallback: try adding .html (so /privacy-policy works too)
      const htmlAttempt = filePath + ".html";
      fs.readFile(htmlAttempt, (err2, data) => {
        if (err2) return send(res, 404, "<h1>404</h1><p>Page not found. <a href='/'>Go home</a></p>", { "Content-Type": "text/html" });
        send(res, 200, data, { "Content-Type": "text/html; charset=utf-8" });
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (err2, data) => {
      if (err2) return send(res, 500, "Server error");
      send(res, 200, data, { "Content-Type": MIME[ext] || "application/octet-stream" });
    });
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  // --- API: mock offers (this is the line that becomes a real partner API call later) ---
  if (pathname === "/api/offers") {
    const type = parsed.query.type;
    if (type && OFFERS[type]) return sendJSON(res, 200, OFFERS[type]);
    return sendJSON(res, 200, OFFERS);
  }

  // --- API: click log, for your own reconciliation against partner dashboards ---
  if (pathname === "/api/clicks") {
    try {
      const clicks = JSON.parse(fs.readFileSync(CLICKS_PATH, "utf8"));
      return sendJSON(res, 200, clicks);
    } catch (e) {
      return sendJSON(res, 200, []);
    }
  }

  // --- The affiliate redirect itself: /go/flt-1/Booking.com ---
  const goMatch = pathname.match(/^\/go\/([^/]+)\/([^/]+)$/);
  if (goMatch) {
    return handleGo(req, res, goMatch[1], goMatch[2]);
  }

  return serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Travlova running → http://localhost:${PORT}`);
});
