// Currency formatter
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// CPF/CNPJ formatter
export const formatCpfCnpj = (value: string | null | undefined): string => {
  if (!value) return '-';
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // CPF: 000.000.000-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return value;
};

// Phone formatter
export const formatPhone = (value: string | null | undefined): string => {
  if (!value) return '-';
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // Mobile: (00) 00000-0000
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Landline: (00) 0000-0000
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return value;
};

// Date formatter - handles ISO dates without timezone offset issues
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  
  // If ISO format YYYY-MM-DD, parse directly to avoid timezone issues
  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${day}/${month}/${year}`;
  }
  
  // For other formats, use native parser
  const date = new Date(value);
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

// DateTime formatter
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

// Relative time formatter
export const formatRelativeTime = (value: string | null | undefined): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '-';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
  if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
  
  return formatDate(value);
};

// Days overdue calculator - handles ISO dates without timezone offset issues
export const calculateDaysOverdue = (dueDate: string | null | undefined): number => {
  if (!dueDate) return 0;
  
  let date: Date;
  
  // If ISO format YYYY-MM-DD, parse directly to avoid timezone issues
  const isoDateMatch = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    date = new Date(dueDate);
  }
  
  if (isNaN(date.getTime())) return 0;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diff = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

// Truncate text
export const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Status helpers
export const getStatusColor = (status: string | null | undefined): string => {
  const statusMap: Record<string, string> = {
    ativo: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    inativo: 'bg-muted text-muted-foreground border-border',
    inactive: 'bg-muted text-muted-foreground border-border',
    cancelado: 'bg-destructive/10 text-destructive border-destructive/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    pendente: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    pago: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    atrasado: 'bg-destructive/10 text-destructive border-destructive/20',
    overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  
  const normalized = (status || '').toLowerCase().trim();
  return statusMap[normalized] || 'bg-muted text-muted-foreground border-border';
};

// UF list
export const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
