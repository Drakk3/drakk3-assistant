export const QUERY_KEYS = {
  adminEvents: ['admin', 'events'],
  adminOperationalState: ['admin', 'operational-state'],
  adminZones: ['admin', 'zones'],
  authProfile: ['auth', 'profile'],
  geofencingPresence: ['geofencing', 'presence'],
  geofencingZones: ['geofencing', 'zones'],
} as const;

export const STORAGE_KEYS = {
  themePreference: 'drakk3-assistant:theme-preference',
} as const;

export const LOCATION_TASK_NAME = 'DRAKK3_GEOFENCING_LOCATION_TASK';

export const ROUTES = {
  login: '/(auth)/login',
  adminHome: '/(admin)',
  adminZones: '/(admin)/zones',
  adminEvents: '/(admin)/events',
} as const;
