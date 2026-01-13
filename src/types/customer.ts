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
  id_contrato: string;
  numero_contrato_operadora: string | null;
  status_operadora: string | null;
  data_ativacao: string | null;
  data_cancelamento: string | null;
  valor_contrato: number | null;
  import_batch_id: string | null;
  created_at: string;
}

export interface CustomerWithDetails extends Customer {
  sales_base?: SalesBase[];
  operator_contracts?: OperatorContract[];
  total_sales?: number;
  total_contracts?: number;
}

export interface CustomerFilters {
  search: string;
  uf: string;
  status: 'all' | 'active' | 'inactive';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
