# drakk3-assistant

Planning-first repository for the drakk3 mobile assistant MVP.

## Current status

Documentation is now the canonical source of truth for the MVP and the technical backlog up to implementation start.

**Implementation start point:** `TKT-010 — Bootstrap app structure and configuration layer`

## Canonical documentation index

### Core product and architecture
- `01-architecture.md` — canonical runtime architecture and layer boundaries
- `02-data-model.md` — final MVP schema, constraints, RLS, provisioning decisions
- `03-design-system.md` — single visual source of truth
- `04-code-conventions.md` — implementation conventions and code rules
- `05-technical-backlog.md` — backlog with ticket status, dependencies, and document traceability

### Planning closure documents
- `06-mvp-scope.md` — frozen MVP scope (`IN` / `OUT`)
- `07-geofencing-runtime.md` — canonical event lifecycle, anti-flapping, retries, ownership
- `08-backend-foundation.md` — backend contracts, profile provisioning, Edge Function boundary, types
- `09-execution-plan.md` — execution batches, definition of done, and coding sequence from `TKT-010`

### Context documents
- `master-app-context-en.md` — aligned project context summary in English

### Deprecated
- `drakk3ai-design-system.md` — deprecated; kept only as pointer to `03-design-system.md`
- `AGENTS.md` — operational policy for AI/code review, **not** product or architecture spec

## MVP summary

The frozen MVP includes:
- Admin authentication
- Admin zone CRUD
- Circle-based geofencing (`enter` / `exit`)
- Persisted `location_events`
- Alexa integration behind a mockable backend contract

The MVP explicitly defers:
- General-user app flows
- Groups and sharing model
- Granular `user_permissions`
- Realtime map presence
- Multi-module expansion

## Reading order before coding

1. `06-mvp-scope.md`
2. `01-architecture.md`
3. `07-geofencing-runtime.md`
4. `02-data-model.md`
5. `08-backend-foundation.md`
6. `03-design-system.md`
7. `04-code-conventions.md`
8. `05-technical-backlog.md`
9. `09-execution-plan.md`
