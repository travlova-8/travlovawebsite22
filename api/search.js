// Demo search API. It filters the current sample data only; it is not live hotel/flight inventory.
const offers = require("../data/offers.json");
const ALLOWED = new Set(["flights","stays","cars","escapes"]);
function validDate(value) { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
module.exports = function handler(req, res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Travlova-Data-Mode","demo");
  if (req.method !== "GET") return res.status(405).json({error:"Use GET",demo:true});
  const q = req.query || {};
  const type = typeof q.type === "string" ? q.type : "";
  if (!ALLOWED.has(type)) return res.status(400).json({error:"type must be flights, stays, cars or escapes",demo:true});
  const start = q.checkIn || q.pickupDate || q.departDate;
  const end = q.checkOut || q.dropoffDate || q.returnDate;
  if (start && !validDate(start)) return res.status(400).json({error:"Invalid start date",demo:true});
  if (end && !validDate(end)) return res.status(400).json({error:"Invalid end date",demo:true});
  if (start && start < new Date().toISOString().slice(0,10)) return res.status(400).json({error:"Dates must not be in the past",demo:true});
  if (start && end && end <= start) return res.status(400).json({error:"End date must be after start date",demo:true});
  const destination = String(q.destination || q.pickupLocation || q.departureCity || "").trim().toLowerCase();
  const origin = String(q.origin || "").trim().toLowerCase();
  let results = offers[type].slice();
  if (destination) results = results.filter(item => {
    const route = item.route || {};
    const haystack = [item.name,item.location,item.type,item.destination,route.toCity,route.toCode,route.to].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(destination);
  });
  if (origin && type === "flights") results = results.filter(item => {
    const route = item.route || {};
    return [route.fromCity,route.fromCode,route.from].filter(Boolean).join(" ").toLowerCase().includes(origin);
  });
  return res.status(200).json({demo:true,source:"data/offers.json",liveInventory:false,query:{type,...q},count:results.length,results});
};
