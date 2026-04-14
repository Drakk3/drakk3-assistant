export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: 'admin';
          theme_preference: 'green' | 'violet';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role?: 'admin';
          theme_preference?: 'green' | 'violet';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          theme_preference?: 'green' | 'violet';
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      zones: {
        Row: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          radius_meters: number;
          enter_buffer_meters: number;
          exit_buffer_meters: number;
          is_active: boolean;
          alexa_enabled: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          latitude: number;
          longitude: number;
          radius_meters: number;
          enter_buffer_meters?: number;
          exit_buffer_meters?: number;
          is_active?: boolean;
          alexa_enabled?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          latitude?: number;
          longitude?: number;
          radius_meters?: number;
          enter_buffer_meters?: number;
          exit_buffer_meters?: number;
          is_active?: boolean;
          alexa_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      alexa_triggers: {
        Row: {
          id: string;
          zone_id: string;
          provider: 'mock' | 'alexa';
          message_template: string;
          target_device: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          zone_id: string;
          provider?: 'mock' | 'alexa';
          message_template: string;
          target_device?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: 'mock' | 'alexa';
          message_template?: string;
          target_device?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      zone_presence_state: {
        Row: {
          user_id: string;
          zone_id: string;
          current_state: 'inside' | 'outside';
          last_event_type: 'enter' | 'exit' | null;
          last_event_at: string | null;
          last_distance_meters: number | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          zone_id: string;
          current_state: 'inside' | 'outside';
          last_event_type?: 'enter' | 'exit' | null;
          last_event_at?: string | null;
          last_distance_meters?: number | null;
          updated_at?: string;
        };
        Update: {
          current_state?: 'inside' | 'outside';
          last_event_type?: 'enter' | 'exit' | null;
          last_event_at?: string | null;
          last_distance_meters?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      location_events: {
        Row: {
          id: string;
          client_event_id: string;
          user_id: string;
          zone_id: string;
          event_type: 'enter' | 'exit';
          latitude: number;
          longitude: number;
          accuracy_meters: number | null;
          distance_meters: number;
          event_source: 'foreground' | 'background' | 'manual-test';
          dispatch_status: 'pending' | 'mocked' | 'sent' | 'failed' | 'skipped';
          dispatch_error: string | null;
          triggered_at: string;
          processed_at: string;
        };
        Insert: {
          id?: string;
          client_event_id: string;
          user_id: string;
          zone_id: string;
          event_type: 'enter' | 'exit';
          latitude: number;
          longitude: number;
          accuracy_meters?: number | null;
          distance_meters: number;
          event_source: 'foreground' | 'background' | 'manual-test';
          dispatch_status?: 'pending' | 'mocked' | 'sent' | 'failed' | 'skipped';
          dispatch_error?: string | null;
          triggered_at?: string;
          processed_at?: string;
        };
        Update: {
          dispatch_status?: 'pending' | 'mocked' | 'sent' | 'failed' | 'skipped';
          dispatch_error?: string | null;
          processed_at?: string;
        };
        Relationships: [];
      };
    };
  };
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type AlexaTriggerRow = Database['public']['Tables']['alexa_triggers']['Row'];
export type ZoneRow = Database['public']['Tables']['zones']['Row'];
export type ZonePresenceStateRow = Database['public']['Tables']['zone_presence_state']['Row'];
export type LocationEventRow = Database['public']['Tables']['location_events']['Row'];
