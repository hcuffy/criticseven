# Serializers (response DTOs)

Every API response is shaped here before it leaves the server — explicit field
allowlist per response type, never "full document minus a few deleted fields".
See "Standing Requirement — Data Minimization & Leak Prevention" in
`docs/plan/criticseven-modernization-plan.md`.

Rules for adding a DTO when a new model gets an API response (User,
TrailerOpinion, Review, Vote, etc. in Phase 2+):

- One exported `to<Name>DTO()` function per response shape; name every field.
- Never include: email on public payloads (username is the public identity),
  password/auth-code hashes, raw `HonestyLog` entries, internal `_id` where a
  public id suffices, or `Config` values beyond the public thresholds.
- Route handlers call the DTO before `response.send()` — raw model documents
  and raw upstream API payloads must not be sent directly.

Example (built in Phase 3, `createdAt` added in Phase 5/4 for the profile
page's "member since"): `UserPublicDTO { username, honestyScore, isLowTrust,
isPhoneVerified, createdAt }` — `isPhoneVerified` feeds a future "Verified"
badge the same way `isLowTrust` feeds the low-trust badge (opposite signal,
same DTO-exposure pattern). `phoneNumberHash` never appears here — like
auth-code hashes, it's not something the client needs.

Built in Phase 2 (schema): `MoviePublicDTO`, `TrailerOpinionPublicDTO`,
`ReviewPublicDTO`, `VotePublicDTO`, `ConfigPublicDTO`. Notes specific to
these:

- `MoviePublicDTO` drops `metadata` — it's an opaque cached upstream blob,
  not a curated response shape.
- `VotePublicDTO` drops `voterId` — a public listing that names the voter on
  every vote is the same "who voted on what" deanonymization risk the
  `HonestyLog` rule above rules out, just at the Vote level instead.
- `HonestyLog` has no DTO at all — it is never sent to the client in any
  shape, per the rule above.
- `ConfigPublicDTO` exposes exactly `lowTrustBadgeThreshold` and
  `voteWeightFloor` — the two fields the rule above allowlists from `Config`.

Built in Phase 4 (image service): `MovieSummaryDTO`/`MovieDetailsDTO`'s
`poster_path`/`backdrop_path` are resolved through
`server/lib/image-service.ts` before they leave this file — they are full,
ready-to-use `<img src>` URLs, not TMDB-relative path fragments the way TMDB
itself returns them. Any component consuming these fields should render them
directly, not prepend a TMDB image base URL.
