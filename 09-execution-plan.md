# drakk3-assistant — Execution Plan

> **Status:** Closed planning handoff to implementation

---

## 1. Planning completion state

The project is now planning-complete for the MVP.

The next implementation ticket is:

## `TKT-010 — Bootstrap app structure and configuration layer`

---

## 2. Recommended implementation sequence

### Phase A — Foundation
1. `TKT-010` Bootstrap app structure and config layer
2. `TKT-011` Auth shell and route guards
3. `TKT-012` Shared UI primitives

### Phase B — Geofencing core
4. `TKT-013` Geofencing domain layer
5. `TKT-014` Background location and zone detection hooks

### Phase C — Admin operations
6. `TKT-015` Admin zone management flow
7. `TKT-016` Event history and operational visibility

### Phase D — Integration and validation
8. `TKT-017` Event persistence and Alexa/mock flow
9. `TKT-018` End-to-end MVP validation

---

## 3. Definition of ready per ticket group

### `TKT-010` is ready because
- folder structure is frozen in `01-architecture.md`
- config/token requirements are frozen in `03-design-system.md`
- naming and dependency rules are frozen in `04-code-conventions.md`

### `TKT-011` is ready because
- auth scope is frozen in `06-mvp-scope.md`
- profile provisioning is frozen in `02-data-model.md` and `08-backend-foundation.md`

### `TKT-013` and `TKT-014` are ready because
- geofencing ownership is frozen
- runtime lifecycle is frozen
- anti-flapping and idempotency rules are frozen

### `TKT-015` to `TKT-017` are ready because
- schema is frozen
- trigger contract is frozen
- event visibility fields are already defined

---

## 4. Suggested implementation deliverables

### Phase A output
- `src/` scaffold
- config tokens
- Supabase client singleton
- route groups and auth guard
- shared primitives

### Phase B output
- geofencing services
- zone detection hooks
- background task wiring
- transition API client wrapper

### Phase C output
- zone CRUD screens
- event history screen
- loading/empty/error states

### Phase D output
- working Edge Function
- persisted accepted transitions
- provider dispatch status visible in UI
- manual validation checklist executed

---

## 5. Freeze rules for implementation

During coding, do not reopen these decisions casually:
- no groups in MVP
- no Turf.js in MVP
- no direct client insert into `location_events`
- no second design-system source of truth

If one of these needs to change, it is a planning change, not an implementation shortcut.

---

## 6. Final handoff statement

From a planning perspective, the repository is ready to start coding from `TKT-010`.

The only recommended pre-code check is a quick human review for wording preference, not for missing technical closure.
