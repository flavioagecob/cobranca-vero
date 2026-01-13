export type AttemptChannel = 'telefone' | 'whatsapp' | 'email' | 'sms' | 'presencial';
export type AttemptResult = 'contato_efetivo' | 'sem_contato' | 'numero_invalido' | 'caixa_postal' | 'recado' | 'ocupado';
export type PromiseStatus = 'pendente' | 'cumprida' | 'quebrada' | 'cancelada';

export interface CollectionAttempt {
  id: string;
  customer_id: string;
  invoice_id: string | null;
  user_id: string;
  canal: AttemptChannel;
  resultado: AttemptResult;
  observacoes: string | null;
  data_tentativa: string;
  created_at: string;
  // Joined
  customer?: {
    id: string;
    nome: string;
    cpf_cnpj: string;
  };
  user?: {
    full_name: string;
  };
}

export interface PaymentPromise {
  id: string;
  customer_id: string;
  invoice_id: string | null;
  attempt_id: string | null;
  user_id: string;
  valor_prometido: number;
  data_promessa: string;
  data_pagamento_previsto: string;
  status: PromiseStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customer?: {
    id: string;
    nome: string;
    cpf_cnpj: string;
  };
}

export interface CollectionQueueItem {
  customer_id: string;
  customer_name: string;
  customer_cpf_cnpj: string;
  customer_phone: string | null;
  customer_phone2: string | null;
  customer_email: string | null;
  total_pendente: number;
  faturas_atrasadas: number;
  max_dias_atraso: number;
  ultima_tentativa: string | null;
  ultima_promessa: string | null;
  priority_score: number;
}

export interface MessageTemplate {
  id: string;
  nome: string;
  canal: AttemptChannel;
  assunto: string | null;
  conteudo: string;
  variaveis: string[];
  ativo: boolean;
}

// Channel configurations
export const CHANNEL_CONFIG: Record<AttemptChannel, { label: string; icon: string; color: string }> = {
  telefone: { label: 'Telefone', icon: 'Phone', color: 'text-blue-600' },
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle', color: 'text-emerald-600' },
  email: { label: 'E-mail', icon: 'Mail', color: 'text-amber-600' },
  sms: { label: 'SMS', icon: 'MessageSquare', color: 'text-purple-600' },
  presencial: { label: 'Presencial', icon: 'User', color: 'text-muted-foreground' },
};

export const RESULT_CONFIG: Record<AttemptResult, { label: string; color: string }> = {
  contato_efetivo: { label: 'Contato Efetivo', color: 'bg-emerald-500/10 text-emerald-600' },
  sem_contato: { label: 'Sem Contato', color: 'bg-amber-500/10 text-amber-600' },
  numero_invalido: { label: 'Número Inválido', color: 'bg-destructive/10 text-destructive' },
  caixa_postal: { label: 'Caixa Postal', color: 'bg-muted text-muted-foreground' },
  recado: { label: 'Recado', color: 'bg-blue-500/10 text-blue-600' },
  ocupado: { label: 'Ocupado', color: 'bg-amber-500/10 text-amber-600' },
};

export const PROMISE_STATUS_CONFIG: Record<PromiseStatus, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  cumprida: { label: 'Cumprida', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  quebrada: { label: 'Quebrada', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  cancelada: { label: 'Cancelada', color: 'bg-muted text-muted-foreground border-border' },
};

// Default message templates
export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    nome: 'Lembrete de Vencimento',
    canal: 'whatsapp',
    assunto: null,
    conteudo: `Olá {nome}! 👋

Identificamos que você possui uma fatura no valor de {valor} com vencimento para {data_vencimento}.

Para sua comodidade, segue o link para pagamento: {link_pagamento}

Em caso de dúvidas, estamos à disposição.

Atenciosamente,
Equipe de Cobrança`,
    variaveis: ['nome', 'valor', 'data_vencimento', 'link_pagamento'],
    ativo: true,
  },
  {
    id: '2',
    nome: 'Aviso de Atraso',
    canal: 'whatsapp',
    assunto: null,
    conteudo: `Olá {nome}! 

Verificamos que sua fatura no valor de {valor}, vencida em {data_vencimento}, encontra-se em aberto há {dias_atraso} dias.

Evite a suspensão dos serviços. Entre em contato para regularizar sua situação.

📞 Atendimento: (11) XXXX-XXXX

Aguardamos seu retorno!`,
    variaveis: ['nome', 'valor', 'data_vencimento', 'dias_atraso'],
    ativo: true,
  },
  {
    id: '3',
    nome: 'Negociação',
    canal: 'whatsapp',
    assunto: null,
    conteudo: `Olá {nome}!

Temos uma proposta especial para você regularizar sua situação.

Valor original: {valor}
Proposta de acordo: {valor_acordo}
Condições: {condicoes}

Esta oferta é válida por tempo limitado. Entre em contato para mais detalhes!`,
    variaveis: ['nome', 'valor', 'valor_acordo', 'condicoes'],
    ativo: true,
  },
  {
    id: '4',
    nome: 'Confirmação de Promessa',
    canal: 'whatsapp',
    assunto: null,
    conteudo: `Olá {nome}!

Confirmamos o registro da sua promessa de pagamento:

💰 Valor: {valor_prometido}
📅 Data prevista: {data_promessa}

Lembre-se de efetuar o pagamento até a data combinada para evitar novas cobranças.

Obrigado pela colaboração!`,
    variaveis: ['nome', 'valor_prometido', 'data_promessa'],
    ativo: true,
  },
  {
    id: '5',
    nome: 'E-mail de Cobrança',
    canal: 'email',
    assunto: 'Aviso de Pendência Financeira - {numero_fatura}',
    conteudo: `Prezado(a) {nome},

Identificamos que existe uma pendência financeira em seu nome referente à fatura {numero_fatura}, no valor de {valor}, com vencimento em {data_vencimento}.

Solicitamos a regularização desta pendência o mais breve possível para evitar a interrupção dos serviços.

Para sua comodidade, disponibilizamos as seguintes formas de pagamento:
- Boleto bancário
- PIX
- Cartão de crédito

Em caso de dúvidas ou para negociação, entre em contato pelo telefone (11) XXXX-XXXX.

Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.

Atenciosamente,
Departamento Financeiro`,
    variaveis: ['nome', 'numero_fatura', 'valor', 'data_vencimento'],
    ativo: true,
  },
];
