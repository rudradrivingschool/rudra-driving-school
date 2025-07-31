export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admissions: {
        Row: {
          additional_notes: string | null
          admission_date: string | null
          advance_amount: number | null
          contact: string | null
          created_at: string | null
          driving_license: string | null
          duration: string | null
          email: string | null
          fees: number | null
          id: string
          learning_license: string | null
          license_number: string | null
          license_type: string | null
          rides_completed: number | null
          sex: string | null
          start_date: string | null
          status: string | null
          student_name: string
          total_rides: number
        }
        Insert: {
          additional_notes?: string | null
          admission_date?: string | null
          advance_amount?: number | null
          contact?: string | null
          created_at?: string | null
          driving_license?: string | null
          duration?: string | null
          email?: string | null
          fees?: number | null
          id?: string
          learning_license?: string | null
          license_number?: string | null
          license_type?: string | null
          rides_completed?: number | null
          sex?: string | null
          start_date?: string | null
          status?: string | null
          student_name: string
          total_rides?: number
        }
        Update: {
          additional_notes?: string | null
          admission_date?: string | null
          advance_amount?: number | null
          contact?: string | null
          created_at?: string | null
          driving_license?: string | null
          duration?: string | null
          email?: string | null
          fees?: number | null
          id?: string
          learning_license?: string | null
          license_number?: string | null
          license_type?: string | null
          rides_completed?: number | null
          sex?: string | null
          start_date?: string | null
          status?: string | null
          student_name?: string
          total_rides?: number
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          join_date: string | null
          license_number: string | null
          name: string
          password: string
          phone: string | null
          role: string | null
          status: string | null
          total_rides: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          join_date?: string | null
          license_number?: string | null
          name: string
          password: string
          phone?: string | null
          role?: string | null
          status?: string | null
          total_rides?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          join_date?: string | null
          license_number?: string | null
          name?: string
          password?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          total_rides?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          driver_id: string | null
          id: string
          notes: string | null
          purpose: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          purpose: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admission_id: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_type: string
          updated_at: string
        }
        Insert: {
          admission_id: string
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_type: string
          updated_at?: string
        }
        Update: {
          admission_id?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          car: string | null
          client_id: string | null
          client_name: string
          created_at: string | null
          date: string
          driver_id: string | null
          id: string
          notes: string | null
          status: string | null
          time: string | null
        }
        Insert: {
          car?: string | null
          client_id?: string | null
          client_name: string
          created_at?: string | null
          date: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          time?: string | null
        }
        Update: {
          car?: string | null
          client_id?: string | null
          client_name?: string
          created_at?: string | null
          date?: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
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
