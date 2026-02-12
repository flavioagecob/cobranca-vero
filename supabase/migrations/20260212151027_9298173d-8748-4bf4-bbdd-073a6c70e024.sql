
-- Function to get invoice stats directly in the database (bypasses 1000 row limit)
CREATE OR REPLACE FUNCTION public.get_invoice_stats(
  p_safra text DEFAULT NULL,
  p_parcela text DEFAULT NULL
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'total', count(*),
    'pendente', count(*) FILTER (WHERE data_pagamento IS NULL AND data_vencimento >= CURRENT_DATE),
    'atrasado', count(*) FILTER (WHERE data_pagamento IS NULL AND data_vencimento < CURRENT_DATE),
    'pago', count(*) FILTER (WHERE data_pagamento IS NOT NULL),
    'valor_total', COALESCE(sum(valor_fatura), 0),
    'valor_pendente', COALESCE(sum(valor_fatura) FILTER (WHERE data_pagamento IS NULL), 0),
    'valor_atrasado', COALESCE(sum(valor_fatura) FILTER (WHERE data_pagamento IS NULL AND data_vencimento < CURRENT_DATE), 0)
  )
  FROM operator_contracts
  WHERE (p_safra IS NULL OR mes_safra_cadastro = p_safra)
    AND (p_parcela IS NULL OR numero_fatura = p_parcela);
$$;

-- Function to get unique filter options (bypasses 1000 row limit)
CREATE OR REPLACE FUNCTION public.get_invoice_filter_options()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'safras', COALESCE((SELECT json_agg(s ORDER BY s) FROM (SELECT DISTINCT mes_safra_cadastro AS s FROM operator_contracts WHERE mes_safra_cadastro IS NOT NULL) t), '[]'::json),
    'parcelas', COALESCE((SELECT json_agg(p ORDER BY p) FROM (SELECT DISTINCT numero_fatura AS p FROM operator_contracts WHERE numero_fatura IS NOT NULL) t), '[]'::json)
  );
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_invoice_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invoice_filter_options TO authenticated;
