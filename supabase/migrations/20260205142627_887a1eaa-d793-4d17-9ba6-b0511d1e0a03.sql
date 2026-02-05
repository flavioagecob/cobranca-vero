-- Adicionar novos campos à tabela sales_base para cobrança preventiva
ALTER TABLE public.sales_base 
ADD COLUMN IF NOT EXISTS mes_safra text,
ADD COLUMN IF NOT EXISTS data_vencimento date,
ADD COLUMN IF NOT EXISTS valor numeric,
ADD COLUMN IF NOT EXISTS status_cobranca text DEFAULT 'pendente';

-- Criar índice para consultas por data de vencimento (cobrança preventiva)
CREATE INDEX IF NOT EXISTS idx_sales_base_data_vencimento ON public.sales_base(data_vencimento);

-- Criar índice para consultas por mês safra
CREATE INDEX IF NOT EXISTS idx_sales_base_mes_safra ON public.sales_base(mes_safra);

-- Criar índice para consultas por status de cobrança
CREATE INDEX IF NOT EXISTS idx_sales_base_status_cobranca ON public.sales_base(status_cobranca);

-- Comentários para documentação
COMMENT ON COLUMN public.sales_base.mes_safra IS 'Mês da safra no formato YYYY-MM';
COMMENT ON COLUMN public.sales_base.data_vencimento IS 'Data de vencimento previsto para cobrança preventiva';
COMMENT ON COLUMN public.sales_base.valor IS 'Valor a ser cobrado';
COMMENT ON COLUMN public.sales_base.status_cobranca IS 'Status da cobrança: pendente, cobrado, pago';