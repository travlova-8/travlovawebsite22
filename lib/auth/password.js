const argon2 = require("argon2");

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

function validatePassword(password) {
  if (typeof password !== "string") return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`;
  }
  return null;
}

async function hashPassword(password) {
  const error = validatePassword(password);
  if (error) {
    const err = new Error(error);
    err.code = "INVALID_PASSWORD";
    throw err;
  }

  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });
}

async function verifyPassword(passwordHash, password) {
  if (typeof passwordHash !== "string" || typeof password !== "string") return false;
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

module.exports = { validatePassword, hashPassword, verifyPassword };
