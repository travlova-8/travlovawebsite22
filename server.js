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


function readJSONBody(req, maxBytes = 16384) {
  return new Promise((resolve, reject) => {
    let raw = "", bytes = 0;
    req.on("data", chunk => {
      bytes += chunk.length;
      if (bytes > maxBytes) { reject(new Error("BODY_TOO_LARGE")); req.destroy(); return; }
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new Error("INVALID_JSON")); }
    });
    req.on("error", reject);
  });
}
function validISODate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
function matchesAny(item, query) {
  const route = item.route || {};
  const haystack = [item.name,item.location,item.type,item.destination,route.toCity,route.toCode,route.to,route.fromCity,route.fromCode,route.from].filter(Boolean).join(" ").toLowerCase();
  const tokens = String(query).replace(/\([^)]*\)/g, " ").split(/[^a-z0-9]+/i).filter(Boolean);
  return tokens.length === 0 || tokens.some(token => haystack.includes(token));
}
function demoSearch(type, query) {
  const allowed = ["flights","stays","cars","escapes"];
  if (!allowed.includes(type)) return { status:400, body:{demo:true,error:"type must be flights, stays, cars or escapes"} };
  const start = query.checkIn || query.pickupDate || query.departDate;
  const end = query.checkOut || query.dropoffDate || query.returnDate;
  if (start && !validISODate(start)) return {status:400,body:{demo:true,error:"Invalid start date"}};
  if (end && !validISODate(end)) return {status:400,body:{demo:true,error:"Invalid end date"}};
  if (start && start < new Date().toISOString().slice(0,10)) return {status:400,body:{demo:true,error:"Dates must not be in the past"}};
  if (start && end && (type === "cars" ? end < start : end <= start)) return {status:400,body:{demo:true,error:"End date must be after start date"}};
  if (type === "cars" && start === end && query.pickupTime && query.dropoffTime && query.dropoffTime <= query.pickupTime) return {status:400,body:{demo:true,error:"Drop-off time must be later than pick-up time"}};
  const destination = String(query.destination || (type === "cars" ? "" : type === "escapes" ? "" : query.departureCity) || "").trim().toLowerCase();
  const origin = String(query.origin || "").trim().toLowerCase();
  let results = OFFERS[type].slice();
  if (destination && type !== "cars") results = results.filter(item => matchesAny(item,destination));
  if (origin && type === "flights") results = results.filter(item => {
    const route = item.route || {};
    return matchesAny({route},origin);
  });
  return {status:200,body:{demo:true,source:"data/offers.json",liveInventory:false,query:{type,...query},count:results.length,results}};
}
function validateDemoSignup(body) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const country = typeof body.country === "string" ? body.country : "";
  if (fullName.length < 2 || fullName.length > 80) return "Full name must be 2–80 characters";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  if (!["EG","DE","RU","HU","BY","PL","IT","GB","OTHER"].includes(country)) return "Choose a supported country";
  if (password.length < 12 || password.length > 128) return "Password must be 12–128 characters";
  if (body.termsAccepted !== true) return "Please accept the Terms of Service";
  return null;
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

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  if (pathname === "/api/search") {
    res.setHeader("X-Travlova-Data-Mode", "demo");
    if (req.method !== "GET") return sendJSON(res,405,{demo:true,error:"Use GET"});
    const result = demoSearch(String(parsed.query.type || ""), parsed.query);
    return sendJSON(res,result.status,result.body);
  }

  if (pathname.startsWith("/api/password-reset/")) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    if (req.method !== "POST") return sendJSON(res, 405, { message: "Use POST" });
    // Fail closed until a persistent user store, atomic OTP store, mailer,
    // password hasher and session-revocation adapter are configured.
    return sendJSON(res, 503, { message: "Account recovery is not available yet. Please try again later." });
  }

  if (pathname === "/api/signup") {
    res.setHeader("X-Travlova-Data-Mode", "demo");
    if (req.method !== "POST") return sendJSON(res,405,{demo:true,message:"Use POST"});
    try {
      const body = await readJSONBody(req);
      const error = validateDemoSignup(body);
      if (error) return sendJSON(res,400,{demo:true,accountCreated:false,message:error});
      return sendJSON(res,200,{demo:true,accountCreated:false,message:"Validation successful. Production account creation is not enabled; no account or password was saved."});
    } catch (error) {
      const status = error.message === "BODY_TOO_LARGE" ? 413 : 400;
      return sendJSON(res,status,{demo:true,message:status === 413 ? "Request body too large" : "Invalid JSON body"});
    }
  }

  // --- API: mock offers (this is the line that becomes a real partner API call later) ---
  if (pathname === "/api/offers") {
    const type = parsed.query.type;
    if (type && !Object.prototype.hasOwnProperty.call(OFFERS, type)) return sendJSON(res, 400, {error:"Unsupported offer type"});
    if (type) return sendJSON(res, 200, OFFERS[type]);
    return sendJSON(res, 200, OFFERS);
  }

  // --- Private click log: never expose visitor IP addresses/user agents publicly ---
  if (pathname === "/api/clicks") {
    const expected = process.env.TRAVLOVA_ADMIN_TOKEN;
    const supplied = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!expected || !supplied || supplied !== expected) return sendJSON(res, 404, {error:"Not found"});
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
