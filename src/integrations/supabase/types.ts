export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: string | null
          id: string
          superadmin_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          superadmin_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          superadmin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_superadmin_id_fkey"
            columns: ["superadmin_id"]
            isOneToOne: false
            referencedRelation: "superadmin"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_reply: boolean | null
          message: string
          parent_id: string | null
          read: boolean | null
          recipient_id: string | null
          recipient_name: string | null
          recipient_type: string
          reply_count: number | null
          sender_id: string
          sender_name: string
          sender_type: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_reply?: boolean | null
          message: string
          parent_id?: string | null
          read?: boolean | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type: string
          reply_count?: number | null
          sender_id: string
          sender_name: string
          sender_type: string
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_reply?: boolean | null
          message?: string
          parent_id?: string | null
          read?: boolean | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: string
          reply_count?: number | null
          sender_id?: string
          sender_name?: string
          sender_type?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_security_audit: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_security_audit_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "superadmin"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_profiles: {
        Row: {
          categories: string[] | null
          created_at: string | null
          email: string | null
          id: string
          last_login: string | null
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string | null
          original_id: string | null
          permissions: string[] | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          user_type: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_login?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id?: string | null
          original_id?: string | null
          permissions?: string[] | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_type: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_login?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string | null
          original_id?: string | null
          permissions?: string[] | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      categorie: {
        Row: {
          id: string
          nom: string
        }
        Insert: {
          id?: string
          nom: string
        }
        Update: {
          id?: string
          nom?: string
        }
        Relationships: []
      }
      categorie_organization: {
        Row: {
          categorie_id: string
          organization_id: string
        }
        Insert: {
          categorie_id: string
          organization_id: string
        }
        Update: {
          categorie_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorie_organization_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categorie"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorie_organization_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          ip_address: unknown | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
          user_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
          user_type: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      messagerie: {
        Row: {
          created_at: string | null
          id: string
          is_reply: boolean | null
          message: string
          parent_id: string | null
          read: boolean | null
          recipient_id: string | null
          recipient_name: string | null
          recipient_type: string
          reply_count: number | null
          sender_id: string
          sender_name: string
          sender_type: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_reply?: boolean | null
          message: string
          parent_id?: string | null
          read?: boolean | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type: string
          reply_count?: number | null
          sender_id: string
          sender_name: string
          sender_type: string
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_reply?: boolean | null
          message?: string
          parent_id?: string | null
          read?: boolean | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: string
          reply_count?: number | null
          sender_id?: string
          sender_name?: string
          sender_type?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messagerie"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          anonymous_code: string | null
          created_at: string | null
          id: string
          message: string
          population_id: string | null
          read: boolean | null
          report_id: string | null
          title: string
          type: string | null
        }
        Insert: {
          anonymous_code?: string | null
          created_at?: string | null
          id?: string
          message: string
          population_id?: string | null
          read?: boolean | null
          report_id?: string | null
          title: string
          type?: string | null
        }
        Update: {
          anonymous_code?: string | null
          created_at?: string | null
          id?: string
          message?: string
          population_id?: string | null
          read?: boolean | null
          report_id?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_population_id_fkey"
            columns: ["population_id"]
            isOneToOne: false
            referencedRelation: "population"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          ip_address: unknown | null
          organization_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          approved_at: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string | null
          permissions: string[] | null
          phone: string | null
          status: string | null
          supabase_user_id: string | null
          type: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password_hash?: string | null
          permissions?: string[] | null
          phone?: string | null
          status?: string | null
          supabase_user_id?: string | null
          type: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string | null
          permissions?: string[] | null
          phone?: string | null
          status?: string | null
          supabase_user_id?: string | null
          type?: string
        }
        Relationships: []
      }
      population: {
        Row: {
          auth_code: string | null
          created_at: string | null
          id: string
          last_activity: string | null
          name: string | null
          phone: string | null
          status: string | null
          supabase_user_id: string | null
        }
        Insert: {
          auth_code?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          name?: string | null
          phone?: string | null
          status?: string | null
          supabase_user_id?: string | null
        }
        Update: {
          auth_code?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          name?: string | null
          phone?: string | null
          status?: string | null
          supabase_user_id?: string | null
        }
        Relationships: []
      }
      report_assignments: {
        Row: {
          admin_id: string | null
          assigned_at: string | null
          assigned_by: string | null
          id: string
          notes: string | null
          report_id: string | null
          status: string | null
        }
        Insert: {
          admin_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          notes?: string | null
          report_id?: string | null
          status?: string | null
        }
        Update: {
          admin_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          notes?: string | null
          report_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_assignments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          actual_resolution_time: unknown | null
          address: string | null
          anonymous_code: string | null
          anonymous_name: string | null
          anonymous_phone: string | null
          assigned_admin_id: string | null
          assigned_organization_id: string | null
          audio_url: string | null
          citizen_satisfaction_rating: number | null
          created_at: string | null
          department: string | null
          description: string
          estimated_resolution_time: unknown | null
          id: string
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          population_id: string | null
          priority: string | null
          resolution_notes: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          actual_resolution_time?: unknown | null
          address?: string | null
          anonymous_code?: string | null
          anonymous_name?: string | null
          anonymous_phone?: string | null
          assigned_admin_id?: string | null
          assigned_organization_id?: string | null
          audio_url?: string | null
          citizen_satisfaction_rating?: number | null
          created_at?: string | null
          department?: string | null
          description: string
          estimated_resolution_time?: unknown | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          population_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          actual_resolution_time?: unknown | null
          address?: string | null
          anonymous_code?: string | null
          anonymous_name?: string | null
          anonymous_phone?: string | null
          assigned_admin_id?: string | null
          assigned_organization_id?: string | null
          audio_url?: string | null
          citizen_satisfaction_rating?: number | null
          created_at?: string | null
          department?: string | null
          description?: string
          estimated_resolution_time?: unknown | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          population_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_assigned_organization_id_fkey"
            columns: ["assigned_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_population_id_fkey"
            columns: ["population_id"]
            isOneToOne: false
            referencedRelation: "population"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      superadmin: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          last_login: string | null
          name: string
          password_hash: string
          status: string | null
          supabase_user_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_login?: string | null
          name: string
          password_hash: string
          status?: string | null
          supabase_user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_login?: string | null
          name?: string
          password_hash?: string
          status?: string | null
          supabase_user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      superadmin_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          superadmin_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          superadmin_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          superadmin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "superadmin_logs_superadmin_id_fkey"
            columns: ["superadmin_id"]
            isOneToOne: false
            referencedRelation: "superadmin"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          category: string | null
          created_at: string | null
          details: string | null
          id: string
          level: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          category?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          level?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          category?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          level?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _is_superadmin_credentials: {
        Args: { _password_raw: string; _username: string }
        Returns: boolean
      }
      admin_assigned_to_report: {
        Args: { _report_id: string; _user_id: string }
        Returns: boolean
      }
      admin_can_view_population: {
        Args: { _population_id: string; _user_id: string }
        Returns: boolean
      }
      admin_get_all_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string | null
          approved_at: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string | null
          permissions: string[] | null
          phone: string | null
          status: string | null
          supabase_user_id: string | null
          type: string
        }[]
      }
      admin_list_organizations: {
        Args: { _password_raw: string; _username: string }
        Returns: {
          address: string | null
          approved_at: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string | null
          permissions: string[] | null
          phone: string | null
          status: string | null
          supabase_user_id: string | null
          type: string
        }[]
      }
      admin_update_org_status: {
        Args: {
          _new_status: string
          _org_id: string
          _password_raw: string
          _username: string
        }
        Returns: boolean
      }
      authenticate_organization: {
        Args: { org_email: string; plain_password: string }
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          status: string
          type: string
        }[]
      }
      authenticate_superadmin: {
        Args: { _password_raw: string; _username: string }
        Returns: {
          created_at: string
          email: string
          id: string
          last_login: string
          name: string
          status: string
          username: string
        }[]
      }
      cleanup_orphaned_files: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_count: number
          total_count: number
          user_type: string
          users: Json
        }[]
      }
      get_current_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          id: string
          name: string
          username: string
        }[]
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_resolution_hours: number
          in_progress_reports: number
          pending_reports: number
          rejected_reports: number
          resolved_reports: number
          today_reports: number
          total_reports: number
          week_reports: number
        }[]
      }
      get_public_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          status: string
          type: string
        }[]
      }
      get_storage_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_file_size: number
          bucket_name: string
          file_count: number
          total_size: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: string
      }
      hash_password: {
        Args: { plain_password: string }
        Returns: string
      }
      is_admin_or_superadmin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_org_to_user: {
        Args: { _org_name: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _action: string
          _resource_id?: string
          _resource_type?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: { _details?: Json; _event_type: string }
        Returns: undefined
      }
      migrate_admins_to_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      migrate_organizations_to_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      migrate_superadmins_to_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search_public_organizations: {
        Args: {
          city_filter?: string
          organization_type?: string
          search_term?: string
        }
        Returns: {
          city: string
          id: string
          name: string
          type: string
        }[]
      }
      update_superadmin_last_login: {
        Args: { _username: string }
        Returns: undefined
      }
      validate_admin_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      verify_password: {
        Args: { plain_password: string; stored_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
