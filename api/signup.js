// Persistent account creation for the Travlova Preview environment.
const { createUser } = require("../lib/auth/user-repository");
const { validatePassword } = require("../lib/auth/password");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRIES = new Set(["EG","DE","RU","HU","BY","PL","IT","GB","OTHER"]);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Use POST" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const country = typeof body.country === "string" ? body.country : "";

  if (fullName.length < 2 || fullName.length > 80) {
    return res.status(400).json({ message: "Full name must be 2–80 characters" });
  }
  if (email.length > 254 || !EMAIL.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }
  if (!COUNTRIES.has(country)) {
    return res.status(400).json({ message: "Choose a supported country" });
  }
  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ message: passwordError });
  if (body.termsAccepted !== true) {
    return res.status(400).json({ message: "Please accept the Terms of Service" });
  }

  try {
    const user = await createUser({ fullName, email, country, password });
    return res.status(201).json({
      accountCreated: true,
      authenticated: false,
      message: "Your account was created. Sign-in will be enabled after secure sessions are configured.",
      user: { id: user.id, fullName: user.full_name, email: user.email, country: user.country }
    });
  } catch (error) {
    if (error && error.code === "23505") {
      return res.status(409).json({ message: "An account with this email may already exist. Try signing in or recovering your account." });
    }
    if (error && error.code === "AUTH_DATABASE_NOT_CONFIGURED") {
      return res.status(503).json({ message: "Account creation is not configured for this Preview deployment yet." });
    }
    // Do not log request bodies, email addresses, or password material.
    console.error("Travlova account creation failed", error && error.code ? { code: error.code } : { code: "UNKNOWN" });
    return res.status(503).json({ message: "We could not create your account right now. Please try again later." });
  }
};
