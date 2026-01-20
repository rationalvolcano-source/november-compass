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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      candidates: {
        Row: {
          category: string
          created_at: string
          id: string
          month: number
          provider: string
          published_at: string | null
          section: string
          snippet: string | null
          source: string
          title: string
          url: string | null
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          id: string
          month: number
          provider: string
          published_at?: string | null
          section: string
          snippet?: string | null
          source: string
          title: string
          url?: string | null
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          month?: number
          provider?: string
          published_at?: string | null
          section?: string
          snippet?: string | null
          source?: string
          title?: string
          url?: string | null
          year?: number
        }
        Relationships: []
      }
      draft_items: {
        Row: {
          category: string
          created_at: string
          hash: string
          id: string
          month: number
          published_at: string | null
          section: string
          snippet: string | null
          source: string
          title: string
          url: string | null
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          hash: string
          id?: string
          month: number
          published_at?: string | null
          section: string
          snippet?: string | null
          source: string
          title: string
          url?: string | null
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          hash?: string
          id?: string
          month?: number
          published_at?: string | null
          section?: string
          snippet?: string | null
          source?: string
          title?: string
          url?: string | null
          year?: number
        }
        Relationships: []
      }
      enriched_items: {
        Row: {
          created_at: string
          draft_id: string
          exam_points: Json
          id: string
          mcqs: Json | null
          model: string
          prompt_version: number
          summary: string
          token_cost_est: number | null
        }
        Insert: {
          created_at?: string
          draft_id: string
          exam_points?: Json
          id?: string
          mcqs?: Json | null
          model: string
          prompt_version?: number
          summary: string
          token_cost_est?: number | null
        }
        Update: {
          created_at?: string
          draft_id?: string
          exam_points?: Json
          id?: string
          mcqs?: Json | null
          model?: string
          prompt_version?: number
          summary?: string
          token_cost_est?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enriched_items_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: true
            referencedRelation: "draft_items"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          created_at: string
          enrich_quota_daily: number
          export_enabled: boolean
          id: string
          plan: Database["public"]["Enums"]["user_plan"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          updated_at: string | null
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          enrich_quota_daily?: number
          export_enabled?: boolean
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          updated_at?: string | null
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          enrich_quota_daily?: number
          export_enabled?: boolean
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          updated_at?: string | null
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          payment_id: string | null
          provider: string
          signature: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          payment_id?: string | null
          provider?: string
          signature?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          payment_id?: string | null
          provider?: string
          signature?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      selections: {
        Row: {
          candidate_set_hash: string
          category: string
          created_at: string
          id: string
          month: number
          prompt_version: number
          section: string
          selected_ids: Json
          year: number
        }
        Insert: {
          candidate_set_hash: string
          category: string
          created_at?: string
          id?: string
          month: number
          prompt_version?: number
          section: string
          selected_ids?: Json
          year: number
        }
        Update: {
          candidate_set_hash?: string
          category?: string
          created_at?: string
          id?: string
          month?: number
          prompt_version?: number
          section?: string
          selected_ids?: Json
          year?: number
        }
        Relationships: []
      }
      usage_daily: {
        Row: {
          date: string
          draft_fetch_count: number
          enrich_count: number
          export_count: number
          id: string
          user_id: string
        }
        Insert: {
          date?: string
          draft_fetch_count?: number
          enrich_count?: number
          export_count?: number
          id?: string
          user_id: string
        }
        Update: {
          date?: string
          draft_fetch_count?: number
          enrich_count?: number
          export_count?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_daily_usage: {
        Args: { p_user_id: string }
        Returns: {
          date: string
          draft_fetch_count: number
          enrich_count: number
          export_count: number
          id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_daily"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_entitlement: {
        Args: { p_user_id: string }
        Returns: {
          enrich_quota_daily: number
          export_enabled: boolean
          plan: Database["public"]["Enums"]["user_plan"]
        }[]
      }
      increment_usage: {
        Args: { p_amount?: number; p_field: string; p_user_id: string }
        Returns: {
          date: string
          draft_fetch_count: number
          enrich_count: number
          export_count: number
          id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_daily"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      user_plan: "free" | "pro"
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
    Enums: {
      user_plan: ["free", "pro"],
    },
  },
} as const
