## What

<!-- Summary of the change -->

## Data Minimization & Leak Prevention gate

Required for every PR touching an API response, logging, or error handling
(see `docs/plan/criticseven-modernization-plan.md`, Standing Requirement):

- [ ] Every API response goes through an explicit-allowlist DTO in `server/serializers/` — no raw model documents or upstream payloads sent to the client, no select-minus/denylist shaping
- [ ] No email, password/auth-code hashes, raw `HonestyLog` entries, or internal `_id` (where a public id suffices) in any response
- [ ] Error responses: generic message + error code only in production; full detail stays in server logs (central `errorHandler`, no per-route `res.status(500).send(error.message)`)
- [ ] No `console.log`/`console.error` of request bodies, user objects, auth codes, or raw upstream errors (axios errors embed the TMDB `api_key`)
- [ ] Request logging (morgan) does not log bodies; `/auth/*` URLs are logged without query strings

Auth routes only (Phase 3+):

- [ ] `POST /auth/verify-code` response never echoes the submitted or stored code
- [ ] `POST /auth/request-code` returns the identical response whether or not the email exists (no account enumeration)
