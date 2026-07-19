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

Planned example: `UserPublicDTO { username, honestyScore, isLowTrust }`.
