# CriticSeven — agent instructions

## Checks (run ALL before declaring any task done, FOREGROUND only —
background runner hangs on mongodb-memory-server)
- `pnpm exec tsc --noEmit` (server typecheck)
- `pnpm --filter criticseven-client typecheck` (client typecheck)
- `pnpm lint`
- `pnpm test`

## Code style
- No abbreviations anywhere: full words for functions, variables,
  parameters (`accumulate` not `acc`). Exceptions: auth (URL contract),
  third-party names (Tmdb), framework conventions (req/res don't
  exist here — full names already).
- Filenames kebab-case. Exceptions: React components (Navbar.tsx)
  and Mongoose models (User.ts) stay PascalCase.
- No comments that restate code. Comments only for "why":
  non-obvious invariants, security decisions, workarounds.

## Architecture rules
- Every API response goes through a DTO allowlist — see
  server/serializers/README.md. Never return raw documents.
  Never expose email, phoneNumberHash, or raw HonestyLog reasons.
- client/src/ui/ never imports from client/src/features/
  (eslint-enforced).
- Session verified independently on BOTH Express and the React
  Router server. SESSION_SECRET identical in both processes.
  userId/voterId always from session, never from request body.
- voterWeightAtVote is snapshotted at cast time, never recomputed.
- No PII in logs. Generic error messages to clients in production.

## Workflow
- Scope report before mechanical changes (renames, mass edits).
- Hold for commit approval — never push without the word.
- Separate commits for security fixes vs style changes.
- Framework is React Router v8 framework mode. NOT Remix 3
  (unrelated Preact rewrite — never install it).

## Plan
- docs/plan/criticseven-modernization-plan.md
