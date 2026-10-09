// Demo-only registration endpoint. Never stores the submitted password or creates an account.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRIES = new Set(["EG","DE","RU","HU","BY","PL","IT","GB","OTHER"]);
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Travlova-Data-Mode","demo");
  if (req.method !== "POST") return res.status(405).json({demo:true,message:"Use POST"});
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({demo:true,message:"Invalid JSON body"}); } }
  if (!body || typeof body !== "object") return res.status(400).json({demo:true,message:"A JSON body is required"});
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const country = typeof body.country === "string" ? body.country : "";
  if (fullName.length < 2 || fullName.length > 80) return res.status(400).json({demo:true,message:"Full name must be 2–80 characters"});
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({demo:true,message:"Enter a valid email address"});
  if (!COUNTRIES.has(country)) return res.status(400).json({demo:true,message:"Choose a supported country"});
  if (password.length < 12 || password.length > 128) return res.status(400).json({demo:true,message:"Password must be 12–128 characters"});
  if (body.termsAccepted !== true) return res.status(400).json({demo:true,message:"Please accept the Terms of Service"});
  // Do not log, hash, save, or return the password: this endpoint is a validation mock only.
  return res.status(200).json({demo:true,accountCreated:false,message:"Validation successful. Production account creation is not enabled; no account or password was saved."});
};
