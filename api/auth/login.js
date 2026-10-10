// Fail-closed until persistent user storage, password hashing, and secure sessions are configured.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Use POST" });
  }
  return res.status(503).json({
    message: "Sign-in is not available yet. Please try again later."
  });
};
