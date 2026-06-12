export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  marketing: {
    Tables: {
      content_posts: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      content_campaigns: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      content_assets: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      content_comments: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      content_post_error_logs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      linkedin_post_insights: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      platforms: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      integration_credentials: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      sync_runs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      read_vault_secret: { Args: { p_name: string }; Returns: string };
      store_vault_secret: {
        Args: { p_name: string; p_secret: string; p_description?: string | null };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          attempt_count: number;
          locked_until: string | null;
          lockout_count: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          attempt_count?: number;
          locked_until?: string | null;
          lockout_count?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          attempt_count?: number;
          locked_until?: string | null;
          lockout_count?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          ip_address: unknown;
          metadata: Json | null;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      departments: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          responsible_id: string | null;
          responsible_name: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          responsible_id?: string | null;
          responsible_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["departments"]["Insert"]>;
        Relationships: [];
      };
      email_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          id: string;
          recipient: string;
          related_user_id: string | null;
          sent_at: string | null;
          status: string;
          subject: string | null;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          recipient: string;
          related_user_id?: string | null;
          sent_at?: string | null;
          status: string;
          subject?: string | null;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_logs"]["Insert"]>;
        Relationships: [];
      };
      login_attempts: {
        Row: {
          created_at: string | null;
          email: string;
          failure_reason: string | null;
          id: string;
          ip_address: unknown;
          success: boolean;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: unknown;
          success: boolean;
          user_agent?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["login_attempts"]["Insert"]>;
        Relationships: [];
      };
      modules: {
        Row: {
          created_at: string | null;
          description: string | null;
          display_order: number;
          icon: string | null;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          display_order?: number;
          icon?: string | null;
          id?: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["modules"]["Insert"]>;
        Relationships: [];
      };
      password_reset_tokens: {
        Row: {
          created_at: string | null;
          expires_at: string;
          id: string;
          requested_by: string | null;
          token_hash: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at: string;
          id?: string;
          requested_by?: string | null;
          token_hash: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["password_reset_tokens"]["Insert"]>;
        Relationships: [];
      };
      permissions: {
        Row: { action: string; id: string; module_id: string };
        Insert: { action: string; id?: string; module_id: string };
        Update: Partial<Database["public"]["Tables"]["permissions"]["Insert"]>;
        Relationships: [];
      };
      positions: {
        Row: {
          created_at: string | null;
          department_id: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          department_id?: string | null;
          id?: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["positions"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          address: Json | null;
          admission_date: string | null;
          avatar_url: string | null;
          birth_date: string | null;
          created_at: string | null;
          created_by: string | null;
          deactivated_at: string | null;
          deactivated_by: string | null;
          department_id: string | null;
          email: string;
          full_name: string;
          id: string;
          language: string | null;
          last_login_at: string | null;
          manager_id: string | null;
          must_change_password: boolean | null;
          password_changed_at: string | null;
          phone: string | null;
          position_id: string | null;
          registration_number: string;
          role_id: string;
          status: string;
          theme_preference: string | null;
          updated_at: string | null;
          whatsapp: string | null;
        };
        Insert: {
          address?: Json | null;
          admission_date?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deactivated_at?: string | null;
          deactivated_by?: string | null;
          department_id?: string | null;
          email: string;
          full_name: string;
          id: string;
          language?: string | null;
          last_login_at?: string | null;
          manager_id?: string | null;
          must_change_password?: boolean | null;
          password_changed_at?: string | null;
          phone?: string | null;
          position_id?: string | null;
          registration_number: string;
          role_id: string;
          status?: string;
          theme_preference?: string | null;
          updated_at?: string | null;
          whatsapp?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      role_permissions: {
        Row: { permission_id: string; role_id: string };
        Insert: { permission_id: string; role_id: string };
        Update: Partial<Database["public"]["Tables"]["role_permissions"]["Insert"]>;
        Relationships: [];
      };
      roles: {
        Row: {
          created_at: string | null;
          description: string | null;
          hierarchy_level: number;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          hierarchy_level: number;
          id?: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      user_module_access: {
        Row: {
          created_at: string | null;
          granted_by: string | null;
          module_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          granted_by?: string | null;
          module_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_module_access"]["Insert"]>;
        Relationships: [];
      };
      user_permissions: {
        Row: {
          created_at: string | null;
          granted: boolean;
          granted_by: string | null;
          permission_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          granted?: boolean;
          granted_by?: string | null;
          permission_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_permissions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role_level: { Args: Record<string, never>; Returns: number };
      has_permission: {
        Args: { p_action: string; p_module_slug: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
