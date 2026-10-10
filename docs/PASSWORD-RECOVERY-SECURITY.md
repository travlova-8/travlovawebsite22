# Password recovery security plan

## Repository findings

The current project is a Node.js static-site prototype. `POST /api/signup` validates fields only: it deliberately does not create accounts, persist passwords, issue sessions, or authenticate users. There is no user database, password-hashing implementation, email provider, Redis/cache, or session/refresh-token store in the current repository. Therefore a production password-reset flow cannot safely be activated just by adding a form.

## Security requirements for the production adapter

- Return the same generic request response whether an email exists or not.
- Generate six-digit codes with Node's `crypto.randomInt` (CSPRNG); never `Math.random`.
- One active code per user and purpose. Issuing a replacement invalidates the previous code.
- Store only a keyed digest/HMAC of the OTP; a plain hash alone is weak because six-digit codes have a small search space. Keep the HMAC secret outside source control.
- Expire codes after five minutes; allow at most five verification attempts; consume on first successful use.
- Apply distributed rate limits to normalized account/email, source IP, and where appropriate session/device. Enforce a resend cooldown (e.g. 60 seconds).
- Make verification and consumption atomic (e.g. a Redis Lua script or a transactional database update); never implement read/verify/mark-used as separate raceable operations.
- On successful verification issue a random, short-lived, single-use reset token scoped to the user and `password_reset` purpose. Store only its digest; do not accept the OTP as a password-reset credential.
- Enforce the state machine on the server. The frontend must not be trusted to enforce step order.
- Hash new passwords with a modern password-hashing algorithm (Argon2id preferred; use a vetted library and calibrated parameters).
- In the same transaction as password update, invalidate the reset token and revoke existing sessions/refresh tokens (or bump a per-user token/session version checked by every refresh).
- Never log OTPs, reset tokens, passwords, or email-provider request bodies. Use `Cache-Control: no-store` and TLS.
- Notify the account email after a successful password change. Add security tests for enumeration, expiration, attempts, resend invalidation, purpose binding, replay, race conditions, and old-session revocation.

## Current state of this PR

The page provides the account-recovery UX and calls the intended API contract. The API handlers deliberately fail closed until a real user store, distributed atomic store/rate limiter, password hasher, mail sender, and session revocation mechanism are wired in. Do not advertise account recovery as production-ready until those dependencies and tests are implemented. This is intentional: an in-memory demo or a fake success response would violate the security requirements above.
