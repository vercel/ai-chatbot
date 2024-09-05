export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      classes: {
        Row: {
          emoji: string | null
          id: string
          precomputed: string | null
          subtitle: string | null
          title: string | null
          topic: string | null
        }
        Insert: {
          emoji?: string | null
          id?: string
          precomputed?: string | null
          subtitle?: string | null
          title?: string | null
          topic?: string | null
        }
        Update: {
          emoji?: string | null
          id?: string
          precomputed?: string | null
          subtitle?: string | null
          title?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      lesson_types: {
        Row: {
          created_at: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lessonplan: {
        Row: {
          category: string | null
          contents: string | null
          duration: number | null
          learningexperiences: string | null
          learningresults: string | null
          sessionsequence: string | null
          specificobjective: string | null
          topic: string | null
          totalduration: number | null
        }
        Insert: {
          category?: string | null
          contents?: string | null
          duration?: number | null
          learningexperiences?: string | null
          learningresults?: string | null
          sessionsequence?: string | null
          specificobjective?: string | null
          topic?: string | null
          totalduration?: number | null
        }
        Update: {
          category?: string | null
          contents?: string | null
          duration?: number | null
          learningexperiences?: string | null
          learningresults?: string | null
          sessionsequence?: string | null
          specificobjective?: string | null
          topic?: string | null
          totalduration?: number | null
        }
        Relationships: []
      }
      levels: {
        Row: {
          created_at: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string
          id: string
          lesson_type: string
          level: string
          percentage: number
          updated_at: string
          user: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_type: string
          level: string
          percentage?: number
          updated_at?: string
          user: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_type?: string
          level?: string
          percentage?: number
          updated_at?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_advancement_lesson_type_fkey"
            columns: ["lesson_type"]
            isOneToOne: false
            referencedRelation: "lesson_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_advancement_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_advancement_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      userdeviceinfo: {
        Row: {
          country: string | null
          created_at: string | null
          device_version: string | null
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          device_version?: string | null
          email?: string | null
          first_name?: string | null
          id?: never
          last_name?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          device_version?: string | null
          email?: string | null
          first_name?: string | null
          id?: never
          last_name?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_method: string | null
          created_at: string
          email: string | null
          firebase_id: string | null
          id: string
          last_name: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          auth_method?: string | null
          created_at?: string
          email?: string | null
          firebase_id?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_method?: string | null
          created_at?: string
          email?: string | null
          firebase_id?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
