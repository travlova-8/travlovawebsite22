const test = require("node:test");
const assert = require("node:assert/strict");
const { validatePassword, hashPassword, verifyPassword } = require("../lib/auth/password");
const { normalizeEmail } = require("../lib/auth/user-repository");

test("password policy requires 12 to 128 characters", () => {
  assert.match(validatePassword("short"), /12/);
  assert.equal(validatePassword("correct-horse-battery"), null);
  assert.match(validatePassword("x".repeat(129)), /128/);
});

test("password hashes are Argon2id and verify only the correct password", async () => {
  const password = "Travlova-preview-password-2026";
  const hash = await hashPassword(password);
  assert.match(hash, /^\$argon2id\$/);
  assert.equal(await verifyPassword(hash, password), true);
  assert.equal(await verifyPassword(hash, "wrong-password-2026"), false);
  assert.notEqual(await hashPassword(password), hash, "each hash should use a fresh random salt");
});

test("email normalization trims and lowercases", () => {
  assert.equal(normalizeEmail("  Traveller@Example.COM "), "traveller@example.com");
});
