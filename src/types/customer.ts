export interface Customer {
  id: string;
  cpf_cnpj: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  telefone2: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesBase {
  id: string;
  customer_id: string;
  os: string;
  produto: string | null;
  plano: string | null;
  valor_plano: number | null;
  data_venda: string | null;
  vendedor: string | null;
  import_batch_id: string | null;
  created_at: string;
}

export interface OperatorContract {
  id: string;
  customer_id: string | null;
  sales_base_id: string | null;
  id_contrato: string;
  numero_contrato_operadora: string | null;
  numero_fatura: string | null;
  status_operadora: string | null;
  status_contrato: string | null;
  data_ativacao: string | null;
  data_cadastro: string | null;
  data_cancelamento: string | null;
  data_vencimento: string | null;
  data_pagamento: string | null;
  valor_contrato: number | null;
  valor_fatura: number | null;
  mes_safra_cadastro: string | null;
  mes_safra_vencimento: string | null;
  import_batch_id: string | null;
  raw_data: unknown;
  created_at: string | null;
}

export interface CustomerWithDetails extends Customer {
  sales_base?: SalesBase[];
  operator_contracts?: OperatorContract[];
  total_sales?: number;
  total_contracts?: number;
}

// Situação do cliente baseada em faturas
export type CustomerSituacao = 'paid' | 'overdue' | 'no_contract';

// Extended customer with operator summary for list view
export interface CustomerWithOperatorSummary extends Customer {
  contracts_count: number;
  total_valor_pendente: number;
  status_contrato: string | null;
  proxima_data_vencimento: string | null;
  situacao: CustomerSituacao;
}

// Customer statistics for dashboard cards
export interface CustomerStats {
  total: number;
  paid: number;       // Clientes em dia (tem contratos, sem faturas vencidas)
  overdue: number;    // Clientes em atraso (tem faturas vencidas)
  noContract: number; // Clientes sem contrato
}

export interface CustomerFilters {
  search: string;
  parcela: string;
  status: 'all' | 'paid' | 'overdue' | 'no_contract';
  safra: string;
  statusContrato: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Sorting types
export type CustomerSortField = 'nome' | 'cpf_cnpj' | 'contracts_count' | 'total_valor_pendente' | 'proxima_data_vencimento';
export type SortDirection = 'asc' | 'desc';

export interface CustomerSortState {
  field: CustomerSortField;
  direction: SortDirection;
}

// Situação configuration
export const CUSTOMER_SITUACAO_CONFIG: Record<CustomerSituacao, { label: string; className: string }> = {
  paid: {
    label: 'Em Dia',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  overdue: {
    label: 'Em Atraso',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  no_contract: {
    label: 'Sem Contrato',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
};
