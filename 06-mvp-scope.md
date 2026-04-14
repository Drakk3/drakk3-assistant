# drakk3-assistant — MVP Scope

> **Status:** Frozen for implementation start

---

## 1. Product statement

Ship the smallest admin-first geofencing loop that proves the product works end to end.

That loop is:
1. admin logs in
2. admin creates or updates a zone
3. device receives a location update
4. system detects `enter` or `exit`
5. backend persists the event
6. backend dispatches Alexa or mock integration
7. admin can inspect the event history

---

## 2. IN scope

### Authentication
- Supabase email/password auth
- session persistence
- admin route guard

### Zone management
- list zones
- create zone
- edit zone
- activate/deactivate zone
- configure one Alexa trigger per zone

### Geofencing
- circle zones only
- background location updates
- `enter` / `exit` candidate detection on device
- backend validation and dedupe
- persisted event history

### Integrations
- stable backend trigger contract
- provider mode `mock` or `alexa`

### Admin visibility
- event history screen
- basic delivery status visibility from `location_events.dispatch_status`

---

## 3. OUT of scope

### Users and collaboration
- general-user app flow
- invitations
- groups and memberships
- user-to-user notifications
- granular `user_permissions`

### Geospatial expansion
- polygons
- GeoJSON imports
- Turf.js runtime
- map-based drawing tools

### Operational expansion
- realtime live map presence
- push notification fanout
- analytics dashboards
- retry workers / queues beyond simple retry-safe contracts

### Platform expansion
- module registry
- feature modules beyond geofencing

---

## 4. MVP constraints

- one geometry model: Haversine
- one zone shape: circle
- one visual source of truth: `03-design-system.md`
- one runtime authority for accepted transitions: backend processing path

---

## 5. Success criteria

The MVP is considered successful when:
- the admin can authenticate
- the admin can manage zones without schema ambiguity
- a valid location update can produce an accepted `enter` or `exit`
- the event is visible in history
- Alexa/mock dispatch result is observable

---

## 6. Explicit deferral note

Anything outside this file is not implicitly included just because older docs mentioned it.

If a future implementation needs groups, user flows, or polygon geofencing, that must enter as a new planning change.
