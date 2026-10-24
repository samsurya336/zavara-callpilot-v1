export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_usage: {
        Row: {
          available_minutes: number
          consumed_minutes: number
          created_at: string
          reserved_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_minutes?: number
          consumed_minutes?: number
          created_at?: string
          reserved_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_minutes?: number
          consumed_minutes?: number
          created_at?: string
          reserved_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'account_usage_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      call_session: {
        Row: {
          branch_from_turn_id: string | null
          challenge_id: string
          challenge_snapshot: Json
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          metadata: Json
          mode: Database['public']['Enums']['call_mode']
          parent_session_id: string | null
          provider_session_id: string | null
          recording_url: string | null
          report: Json | null
          report_status: Database['public']['Enums']['report_status']
          settings: Json
          started_at: string | null
          status: Database['public']['Enums']['call_status']
          transcript: Json
          updated_at: string
          usage: Json
          user_id: string
        }
        Insert: {
          branch_from_turn_id?: string | null
          challenge_id: string
          challenge_snapshot?: Json
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json
          mode: Database['public']['Enums']['call_mode']
          parent_session_id?: string | null
          provider_session_id?: string | null
          recording_url?: string | null
          report?: Json | null
          report_status?: Database['public']['Enums']['report_status']
          settings?: Json
          started_at?: string | null
          status?: Database['public']['Enums']['call_status']
          transcript?: Json
          updated_at?: string
          usage?: Json
          user_id: string
        }
        Update: {
          branch_from_turn_id?: string | null
          challenge_id?: string
          challenge_snapshot?: Json
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          metadata?: Json
          mode?: Database['public']['Enums']['call_mode']
          parent_session_id?: string | null
          provider_session_id?: string | null
          recording_url?: string | null
          report?: Json | null
          report_status?: Database['public']['Enums']['report_status']
          settings?: Json
          started_at?: string | null
          status?: Database['public']['Enums']['call_status']
          transcript?: Json
          updated_at?: string
          usage?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'call_session_challenge_id_fkey'
            columns: ['challenge_id']
            isOneToOne: false
            referencedRelation: 'challenge'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'call_session_parent_fkey'
            columns: ['parent_session_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'call_session'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'call_session_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      challenge: {
        Row: {
          call_type: Database['public']['Enums']['call_type']
          category: string
          configs: Json
          created_at: string
          created_by: string | null
          description: string
          difficulty: string
          duration_minutes: number
          id: string
          is_active: boolean
          knowledge_id: string | null
          objective: string
          product_context: string | null
          scenario: string
          source: Database['public']['Enums']['challenge_source']
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          call_type: Database['public']['Enums']['call_type']
          category?: string
          configs?: Json
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty: string
          duration_minutes: number
          id?: string
          is_active?: boolean
          knowledge_id?: string | null
          objective: string
          product_context?: string | null
          scenario: string
          source?: Database['public']['Enums']['challenge_source']
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          call_type?: Database['public']['Enums']['call_type']
          category?: string
          configs?: Json
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          knowledge_id?: string | null
          objective?: string
          product_context?: string | null
          scenario?: string
          source?: Database['public']['Enums']['challenge_source']
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'challenge_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'challenge_knowledge_owner_fkey'
            columns: ['knowledge_id', 'created_by']
            isOneToOne: false
            referencedRelation: 'knowledge'
            referencedColumns: ['id', 'created_by']
          },
        ]
      }
      knowledge: {
        Row: {
          created_at: string
          created_by: string
          extracted_text: string | null
          extraction_error: string | null
          extraction_status: Database['public']['Enums']['knowledge_extraction_status']
          file_meta: Json
          file_size_bytes: number
          file_type: string
          file_url: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          extracted_text?: string | null
          extraction_error?: string | null
          extraction_status?: Database['public']['Enums']['knowledge_extraction_status']
          file_meta?: Json
          file_size_bytes: number
          file_type: string
          file_url: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          extracted_text?: string | null
          extraction_error?: string | null
          extraction_status?: Database['public']['Enums']['knowledge_extraction_status']
          file_meta?: Json
          file_size_bytes?: number
          file_type?: string
          file_url?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'knowledge_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organizations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      package_plan: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          minutes: number
          name: string
          provider_config: Json
          provider_meta: Json
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          minutes: number
          name: string
          provider_config?: Json
          provider_meta?: Json
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          minutes?: number
          name?: string
          provider_config?: Json
          provider_meta?: Json
          updated_at?: string
        }
        Relationships: []
      }
      participant: {
        Row: {
          challenge_id: string
          communication_style: string
          company: string
          created_at: string
          decision_authority: string
          designation: string
          hidden_motivation: string
          id: string
          name: string
          objections: Json
          personality: string
          sort_order: number
          updated_at: string
          voice_configs: Json
        }
        Insert: {
          challenge_id: string
          communication_style: string
          company: string
          created_at?: string
          decision_authority: string
          designation: string
          hidden_motivation: string
          id?: string
          name: string
          objections?: Json
          personality: string
          sort_order?: number
          updated_at?: string
          voice_configs?: Json
        }
        Update: {
          challenge_id?: string
          communication_style?: string
          company?: string
          created_at?: string
          decision_authority?: string
          designation?: string
          hidden_motivation?: string
          id?: string
          name?: string
          objections?: Json
          personality?: string
          sort_order?: number
          updated_at?: string
          voice_configs?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'participant_challenge_id_fkey'
            columns: ['challenge_id']
            isOneToOne: false
            referencedRelation: 'challenge'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          name?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      purchase_history: {
        Row: {
          amount: number
          currency: string
          id: string
          minutes_credited: number
          package_plan_id: string
          provider_meta: Json
          purchased_at: string
          user_id: string
        }
        Insert: {
          amount: number
          currency?: string
          id?: string
          minutes_credited: number
          package_plan_id: string
          provider_meta?: Json
          purchased_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          minutes_credited?: number
          package_plan_id?: string
          provider_meta?: Json
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'purchase_history_package_plan_id_fkey'
            columns: ['package_plan_id']
            isOneToOne: false
            referencedRelation: 'package_plan'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_history_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      participant_public: {
        Row: {
          challenge_id: string | null
          communication_style: string | null
          company: string | null
          decision_authority: string | null
          designation: string | null
          id: string | null
          name: string | null
          personality: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'participant_challenge_id_fkey'
            columns: ['challenge_id']
            isOneToOne: false
            referencedRelation: 'challenge'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      create_organization: {
        Args: { organization_name: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          name: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'organizations'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      purchase_package: {
        Args: { package_id: string }
        Returns: {
          amount: number
          currency: string
          id: string
          minutes_credited: number
          package_plan_id: string
          provider_meta: Json
          purchased_at: string
          user_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'purchase_history'
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      call_mode: 'ASSIST' | 'BATTLE'
      call_status: 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
      call_type: 'ONE_ON_ONE' | 'BOARDROOM'
      challenge_source: 'INTERNAL' | 'KNOWLEDGE_BASE'
      knowledge_extraction_status: 'PROCESSING' | 'READY' | 'FAILED'
      report_status: 'NOT_REQUESTED' | 'PROCESSING' | 'READY' | 'FAILED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      call_mode: ['ASSIST', 'BATTLE'],
      call_status: ['CREATED', 'ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED'],
      call_type: ['ONE_ON_ONE', 'BOARDROOM'],
      challenge_source: ['INTERNAL', 'KNOWLEDGE_BASE'],
      knowledge_extraction_status: ['PROCESSING', 'READY', 'FAILED'],
      report_status: ['NOT_REQUESTED', 'PROCESSING', 'READY', 'FAILED'],
    },
  },
} as const
