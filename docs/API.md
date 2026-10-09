# Travlova Demo API Reference

All endpoints below are **prototype/demo only**. They do not query real booking providers, confirm inventory, or create user accounts.

## Base URL

- Local: `http://localhost:3000` after running `node server.js`
- Hosted: `https://YOUR_DEPLOYMENT_DOMAIN`

## Search sample offers

`GET /api/search?type=stays&destination=Dubai&checkIn=2026-11-10&checkOut=2026-11-14&adults=2&rooms=1`

Allowed `type` values: `flights`, `stays`, `cars`, `escapes`.

Search examples:
- Flights: `/api/search?type=flights&origin=Cairo%20(CAI)&destination=Dubai%20(DXB)&departDate=2026-11-10&returnDate=2026-11-14&passengers=2`
- Stays: `/api/search?type=stays&destination=Dubai&checkIn=2026-11-10&checkOut=2026-11-14&adults=2&rooms=1`
- Cars: `/api/search?type=cars&pickupLocation=Dubai%20International%20Airport&pickupDate=2026-11-10&pickupTime=10%3A00&dropoffDate=2026-11-10&dropoffTime=18%3A00&driverAge=30`
- Escapes: `/api/search?type=escapes&departureCity=Cairo&departDate=2026-11-10&returnDate=2026-11-13&tripDuration=3&budget=500`

The endpoint checks date formats, rejects past dates, and validates return/drop-off order. Same-day car hire is allowed only when drop-off time is after pick-up time. Search results come from `data/offers.json`.

Example response:

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

## Validate registration form

`POST /api/signup`

Header: `Content-Type: application/json`

```json
{
  "fullName": "Example Traveller",
  "email": "traveller@example.com",
  "country": "DE",
  "password": "Use-a-unique-demo-password-123",
  "termsAccepted": true
}
```

This only validates the form. It does not save users or passwords, and it does not issue sessions or authenticate anyone. Never use a real/reused password in this demo. Before production, integrate an authentication provider and secure persistence, email verification, abuse protection, and privacy controls.

## Existing sample-offers endpoint

- `GET /api/offers?type=stays`
- `GET /api/offers?type=flights`
- `GET /api/offers?type=cars`
- `GET /api/offers?type=escapes`

## Integration checklist

1. Apply for and receive approval for each partner's API/affiliate program.
2. Implement provider-specific server-side adapters and keep credentials in deployment environment variables.
3. Normalize property identity, dates, occupancy, currency, taxes/fees, cancellation rules, and final redirect URLs.
4. Replace sample results only when live partner responses have been verified.
5. Add automated tests, rate limits, request logging without secrets, monitoring, and a privacy-reviewed analytics store.
