# Travlova

Travlova is a travel metasearch prototype for Flights, Stays, Cars and Quick Escapes. Current inventory in `data/offers.json` is **mock data**. It is not a source of live prices, confirmed availability, or real bookings.

## Run locally

Requires Node.js 18+ and no external npm dependencies:

```bash
node server.js
```

Open `http://localhost:3000`.

## API endpoints

### 1. Demo search

- **Method:** `GET`
- **Local URL:** `http://localhost:3000/api/search`
- **Vercel URL:** `https://YOUR_DEPLOYMENT_DOMAIN/api/search`
- **Purpose:** Validates search dates and filters sample records in `data/offers.json`. It does not call partner inventory APIs.

Examples:

```http
GET /api/search?type=stays&destination=Dubai&checkIn=2026-11-10&checkOut=2026-11-14&adults=2&rooms=1
GET /api/search?type=flights&origin=Cairo&destination=Dubai&departDate=2026-11-10&returnDate=2026-11-14&passengers=2
GET /api/search?type=cars&pickupLocation=Dubai&pickupDate=2026-11-10&dropoffDate=2026-11-14&pickupTime=10%3A00&dropoffTime=10%3A00
GET /api/search?type=escapes&departureCity=Cairo&departDate=2026-11-10&returnDate=2026-11-13&budget=500
```

Success response shape:

```json
{
  "demo": true,
  "source": "data/offers.json",
  "liveInventory": false,
  "query": { "type": "stays" },
  "count": 4,
  "results": []
}
```

The dates above are request examples only. Search rejects malformed dates, past start dates and end dates that are not after start dates. Supported types: `flights`, `stays`, `cars`, `escapes`.

### 2. Demo registration validation

- **Method:** `POST`
- **Local URL:** `http://localhost:3000/api/signup`
- **Vercel URL:** `https://YOUR_DEPLOYMENT_DOMAIN/api/signup`
- **Content-Type:** `application/json`

Example request:

```json
{
  "fullName": "Example Traveller",
  "email": "traveller@example.com",
  "country": "DE",
  "password": "Use-a-unique-demo-password-123",
  "termsAccepted": true
}
```

This endpoint validates the fields and returns a demo response. It does **not** create an account, store the email, hash/store the password, or implement authentication. Do not use a real or reused password. Production signup requires a real identity/authentication provider, database, email verification, rate limiting, abuse protection, and reviewed privacy/security practices.

### 3. Existing offers endpoint

- **Method:** `GET`
- **URL:** `/api/offers?type=stays` (also flights, cars, escapes)
- **Source:** `data/offers.json`
- **Status:** mock/sample data only.

### 4. Existing click log

- **Method:** `GET`
- **URL:** `/api/clicks`
- **Note:** Local JSON-file logging is for prototype testing only; move to a database and review privacy/retention before launch.

## Currency and language controls

Currency options: USD, EUR, GBP, EGP, RUB, PLN, HUF and BYN. They are intended to cover the current target markets. The current display conversion rates are fixed demo values in `public/js/app.js`, not live foreign-exchange rates; do not use them for accounting or quote final booking prices. Language preference options: English, German, Russian, Hungarian, Belarusian, Polish, Italian and Arabic. The preference is saved locally, but full translation is not yet implemented.

## Security note\n\nThe local `/api/clicks` endpoint is protected by the `TRAVLOVA_ADMIN_TOKEN` environment variable and returns 404 unless an `Authorization: Bearer <token>` header matches. Set a long random secret in your server environment; never put it in frontend code or commit it. This local-server protection does not automatically protect any separately deployed serverless route.\n\n## Deployment / integration

The Vercel-style API handlers are in `api/search.js`, `api/signup.js`, and `api/offers.js`. The no-dependency local server implements matching demo routes in `server.js`. Replace mock search data with approved provider APIs only after affiliate/API access is granted, and keep API keys on the server in environment variables. Never put partner secrets in frontend JavaScript.
