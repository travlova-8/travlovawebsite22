const { neon } = require("@neondatabase/serverless");
const { hashPassword } = require("./password");

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const error = new Error("DATABASE_URL is not configured");
    error.code = "AUTH_DATABASE_NOT_CONFIGURED";
    throw error;
  }
  return neon(connectionString);
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

async function createUser({ fullName, email, country, password }) {
  const sql = getSql();
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  const rows = await sql`
    INSERT INTO users (full_name, email, country, password_hash)
    VALUES (${fullName.trim()}, ${normalizedEmail}, ${country}, ${passwordHash})
    RETURNING id, full_name, email, country, created_at
  `;

  return rows[0];
}

async function findUserByEmail(email) {
  const sql = getSql();
  const normalizedEmail = normalizeEmail(email);
  const rows = await sql`
    SELECT id, full_name, email, country, password_hash, email_verified_at,
           session_version, is_active, created_at
    FROM users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `;
  return rows[0] || null;
}

module.exports = { createUser, findUserByEmail, normalizeEmail };
