
-- Create delinquency_reason enum
CREATE TYPE public.delinquency_reason AS ENUM (
  'cliente_nao_contratou',
  'desconhece_divida',
  'valor_errado',
  'fraude',
  'nao_recebeu_boleto',
  'internet_sem_funcionar',
  'nao_recebeu_chip',
  'nao_ativado_streaming',
  'nao_gerou_boleto'
);

-- Add nullable column to collection_attempts
ALTER TABLE public.collection_attempts
ADD COLUMN delinquency_reason public.delinquency_reason;
