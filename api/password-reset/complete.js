// Fail-closed placeholder: do not simulate successful password recovery.
// Wire this route to a persistent user store, atomic OTP store, mail provider,
// rate limiter, password hasher, and session-revocation service before launch.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Use POST" });
  }
  return res.status(503).json({
    message: "Account recovery is not available yet. Please try again later."
  });
};
