export type InvoiceStatus = 'pendente' | 'pago' | 'atrasado' | 'negociado' | 'cancelado';

// Sorting types
export type InvoiceSortField = 'numero_fatura' | 'customer_name' | 'mes_safra_cadastro' | 'valor' | 'data_vencimento' | 'dias_atraso';
export type SortDirection = 'asc' | 'desc';

export interface InvoiceSortState {
  field: InvoiceSortField;
  direction: SortDirection;
}

export interface Invoice {
  id: string;
  customer_id: string;
  sales_base_id: string | null;
  operator_contract_id: string | null;
  numero_fatura: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: InvoiceStatus;
  dias_atraso: number;
  mes_safra_cadastro: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: {
    id: string;
    nome: string;
    cpf_cnpj: string;
    telefone: string | null;
    email: string | null;
  };
}

export interface InvoiceFilters {
  search: string;
  status: InvoiceStatus | 'all';
  overdueRange: 'all' | '1-15' | '16-30' | '31-60' | '60+';
  dateFrom: string;
  dateTo: string;
  safra: string;
}

export interface InvoiceStats {
  total: number;
  pendente: number;
  pago: number;
  atrasado: number;
  valorTotal: number;
  valorPendente: number;
  valorAtrasado: number;
}

// Status badge configuration
export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  pago: {
    label: 'Pago',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  atrasado: {
    label: 'Atrasado',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  negociado: {
    label: 'Negociado',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

// Overdue color configuration
export const getOverdueColor = (days: number): string => {
  if (days <= 0) return 'text-emerald-600'; // Not overdue
  if (days <= 15) return 'text-amber-500'; // Yellow
  if (days <= 30) return 'text-orange-500'; // Orange
  return 'text-destructive'; // Red
};

export const getOverdueBadgeClass = (days: number): string => {
  if (days <= 0) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (days <= 15) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (days <= 30) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  return 'bg-destructive/10 text-destructive border-destructive/20';
};
