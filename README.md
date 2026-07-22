# CriticSeven

CriticSeven is a free, community-driven movie review platform. No ads, no fees, non-commercial.

Every movie carries two separate kinds of user contribution, kept strictly apart: **Trailer Opinions** (rated before watching, tagged "unseen") and **Reviews** (rated after watching, across seven criteria — plot, acting, writing, score, directing, editing, cinematography). Every user has an honesty score shaped by community votes on their opinions and reviews, with real consequences: a low-trust badge on their contributions, and reduced weight on the votes they cast.

## Tech stack

- **Client:** React Router v8 in framework mode (server-side rendering). This is the same architecture previously called "Remix" — Remix and React Router merged in 2024, so framework mode is that architecture under React Router's own name. It is unrelated to the separate "Remix v3" rewrite (forked Preact, dropped React). React 19, Mantine, TypeScript (strict), Vite.
- **Server:** Express, Mongoose 8, MongoDB.
- **Workspace:** pnpm workspace (root + `client/`).
- **Movie data:** [TMDB API](https://www.themoviedb.org/documentation/api). This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
- **Bot protection:** Cloudflare Turnstile, verified server-side before an auth code is issued.
- **Image caching (optional):** Cloudflare Images, proxying and caching movie posters and backdrops. Falls back to direct TMDB image URLs when unconfigured.

## Getting started

Prerequisites: Node >= 20, pnpm >= 9, a running local MongoDB instance.

```
git clone <repo-url>
cd criticseven
pnpm install
cp .env.example .env
```

Fill in `.env` — every variable is documented inline in `.env.example`.

Run everything (server + client) at once:

```
pnpm start:dev
```

Or run each piece separately, in two terminals: `pnpm dev` (builds and runs the Express server) and `pnpm client` (React Router dev server).

## Checks

Run these in the foreground — this repo's background test runs have been flaky.

```
pnpm exec tsc --noEmit                      # server typecheck
pnpm --filter criticseven-client typecheck  # client typecheck
pnpm lint                                   # eslint, whole repo
pnpm test                                   # jest — server only, no client test runner yet
```

The root `pnpm typecheck` script runs both typechecks in sequence, if you want one command.

## Project structure

```
server/
  actions/           route handlers — business logic per request
  routes/            Express router wiring, one file per resource
  serializers/       response DTOs — every API response is shaped here (see serializers/README.md)
  database/models/   Mongoose schemas
  lib/               framework-agnostic logic (honesty score, rate limiting, session verification, ...)

client/src/
  routes/            React Router route modules (loaders, actions, page components)
  features/          feature-specific components, grouped by domain (e.g. movies/)
  ui/                reusable presentational components, shared across features
  helpers/           shared pure utility functions
```

`ui/` must never import from `features/` — the dependency runs one way (features consume `ui/`, never the reverse), enforced by eslint (`no-restricted-imports`).

## Architecture notes

- **Data minimization:** every API response goes through an explicit field allowlist — a `to<Name>DTO()` function per response shape, never the raw document. See `server/serializers/README.md`.
- **Auth:** passwordless, email plus a one-time code. The session is a signed, httpOnly cookie, verified independently on both the React Router server and Express — `SESSION_SECRET` must be the identical value in both processes.
- **Honesty score:** a time-decayed weighted average of vote-linked log entries, clamped to 0–100. Each vote's weight is snapshotted from the voter's honesty score at the moment they cast it, and is never recomputed if they later change or remove the vote.

## License

Non-commercial hobby project. No license has been chosen yet.
