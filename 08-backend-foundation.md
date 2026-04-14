# drakk3-assistant — Backend Foundation

> **Status:** Canonical backend planning for MVP

---

## 1. Backend responsibilities

The backend owns three things in the MVP:
- authentication and profile provisioning
- transition validation and event persistence
- Alexa/mock dispatch

---

## 2. Auth and profile provisioning

### Chosen bootstrap strategy
- create the initial admin account manually in Supabase Auth for each environment
- auto-create `profiles` row through a database trigger on `auth.users`

### Why
- removes ambiguity before `TKT-011`
- avoids temporary manual SQL inserts for `profiles`
- keeps auth and domain identity linked from day one

### Trigger behavior
On new `auth.users` row:
- insert matching `profiles.id`
- set `display_name` from metadata if present, otherwise fallback to email prefix
- set `role = 'admin'`
- set `theme_preference = 'green'`
- set `is_active = true`

---

## 3. Transition processing contract

### Chosen boundary
Use one Edge Function for the full MVP transition workflow:

`process-zone-transition`

### Responsibilities
- authenticate request
- validate payload
- load zone definition
- compute Haversine distance
- apply hysteresis and cooldown
- persist accepted event
- update `zone_presence_state`
- dispatch provider adapter
- return deterministic response

### Why one function
- smaller implementation surface for MVP
- easier to test end to end
- fewer moving parts before first ship

### Tradeoff
- less modular than splitting processing and provider dispatch
- acceptable because only one integration path exists in MVP

---

## 4. Provider adapter contract

The Edge Function must call a provider adapter with this internal shape:

```ts
interface TriggerDispatchInput {
  eventId: string;
  zoneId: string;
  eventType: 'enter' | 'exit';
  displayName: string;
  messageTemplate: string;
  targetDevice: string | null;
}

interface TriggerDispatchResult {
  status: 'mocked' | 'sent' | 'failed' | 'skipped';
  errorMessage?: string;
}
```

### Provider modes
- `mock` — always available in local/dev environments
- `alexa` — real provider for environments with credentials configured

### Rule
The client never needs to know which provider mode is active.

---

## 5. Message template resolution

Templates are stored in `alexa_triggers.message_template`.

MVP supported placeholder set:
- `{name}`
- `{zone}`
- `{event}`

Example:
- template: `"{name} entered {zone}"`
- resolved: `"David entered Home"`

Unsupported placeholders are left unchanged in MVP and should be documented, not silently removed.

---

## 6. Failure and retry expectations

### Request retry
- client may retry the Edge Function call with the same `client_event_id`
- backend must remain idempotent

### Provider retry
- no background queue in MVP
- provider failures update `dispatch_status = 'failed'`
- retry is manual or via future enhancement

### Why
- enough operational clarity for MVP
- avoids inventing a queueing subsystem before first product validation

---

## 7. Generated types

### Canonical rule
`shared/types/database.ts` must be generated from Supabase after migrations exist.

### Minimum generated coverage
- `profiles`
- `zones`
- `alexa_triggers`
- `zone_presence_state`
- `location_events`

### Domain wrappers
Feature-level types may exist, but they must intentionally map to the generated base contract.

---

## 8. Environment contract

The implementation phase should expect at least these environment values:

### Client
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Edge Function / backend
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALEXA_PROVIDER_MODE`
- `ALEXA_API_KEY` or provider-specific secrets when real Alexa mode is enabled

---

## 9. Ready-for-code checklist

The backend foundation is considered planning-complete because these decisions are now closed:
- profile provisioning strategy
- one-function transition boundary
- provider adapter contract
- idempotent retry behavior
- generated types as canonical base contract
