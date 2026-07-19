# ui/

Reusable presentational components shared across features (e.g. RatingInput, Badge, vote buttons).

Rule: `ui/` must never import from `features/` — the dependency is one-way (features consume ui, not the reverse). Enforced by eslint (`no-restricted-imports`).
