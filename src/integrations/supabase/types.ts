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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      email_analyses: {
        Row: {
          analysis_reasons: string[] | null
          analyzed_at: string
          clerk_user_id: string
          confidence_score: number | null
          email_body: string | null
          id: string
          is_phishing: boolean | null
          sender_email: string | null
          subject: string | null
          uploaded_file_id: string | null
        }
        Insert: {
          analysis_reasons?: string[] | null
          analyzed_at?: string
          clerk_user_id?: string
          confidence_score?: number | null
          email_body?: string | null
          id?: string
          is_phishing?: boolean | null
          sender_email?: string | null
          subject?: string | null
          uploaded_file_id?: string | null
        }
        Update: {
          analysis_reasons?: string[] | null
          analyzed_at?: string
          clerk_user_id?: string
          confidence_score?: number | null
          email_body?: string | null
          id?: string
          is_phishing?: boolean | null
          sender_email?: string | null
          subject?: string | null
          uploaded_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_analyses_uploaded_file_id_fkey"
            columns: ["uploaded_file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          alert_frequency: string
          clerk_user_id: string
          created_at: string
          email_alerts: boolean
          id: string
          phishing_threshold: number
          updated_at: string
        }
        Insert: {
          alert_frequency?: string
          clerk_user_id: string
          created_at?: string
          email_alerts?: boolean
          id?: string
          phishing_threshold?: number
          updated_at?: string
        }
        Update: {
          alert_frequency?: string
          clerk_user_id?: string
          created_at?: string
          email_alerts?: boolean
          id?: string
          phishing_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          clerk_user_id: string
          created_at: string
          endpoint: string
          id: string
          requests_count: number
          updated_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          endpoint: string
          id?: string
          requests_count?: number
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          requests_count?: number
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      shareable_reports: {
        Row: {
          analysis_id: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          share_token: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          share_token: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          share_token?: string
        }
        Relationships: []
      }
      uploaded_files: {
        Row: {
          clerk_user_id: string
          file_content: string | null
          file_size: number
          file_type: string
          filename: string
          id: string
          upload_date: string
        }
        Insert: {
          clerk_user_id?: string
          file_content?: string | null
          file_size: number
          file_type: string
          filename: string
          id?: string
          upload_date?: string
        }
        Update: {
          clerk_user_id?: string
          file_content?: string | null
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          upload_date?: string
        }
        Relationships: []
      }
      url_reputation: {
        Row: {
          check_count: number
          created_at: string
          id: string
          last_checked: string
          reputation_score: number
          safe_browsing_status: string | null
          updated_at: string
          url_domain: string
        }
        Insert: {
          check_count?: number
          created_at?: string
          id?: string
          last_checked?: string
          reputation_score?: number
          safe_browsing_status?: string | null
          updated_at?: string
          url_domain: string
        }
        Update: {
          check_count?: number
          created_at?: string
          id?: string
          last_checked?: string
          reputation_score?: number
          safe_browsing_status?: string | null
          updated_at?: string
          url_domain?: string
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          alert_type: string
          clerk_user_id: string
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          sent_at: string
        }
        Insert: {
          alert_type: string
          clerk_user_id: string
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string
        }
        Update: {
          alert_type?: string
          clerk_user_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          clerk_user_id: string
          created_at: string
          id: string
          last_scan_at: string | null
          phishing_detected: number
          safe_emails: number
          total_scans: number
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          id?: string
          last_scan_at?: string | null
          phishing_detected?: number
          safe_emails?: number
          total_scans?: number
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          id?: string
          last_scan_at?: string | null
          phishing_detected?: number
          safe_emails?: number
          total_scans?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          analysis_id: string | null
          clerk_user_id: string
          created_at: string
          feedback_reason: string | null
          id: string
          original_result: string
          updated_at: string
          user_feedback: string
        }
        Insert: {
          analysis_id?: string | null
          clerk_user_id: string
          created_at?: string
          feedback_reason?: string | null
          id?: string
          original_result: string
          updated_at?: string
          user_feedback: string
        }
        Update: {
          analysis_id?: string | null
          clerk_user_id?: string
          created_at?: string
          feedback_reason?: string | null
          id?: string
          original_result?: string
          updated_at?: string
          user_feedback?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "email_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
