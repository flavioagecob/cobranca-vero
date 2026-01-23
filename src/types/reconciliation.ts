// Issue types - matching Supabase enum issue_type (lowercase)
export type IssueType = 
  | 'cliente_sem_contrato'
  | 'contrato_sem_venda'
  | 'valor_divergente'
  | 'dados_incorretos';

export type IssueStatus = 'PENDENTE' | 'RESOLVIDO';

// ReconciliationIssue - matching Supabase table structure
export interface ReconciliationIssue {
  id: string;
  tipo: IssueType;
  issue_type: IssueType | null;
  customer_id: string | null;
  operator_contract_id: string | null;
  sales_base_id: string | null;
  descricao: string | null;
  status: string | null;
  created_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  // Joined data
  sales_base?: {
    os: string;
    produto: string | null;
    plano: string | null;
    valor_plano: number | null;
    data_venda: string | null;
    vendedor: string | null;
    customer?: {
      nome: string;
      cpf_cnpj: string;
    };
  };
  operator_contract?: {
    id_contrato: string;
    numero_contrato_operadora: string | null;
    status_operadora: string | null;
    valor_contrato: number | null;
    data_ativacao: string | null;
    customer?: {
      nome: string;
      cpf_cnpj: string;
    };
  };
  customer?: {
    nome: string;
    cpf_cnpj: string;
  };
}

export interface ReconciliationFilters {
  search: string;
  issueType: IssueType | 'all';
  status: IssueStatus | 'all';
}

export interface ReconciliationStats {
  total: number;
  pendentes: number;
  resolvidos: number;
  byType: Record<IssueType, number>;
}

// Issue type configurations - matching Supabase enum (lowercase)
export const ISSUE_TYPE_CONFIG: Record<IssueType, { label: string; description: string; color: string; icon: string }> = {
  cliente_sem_contrato: {
    label: 'Cliente sem Contrato',
    description: 'Cliente na base de vendas sem contrato na operadora',
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'FileX'
  },
  contrato_sem_venda: {
    label: 'Contrato sem Venda',
    description: 'Contrato na base operadora sem registro de venda',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    icon: 'UserX'
  },
  valor_divergente: {
    label: 'Valor Divergente',
    description: 'Valor do contrato não corresponde ao valor da venda',
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    icon: 'AlertTriangle'
  },
  dados_incorretos: {
    label: 'Dados Incorretos',
    description: 'Dados não correspondem entre as bases',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    icon: 'AlertCircle'
  }
};

export const ISSUE_STATUS_CONFIG: Record<IssueStatus, { label: string; color: string }> = {
  PENDENTE: {
    label: 'Pendente',
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
  },
  RESOLVIDO: {
    label: 'Resolvido',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30'
  }
};
