export type IssueType = 
  | 'CONTRATO_SEM_CLIENTE'
  | 'CLIENTE_SEM_CONTRATO'
  | 'CONTRATO_SEM_MATCH_OS'
  | 'MULTIPLOS_MATCHES'
  | 'DADOS_DIVERGENTES';

export type IssueStatus = 'PENDENTE' | 'RESOLVIDO';

export interface ReconciliationIssue {
  id: string;
  issue_type: IssueType;
  os_id: string | null;
  contract_id: string | null;
  customer_id: string | null;
  details: Record<string, any>;
  status: IssueStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
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

export const ISSUE_TYPE_CONFIG: Record<IssueType, { label: string; description: string; color: string; icon: string }> = {
  CONTRATO_SEM_CLIENTE: {
    label: 'Contrato sem Cliente',
    description: 'Contrato na base operadora sem cliente vinculado',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    icon: 'UserX'
  },
  CLIENTE_SEM_CONTRATO: {
    label: 'Cliente sem Contrato',
    description: 'Cliente na base de vendas sem contrato na operadora',
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'FileX'
  },
  CONTRATO_SEM_MATCH_OS: {
    label: 'Contrato sem Match OS',
    description: 'Contrato sem correspondência na base de vendas',
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    icon: 'Unlink'
  },
  MULTIPLOS_MATCHES: {
    label: 'Múltiplos Matches',
    description: 'Múltiplas correspondências encontradas',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    icon: 'Copy'
  },
  DADOS_DIVERGENTES: {
    label: 'Dados Divergentes',
    description: 'Dados não correspondem entre as bases',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    icon: 'AlertTriangle'
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
