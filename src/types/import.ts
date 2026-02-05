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
  { sourceColumn: '', targetField: 'mes_safra', required: false },
  { sourceColumn: '', targetField: 'data_vencimento', required: false },
  { sourceColumn: '', targetField: 'valor', required: false },
];

export const OPERATOR_FIELDS: ColumnMapping[] = [
  { sourceColumn: '', targetField: 'id_contrato', required: true },
  { sourceColumn: '', targetField: 'numero_fatura', required: true },
  { sourceColumn: '', targetField: 'status_contrato', required: false },
  { sourceColumn: '', targetField: 'data_cadastro', required: false },
  { sourceColumn: '', targetField: 'mes_safra_cadastro', required: false },
  { sourceColumn: '', targetField: 'mes_safra_vencimento', required: false },
  { sourceColumn: '', targetField: 'data_vencimento', required: false },
  { sourceColumn: '', targetField: 'data_pagamento', required: false },
  { sourceColumn: '', targetField: 'valor_fatura', required: false },
];

export const FIELD_LABELS: Record<string, string> = {
  // Campos Base de Vendas
  os: 'OS (Ordem de Serviço)',
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
  mes_safra: 'Mês Safra',
  data_vencimento: 'Data de Vencimento',
  valor: 'Valor',
  // Campos Base Operadora
  id_contrato: 'ID Contrato (CONTRATO)',
  numero_fatura: 'Número da Fatura',
  status_contrato: 'Status do Contrato',
  data_cadastro: 'Data de Cadastro',
  mes_safra_cadastro: 'Mês Safra Cadastro',
  mes_safra_vencimento: 'Mês Safra Vencimento',
  data_pagamento: 'Data de Pagamento',
  valor_fatura: 'Valor da Fatura',
};
