# drakk3-assistant — Technical Backlog

> **Version:** 2.0  
> **Status:** Planning closed through `TKT-009`

---

## 1. Backlog objective

Turn the product direction into a build-ready sequence with no major ambiguities before coding starts.

---

## 2. Current planning status

### Documentation closed
- `TKT-001` to `TKT-009`

### Implementation queue
- `TKT-010` to `TKT-018`

### Implementation start recommendation
- start with `TKT-010`
- do **not** reopen scope, geofencing ownership, or schema unless a new change request is approved

---

## 3. Ticket traceability

| Ticket | Title | Status | Canonical output |
|---|---|---|---|
| `TKT-001` | Close MVP scope | Closed | `06-mvp-scope.md` |
| `TKT-002` | Define canonical geofencing architecture | Closed | `01-architecture.md`, `07-geofencing-runtime.md` |
| `TKT-003` | Define event lifecycle and anti-flapping rules | Closed | `07-geofencing-runtime.md` |
| `TKT-004` | Unify the design system source of truth | Closed | `03-design-system.md`, `drakk3ai-design-system.md` |
| `TKT-005` | Finalize MVP database schema | Closed | `02-data-model.md` |
| `TKT-006` | Define and implement RLS strategy | Closed at planning level | `02-data-model.md`, `08-backend-foundation.md` |
| `TKT-007` | Define profile provisioning flow | Closed | `02-data-model.md`, `08-backend-foundation.md` |
| `TKT-008` | Define Alexa integration contract | Closed | `08-backend-foundation.md` |
| `TKT-009` | Generate backend types and shared contracts | Closed at planning level | `08-backend-foundation.md` |
| `TKT-010` | Bootstrap app structure and configuration layer | Ready for implementation | `01-architecture.md`, `03-design-system.md`, `04-code-conventions.md`, `09-execution-plan.md` |
| `TKT-011` | Implement auth shell and route guards | Ready after `TKT-010` | `01-architecture.md`, `08-backend-foundation.md` |
| `TKT-012` | Build shared UI primitives | Ready after `TKT-010` | `03-design-system.md`, `04-code-conventions.md` |
| `TKT-013` | Implement geofencing domain layer | Ready after `TKT-010` | `01-architecture.md`, `07-geofencing-runtime.md` |
| `TKT-014` | Implement background location and zone detection hooks | Ready after `TKT-013` | `07-geofencing-runtime.md` |
| `TKT-015` | Build admin zone management flow | Ready after `TKT-011`, `TKT-012`, `TKT-013` | `06-mvp-scope.md`, `02-data-model.md` |
| `TKT-016` | Build event history and operational visibility | Ready after `TKT-011`, `TKT-013` | `02-data-model.md`, `07-geofencing-runtime.md` |
| `TKT-017` | Connect event persistence and Alexa trigger flow | Ready after `TKT-008`, `TKT-014`, `TKT-015` | `07-geofencing-runtime.md`, `08-backend-foundation.md` |
| `TKT-018` | Run MVP end-to-end validation | Ready after `TKT-017` | `09-execution-plan.md` |

---

## 4. Ticket-by-ticket closure notes

### `TKT-001 — Close MVP scope`
**Decision closed:** MVP is admin-first and excludes groups, granular permissions, realtime presence, and multi-module work.

### `TKT-002 — Define canonical geofencing architecture`
**Decision closed:** client detects candidate transitions; backend validates and persists; Haversine is used on both sides for circle zones.

### `TKT-003 — Define event lifecycle and anti-flapping rules`
**Decision closed:** server-side `zone_presence_state`, hysteresis buffers, cooldown window, and idempotent `client_event_id` are required.

### `TKT-004 — Unify the design system source of truth`
**Decision closed:** `03-design-system.md` is canonical; `drakk3ai-design-system.md` is deprecated.

### `TKT-005 — Finalize MVP database schema`
**Decision closed:** schema reduced to MVP tables only and expanded with `zone_presence_state` for runtime correctness.

### `TKT-006 — Define RLS strategy`
**Decision closed:** admin reads/writes interactive tables directly; transition/event writes happen through backend processing, not direct client inserts.

### `TKT-007 — Define profile provisioning flow`
**Decision closed:** create admin auth user during bootstrap and auto-provision `profiles` via database trigger.

### `TKT-008 — Define Alexa integration contract`
**Decision closed:** backend contract supports `mock` and `alexa` providers without changing client behavior.

### `TKT-009 — Generate backend types and shared contracts`
**Decision closed:** generated Supabase types are the base contract; hand-written domain wrappers are optional.

---

## 5. Execution order

### Batch 1 — Start coding foundation
- `TKT-010`
- `TKT-011`
- `TKT-012`

### Batch 2 — Geofencing core
- `TKT-013`
- `TKT-014`

### Batch 3 — Admin operations
- `TKT-015`
- `TKT-016`

### Batch 4 — Integration and validation
- `TKT-017`
- `TKT-018`

---

## 6. Guardrails before implementation

Before coding any ticket from `TKT-010` onward, the implementer must treat these as frozen unless a new planning change is approved:
- MVP scope
- geofencing ownership model
- table list and schema
- design-system source of truth
- Edge Function contract boundary
