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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      collection_attempts: {
        Row: {
          channel: Database["public"]["Enums"]["collection_channel"]
          collector_id: string
          created_at: string | null
          customer_id: string
          id: string
          invoice_id: string
          notes: string | null
          status: Database["public"]["Enums"]["attempt_status"]
        }
        Insert: {
          channel: Database["public"]["Enums"]["collection_channel"]
          collector_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          invoice_id: string
          notes?: string | null
          status: Database["public"]["Enums"]["attempt_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["collection_channel"]
          collector_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attempt_status"]
        }
        Relationships: [
          {
            foreignKeyName: "collection_attempts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_attempts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "operator_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf_cnpj: string
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["customer_status"] | null
          telefone: string | null
          telefone2: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj: string
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["customer_status"] | null
          telefone?: string | null
          telefone2?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["customer_status"] | null
          telefone?: string | null
          telefone2?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          arquivo_nome: string
          created_at: string | null
          id: string
          imported_by: string | null
          registros_erro: number | null
          registros_sucesso: number | null
          tipo: Database["public"]["Enums"]["import_type"]
          total_registros: number | null
        }
        Insert: {
          arquivo_nome: string
          created_at?: string | null
          id?: string
          imported_by?: string | null
          registros_erro?: number | null
          registros_sucesso?: number | null
          tipo: Database["public"]["Enums"]["import_type"]
          total_registros?: number | null
        }
        Update: {
          arquivo_nome?: string
          created_at?: string | null
          id?: string
          imported_by?: string | null
          registros_erro?: number | null
          registros_sucesso?: number | null
          tipo?: Database["public"]["Enums"]["import_type"]
          total_registros?: number | null
        }
        Relationships: []
      }
      instances: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          instance_id: string
          name: string
          phone_number: string | null
          status: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          instance_id: string
          name: string
          phone_number?: string | null
          status?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          instance_id?: string
          name?: string
          phone_number?: string | null
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          contract_id: string | null
          created_at: string | null
          customer_id: string
          data_pagamento: string | null
          data_vencimento: string
          dias_atraso: number | null
          id: string
          numero_fatura: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          customer_id: string
          data_pagamento?: string | null
          data_vencimento: string
          dias_atraso?: number | null
          id?: string
          numero_fatura?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          customer_id?: string
          data_pagamento?: string | null
          data_vencimento?: string
          dias_atraso?: number | null
          id?: string
          numero_fatura?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "operator_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_contracts: {
        Row: {
          created_at: string | null
          customer_id: string | null
          data_ativacao: string | null
          data_cadastro: string | null
          data_cancelamento: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          id: string
          id_contrato: string
          import_batch_id: string | null
          mes_safra_cadastro: string | null
          mes_safra_vencimento: string | null
          numero_contrato_operadora: string | null
          numero_fatura: string | null
          raw_data: Json | null
          sales_base_id: string | null
          status_contrato: string | null
          status_operadora: string | null
          valor_contrato: number | null
          valor_fatura: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          data_ativacao?: string | null
          data_cadastro?: string | null
          data_cancelamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          id_contrato: string
          import_batch_id?: string | null
          mes_safra_cadastro?: string | null
          mes_safra_vencimento?: string | null
          numero_contrato_operadora?: string | null
          numero_fatura?: string | null
          raw_data?: Json | null
          sales_base_id?: string | null
          status_contrato?: string | null
          status_operadora?: string | null
          valor_contrato?: number | null
          valor_fatura?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          data_ativacao?: string | null
          data_cadastro?: string | null
          data_cancelamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          id?: string
          id_contrato?: string
          import_batch_id?: string | null
          mes_safra_cadastro?: string | null
          mes_safra_vencimento?: string | null
          numero_contrato_operadora?: string | null
          numero_fatura?: string | null
          raw_data?: Json | null
          sales_base_id?: string | null
          status_contrato?: string | null
          status_operadora?: string | null
          valor_contrato?: number | null
          valor_fatura?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_contracts_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_contracts_sales_base_id_fkey"
            columns: ["sales_base_id"]
            isOneToOne: false
            referencedRelation: "sales_base"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_promises: {
        Row: {
          collector_id: string
          created_at: string | null
          data_prometida: string
          id: string
          invoice_id: string
          status: Database["public"]["Enums"]["promise_status"] | null
          updated_at: string | null
          valor_prometido: number
        }
        Insert: {
          collector_id: string
          created_at?: string | null
          data_prometida: string
          id?: string
          invoice_id: string
          status?: Database["public"]["Enums"]["promise_status"] | null
          updated_at?: string | null
          valor_prometido: number
        }
        Update: {
          collector_id?: string
          created_at?: string | null
          data_prometida?: string
          id?: string
          invoice_id?: string
          status?: Database["public"]["Enums"]["promise_status"] | null
          updated_at?: string | null
          valor_prometido?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_promises_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "operator_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_issues: {
        Row: {
          created_at: string | null
          customer_id: string | null
          descricao: string | null
          id: string
          issue_type: Database["public"]["Enums"]["issue_type"] | null
          operator_contract_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          sales_base_id: string | null
          status: string | null
          tipo: Database["public"]["Enums"]["issue_type"]
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          descricao?: string | null
          id?: string
          issue_type?: Database["public"]["Enums"]["issue_type"] | null
          operator_contract_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sales_base_id?: string | null
          status?: string | null
          tipo: Database["public"]["Enums"]["issue_type"]
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          descricao?: string | null
          id?: string
          issue_type?: Database["public"]["Enums"]["issue_type"] | null
          operator_contract_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sales_base_id?: string | null
          status?: string | null
          tipo?: Database["public"]["Enums"]["issue_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_issues_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_issues_operator_contract_id_fkey"
            columns: ["operator_contract_id"]
            isOneToOne: false
            referencedRelation: "operator_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_issues_sales_base_id_fkey"
            columns: ["sales_base_id"]
            isOneToOne: false
            referencedRelation: "sales_base"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_base: {
        Row: {
          created_at: string | null
          customer_id: string | null
          data_venda: string | null
          id: string
          import_batch_id: string | null
          os: string
          plano: string | null
          produto: string | null
          raw_data: Json | null
          valor_plano: number | null
          vendedor: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          data_venda?: string | null
          id?: string
          import_batch_id?: string | null
          os: string
          plano?: string | null
          produto?: string | null
          raw_data?: Json | null
          valor_plano?: number | null
          vendedor?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          data_venda?: string | null
          id?: string
          import_batch_id?: string | null
          os?: string
          plano?: string | null
          produto?: string | null
          raw_data?: Json | null
          valor_plano?: number | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_base_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_base_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
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
      users_profile: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
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
      app_role: "admin" | "supervisor" | "cobrador"
      attempt_status:
        | "sucesso"
        | "sem_resposta"
        | "numero_invalido"
        | "recusado"
        | "caixa_postal"
      collection_channel: "whatsapp" | "telefone" | "email" | "sms"
      customer_status: "ativo" | "inadimplente" | "cancelado" | "suspenso"
      import_type: "sales" | "operator"
      invoice_status:
        | "pendente"
        | "pago"
        | "atrasado"
        | "negociado"
        | "cancelado"
      issue_status: "PENDENTE" | "RESOLVIDO"
      issue_type:
        | "cliente_sem_contrato"
        | "contrato_sem_venda"
        | "valor_divergente"
        | "dados_incorretos"
      promise_status: "pendente" | "cumprida" | "quebrada"
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
      app_role: ["admin", "supervisor", "cobrador"],
      attempt_status: [
        "sucesso",
        "sem_resposta",
        "numero_invalido",
        "recusado",
        "caixa_postal",
      ],
      collection_channel: ["whatsapp", "telefone", "email", "sms"],
      customer_status: ["ativo", "inadimplente", "cancelado", "suspenso"],
      import_type: ["sales", "operator"],
      invoice_status: [
        "pendente",
        "pago",
        "atrasado",
        "negociado",
        "cancelado",
      ],
      issue_status: ["PENDENTE", "RESOLVIDO"],
      issue_type: [
        "cliente_sem_contrato",
        "contrato_sem_venda",
        "valor_divergente",
        "dados_incorretos",
      ],
      promise_status: ["pendente", "cumprida", "quebrada"],
    },
  },
} as const
