// Types for the import system

export type ImportType = 'sales' | 'operator';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
}

export interface ParsedRow {
  [key: string]: string | number | null;
}

export interface ImportPreview {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
}

export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  batchId: string | null;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: ParsedRow;
}

// Expected fields for each import type
export const SALES_FIELDS: ColumnMapping[] = [
  { sourceColumn: '', targetField: 'os', required: true },
  { sourceColumn: '', targetField: 'cpf_cnpj', required: true },
  { sourceColumn: '', targetField: 'nome', required: true },
  { sourceColumn: '', targetField: 'email', required: false },
  { sourceColumn: '', targetField: 'telefone', required: false },
  { sourceColumn: '', targetField: 'telefone2', required: false },
  { sourceColumn: '', targetField: 'endereco', required: false },
  { sourceColumn: '', targetField: 'cidade', required: false },
  { sourceColumn: '', targetField: 'uf', required: false },
  { sourceColumn: '', targetField: 'cep', required: false },
  { sourceColumn: '', targetField: 'produto', required: false },
  { sourceColumn: '', targetField: 'plano', required: false },
  { sourceColumn: '', targetField: 'valor_plano', required: false },
  { sourceColumn: '', targetField: 'data_venda', required: false },
  { sourceColumn: '', targetField: 'vendedor', required: false },
];

export const OPERATOR_FIELDS: ColumnMapping[] = [
  { sourceColumn: '', targetField: 'id_contrato', required: true },
  { sourceColumn: '', targetField: 'cpf_cnpj', required: true },
  { sourceColumn: '', targetField: 'nome', required: true },
  { sourceColumn: '', targetField: 'numero_contrato_operadora', required: false },
  { sourceColumn: '', targetField: 'status_operadora', required: false },
  { sourceColumn: '', targetField: 'data_ativacao', required: false },
  { sourceColumn: '', targetField: 'data_cancelamento', required: false },
  { sourceColumn: '', targetField: 'valor_contrato', required: false },
];

export const FIELD_LABELS: Record<string, string> = {
  os: 'OS (Ordem de Serviço)',
  id_contrato: 'ID Contrato',
  cpf_cnpj: 'CPF/CNPJ',
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'Telefone',
  telefone2: 'Telefone 2',
  endereco: 'Endereço',
  cidade: 'Cidade',
  uf: 'UF',
  cep: 'CEP',
  produto: 'Produto',
  plano: 'Plano',
  valor_plano: 'Valor do Plano',
  data_venda: 'Data da Venda',
  vendedor: 'Vendedor',
  numero_contrato_operadora: 'Nº Contrato Operadora',
  status_operadora: 'Status Operadora',
  data_ativacao: 'Data Ativação',
  data_cancelamento: 'Data Cancelamento',
  valor_contrato: 'Valor Contrato',
};
