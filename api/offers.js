// Vercel serverless endpoint for Travlova prototype offers.
// These records are illustrative mock data, not live inventory or bookable prices.
const offers = require("../data/offers.json");

module.exports = function handler(req, res) {
  const type = typeof req.query.type === "string" ? req.query.type : "";
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Travlova-Data-Mode", "demo");

  if (type && !Object.prototype.hasOwnProperty.call(offers, type)) {
    return res.status(400).json({ error: "Unsupported offer type" });
  }

  return res.status(200).json(type ? offers[type] : offers);
};
