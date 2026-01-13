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
  customer_id: string;
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
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface CustomerWithDetails extends Customer {
  sales_base?: SalesBase[];
  operator_contracts?: OperatorContract[];
  total_sales?: number;
  total_contracts?: number;
}

// Extended customer with operator summary for list view
export interface CustomerWithOperatorSummary extends Customer {
  contracts_count: number;
  total_valor_pendente: number;
  status_contrato: string | null;
  proxima_data_vencimento: string | null;
}

export interface CustomerFilters {
  search: string;
  uf: string;
  status: 'all' | 'active' | 'inactive' | 'pending' | 'overdue' | 'no_contract';
  safra: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
