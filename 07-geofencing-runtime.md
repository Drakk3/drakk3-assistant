# drakk3-assistant — Geofencing Runtime

> **Status:** Canonical runtime behavior for the MVP

---

## 1. Runtime decision summary

- candidate detection happens on the client
- accepted transition decisions happen on the backend
- Haversine is used on both sides
- `zone_presence_state` prevents duplicate transitions
- `location_events` stores accepted transitions only

---

## 2. Inputs evaluated per location update

For each location update, the client evaluates:
- `latitude`
- `longitude`
- `accuracy_meters` if available
- update source: `foreground`, `background`, or `manual-test`
- all active zones

---

## 3. Distance and hysteresis rules

Each zone has:
- `radius_meters`
- `enter_buffer_meters` (default `15`)
- `exit_buffer_meters` (default `15`)

For a zone with radius `R`:
- **enter threshold** = `R - enter_buffer_meters`
- **exit threshold** = `R + exit_buffer_meters`

### Rules
- if previous state is `outside`, emit an `enter` candidate only when `distance <= enter threshold`
- if previous state is `inside`, emit an `exit` candidate only when `distance >= exit threshold`
- if distance stays inside the gray band between both thresholds, emit nothing and keep previous state

This is the canonical anti-flapping behavior.

---

## 4. Event lifecycle

### Step 1 — GPS update arrives
The device receives a foreground or background location update.

### Step 2 — Client evaluates active zones
The app computes Haversine distance for each active zone.

### Step 3 — Client emits candidate transitions only
The client may detect:
- no transition
- `enter` candidate
- `exit` candidate

The client does **not** create a canonical event record directly.

### Step 4 — Client calls backend contract
The app sends the candidate payload to the transition Edge Function.

### Step 5 — Backend validates candidate
The backend re-computes distance, loads zone config, checks `zone_presence_state`, and applies the same hysteresis thresholds.

### Step 6 — Backend decides outcome
Possible outcomes:
- `accepted` — valid transition; event persisted
- `ignored_duplicate` — same state already recorded
- `ignored_hysteresis` — still in gray band / no valid threshold crossing
- `rejected_invalid_zone` — zone missing or inactive
- `rejected_invalid_payload` — malformed request

### Step 7 — Backend persists and dispatches
If accepted:
- insert `location_events`
- update `zone_presence_state`
- trigger `mock` or `alexa` dispatch
- update `dispatch_status`

---

## 5. Idempotency and duplicate protection

### Idempotency key
- every client transition request must include `client_event_id` (UUID)
- `location_events.client_event_id` is unique

### Duplicate prevention layers
1. client only submits candidate transitions, not every location point
2. backend checks current `zone_presence_state`
3. backend enforces unique `client_event_id`

If a request is retried with the same `client_event_id`, the backend returns the original outcome instead of creating a second event.

---

## 6. Cooldown rule

Accepted transitions for the same `user_id + zone_id` must respect a minimum cooldown of **30 seconds**.

If a second opposite-state candidate arrives before cooldown expires:
- backend returns `ignored_duplicate` unless the hysteresis threshold is clearly crossed and the previous event is older than cooldown

This is intentionally conservative for MVP stability.

---

## 7. Failure behavior

### If client-side candidate evaluation fails
- do not emit a transition
- log error through shared error handling

### If backend validation fails
- do not mutate canonical state
- return explicit error code

### If event persistence fails
- treat request as failed
- do not update local accepted state based on assumption alone

### If Alexa/mock dispatch fails after event persistence
- keep the event record
- set `dispatch_status = 'failed'`
- store error text in `dispatch_error`

The event ledger and integration delivery are related, but not identical responsibilities.

---

## 8. Canonical request contract

```json
{
  "client_event_id": "uuid",
  "zone_id": "uuid",
  "event_type": "enter | exit",
  "latitude": 0,
  "longitude": 0,
  "accuracy_meters": 0,
  "event_source": "foreground | background | manual-test",
  "occurred_at": "ISO-8601 timestamp"
}
```

---

## 9. Canonical response contract

```json
{
  "result": "accepted | ignored_duplicate | ignored_hysteresis | rejected_invalid_zone | rejected_invalid_payload",
  "event_id": "uuid | null",
  "dispatch_status": "pending | mocked | sent | failed | skipped | null",
  "message": "human-readable summary"
}
```

---

## 10. What must NOT happen

- client must not insert directly into `location_events`
- client must not be the source of truth for current inside/outside state
- mixed Haversine-on-client and Turf-on-server logic must not be reintroduced in MVP
- gray-band jitter must not create enter/exit oscillation
