export type AttemptChannel = 'telefone' | 'whatsapp' | 'email' | 'sms' | 'presencial';
export type AttemptResult = 'contato_efetivo' | 'sem_contato' | 'numero_invalido' | 'caixa_postal' | 'recado' | 'ocupado';
export type PromiseStatus = 'pendente' | 'cumprida' | 'quebrada' | 'cancelada';

// Interfaces aligned with Supabase table structure
export interface CollectionAttempt {
  id: string;
  customer_id: string;
  invoice_id: string;
  collector_id: string;
  channel: AttemptChannel;
  status: AttemptResult;
  notes: string | null;
  created_at: string;
}

export interface PaymentPromise {
  id: string;
  invoice_id: string;
  collector_id: string;
  valor_prometido: number;
  data_prometida: string;
  status: PromiseStatus | null;
  created_at: string;
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
  // Store first overdue invoice for attempts/promises
  first_invoice_id?: string;
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

// Simplified message templates - only first name, masked CPF, and value (no payment conditions)
export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    nome: 'Cobrança Simples',
    canal: 'whatsapp',
    assunto: null,
    conteudo: `Olá {nome}!

Identificamos uma pendência em seu nome.

📋 CPF: ***{cpf_ultimos5}
💰 Valor: {valor}

Entre em contato para regularizar sua situação.

Atenciosamente,
Equipe de Cobrança`,
    variaveis: ['nome', 'cpf_ultimos5', 'valor'],
    ativo: true,
  },
  {
    id: '2',
    nome: 'Aviso de Atraso',
    canal: 'whatsapp',
    assunto: null,
    conteudo: `Olá {nome}!

Você possui uma fatura vencida há {dias_atraso} dias.

📋 CPF: ***{cpf_ultimos5}
💰 Valor: {valor}

Evite restrições no seu nome. Entre em contato para regularizar.

Aguardamos seu retorno!`,
    variaveis: ['nome', 'cpf_ultimos5', 'valor', 'dias_atraso'],
    ativo: true,
  },
  {
    id: '3',
    nome: 'Último Aviso',
    canal: 'whatsapp',
    assunto: null,
    conteudo: `Olá {nome}!

⚠️ ÚLTIMO AVISO

Identificamos uma pendência em aberto:

📋 CPF: ***{cpf_ultimos5}
💰 Valor: {valor}

Regularize sua situação para evitar medidas adicionais.

Estamos à disposição para ajudar.`,
    variaveis: ['nome', 'cpf_ultimos5', 'valor'],
    ativo: true,
  },
  {
    id: '4',
    nome: 'Confirmação de Promessa',
    canal: 'whatsapp',
    assunto: null,
    conteudo: `Olá {nome}!

Confirmamos o registro do seu contato.

📋 CPF: ***{cpf_ultimos5}
💰 Valor pendente: {valor}

Lembre-se de efetuar o pagamento conforme combinado para evitar novas cobranças.

Obrigado pela colaboração!`,
    variaveis: ['nome', 'cpf_ultimos5', 'valor'],
    ativo: true,
  },
  {
    id: '5',
    nome: 'E-mail de Cobrança',
    canal: 'email',
    assunto: 'Aviso de Pendência Financeira',
    conteudo: `Prezado(a) {nome},

Identificamos que existe uma pendência financeira em seu nome no valor de {valor}.

CPF: ***{cpf_ultimos5}

Solicitamos a regularização desta pendência o mais breve possível.

Em caso de dúvidas, entre em contato conosco.

Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.

Atenciosamente,
Departamento Financeiro`,
    variaveis: ['nome', 'cpf_ultimos5', 'valor'],
    ativo: true,
  },
];
