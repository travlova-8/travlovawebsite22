# Travlova Preview authentication setup (Phase 1)

This phase adds persistent user records and Argon2id password hashing. It does **not** yet issue login sessions, verify email addresses, or enable password recovery. The sign-in endpoint intentionally remains disabled until session management is implemented.

## Repository changes

- `lib/auth/user-repository.js`: Neon-backed user creation and lookup.
- `lib/auth/password.js`: Argon2id hashing and verification helpers.
- `db/migrations/001_create_users.sql`: initial `users` table and normalized unique email constraint.
- `api/signup.js`: validates signup input and persists a user; it never stores or returns a plaintext password.
- `server.js`: matching local signup route.
- `test/auth-foundation.test.js`: password policy, hash verification, and email normalization tests.

## Configure Neon for Preview only

1. Open Neon and create a **separate Preview/development project or branch**. Do not use production customer data for this test.
2. In Neon, open **SQL Editor** for that Preview branch and run the complete SQL in `db/migrations/001_create_users.sql`. Confirm the `users` table exists.
3. Copy the connection string from that same Preview branch. Prefer Neon's pooled connection string for serverless use, keep SSL enabled, and do not paste it into source files or chat.
4. In Vercel, open the Travlova project → **Settings → Environment Variables**. Add `DATABASE_URL` with the Preview branch connection string, selecting **Preview** only. If Vercel lets you target a specific preview branch, restrict it to this feature branch.
5. Redeploy the feature branch Preview after saving the environment variable; environment changes do not retroactively update an already-built deployment.
6. Locally, copy `.env.example` to `.env`, set `DATABASE_URL` to a development-only Neon connection string, and keep `.env` untracked. Run `npm install`, then `npm test`, then `npm start`.

## Preview smoke test

- Submit a valid new account at `/signup.html` using a unique test email and a unique test password.
- Expect HTTP 201 and a message that account creation succeeded, while `authenticated` remains `false`.
- In the Neon Preview SQL Editor, run `SELECT id, full_name, email, country, password_hash, created_at FROM users ORDER BY created_at DESC LIMIT 5;`.
- Confirm the password column contains an `$argon2id$` hash, not the submitted password.
- Submit the same email again: expect HTTP 409 and no duplicate row.
- Try an invalid password or missing consent: expect HTTP 400 and no new row.
- Verify sign-in still returns HTTP 503. That is intentional until Phase 2 implements sessions and CSRF-safe cookie handling.

## Secrets and data safety

- Never commit `.env`, a Neon connection string, passwords, or session secrets. `.env.example` contains placeholders only.
- Keep this database isolated to Preview and delete test accounts/data when no longer needed.
- The unique email constraint handles concurrent duplicate registrations safely. Database errors are returned as generic messages; request bodies and passwords are not logged.

## Not yet implemented

- Session issuance, secure cookies, CSRF protections, and session revocation.
- Email verification and transactional email delivery.
- OTP storage, atomic one-time consumption, and distributed rate limiting.
- Full integration tests against an isolated test database and CI execution.

Do not merge or advertise the whole authentication system as complete based only on this phase.
