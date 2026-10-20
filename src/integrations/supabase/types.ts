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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          client_email: string | null
          client_mobile: string | null
          client_name: string | null
          created_at: string
          destination: string
          id: string
          nights: number
          notes: string | null
          request_id: string | null
          resort: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          check_in: string
          check_out: string
          client_email?: string | null
          client_mobile?: string | null
          client_name?: string | null
          created_at?: string
          destination: string
          id?: string
          nights?: number
          notes?: string | null
          request_id?: string | null
          resort?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string
          client_email?: string | null
          client_mobile?: string | null
          client_name?: string | null
          created_at?: string
          destination?: string
          id?: string
          nights?: number
          notes?: string | null
          request_id?: string | null
          resort?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          id: string
          name: string
          path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          path: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          path?: string
          user_id?: string
        }
        Relationships: []
      }
      holiday_requests: {
        Row: {
          admin_note: string | null
          alt_dates: string | null
          check_in: string
          check_out: string
          code: string
          created_at: string
          destination: string
          extras: Json
          id: string
          nights: number
          resort: string | null
          rooms: number
          special_requests: string | null
          status: string
          travellers: Json
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          alt_dates?: string | null
          check_in: string
          check_out: string
          code?: string
          created_at?: string
          destination: string
          extras?: Json
          id?: string
          nights?: number
          resort?: string | null
          rooms?: number
          special_requests?: string | null
          status?: string
          travellers?: Json
          user_id?: string
        }
        Update: {
          admin_note?: string | null
          alt_dates?: string | null
          check_in?: string
          check_out?: string
          code?: string
          created_at?: string
          destination?: string
          extras?: Json
          id?: string
          nights?: number
          resort?: string | null
          rooms?: number
          special_requests?: string | null
          status?: string
          travellers?: Json
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          interest: string | null
          message: string | null
          name: string
          phone: string
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          message?: string | null
          name: string
          phone: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          message?: string | null
          name?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      membership_plans: {
        Row: {
          active: boolean
          features: string[]
          id: string
          name: string
          nights: number
          original_price: number
          price: number
          slug: string
          sort: number
          validity_years: number
        }
        Insert: {
          active?: boolean
          features?: string[]
          id?: string
          name: string
          nights?: number
          original_price?: number
          price?: number
          slug: string
          sort?: number
          validity_years?: number
        }
        Update: {
          active?: boolean
          features?: string[]
          id?: string
          name?: string
          nights?: number
          original_price?: number
          price?: number
          slug?: string
          sort?: number
          validity_years?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          discount: string | null
          id: string
          title: string
          valid_till: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount?: string | null
          id?: string
          title: string
          valid_till?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          discount?: string | null
          id?: string
          title?: string
          valid_till?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          email: string | null
          id: string
          method: string
          name: string | null
          phone: string | null
          plan_slug: string
          reference: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          email?: string | null
          id?: string
          method?: string
          name?: string | null
          phone?: string | null
          plan_slug: string
          reference?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          email?: string | null
          id?: string
          method?: string
          name?: string | null
          phone?: string | null
          plan_slug?: string
          reference?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          member_code: string
          membership_end: string | null
          membership_start: string | null
          nights_total: number
          nights_used: number
          phone: string | null
          plan: string | null
          status: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          member_code?: string
          membership_end?: string | null
          membership_start?: string | null
          nights_total?: number
          nights_used?: number
          phone?: string | null
          plan?: string | null
          status?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          member_code?: string
          membership_end?: string | null
          membership_start?: string | null
          nights_total?: number
          nights_used?: number
          phone?: string | null
          plan?: string | null
          status?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          friend_name: string
          friend_phone: string
          id: string
          referred_user_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_name: string
          friend_phone: string
          id?: string
          referred_user_id?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          friend_name?: string
          friend_phone?: string
          id?: string
          referred_user_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      resorts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string
          name: string
          rating: number
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          name: string
          rating?: number
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          name?: string
          rating?: number
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          location: string | null
          message: string
          name: string
          rating: number
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          location?: string | null
          message: string
          name: string
          rating?: number
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          location?: string | null
          message?: string
          name?: string
          rating?: number
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          user_id?: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          details: Json
          id: string
          method: string
          remarks: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          details?: Json
          id?: string
          method?: string
          remarks?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          details?: Json
          id?: string
          method?: string
          remarks?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "member"],
    },
  },
} as const
