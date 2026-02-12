

# Correcao: Limite de 1000 linhas do Supabase nas Faturas

## Problema identificado

O banco possui **1.847 contratos**, mas o Supabase retorna no maximo **1.000 linhas por consulta** sem aviso. Isso causa:
- Total de Faturas mostrando 237 em vez de 335
- Atrasadas mostrando 32 em vez de 129
- Stats calculados sobre dados incompletos

## Solucao

Criar uma funcao RPC no banco para calcular as estatisticas e implementar busca paginada para a listagem.

### 1. Criar funcao RPC para estatisticas

Criar uma migration SQL com funcao `get_invoice_stats` que recebe os filtros (safra, parcela, overdue_range) e retorna as contagens e somas diretamente no banco, sem limite de linhas.

### 2. Criar funcao RPC para opcoes de filtro

Criar funcao `get_invoice_filter_options` que retorna safras e parcelas unicas usando `SELECT DISTINCT`, evitando buscar todos os registros.

### 3. Atualizar `src/hooks/useInvoices.ts`

- Substituir a query de stats por chamada RPC: `supabase.rpc('get_invoice_stats', { ... })`
- Substituir a query de opcoes de filtro por chamada RPC
- Implementar busca em lotes (batches de 1000) para a query principal de listagem, garantindo que todos os registros filtrados sejam retornados
- Manter a paginacao client-side para exibicao na tabela

### 4. Atualizar `src/hooks/useCollection.ts`

- A query de `fetchFilterOptions` tambem busca todos os contratos sem paginacao - aplicar a mesma correcao com RPC ou DISTINCT

## Detalhes tecnicos

### Funcao RPC (SQL)

```text
CREATE OR REPLACE FUNCTION get_invoice_stats(
  p_safra text DEFAULT NULL,
  p_parcela text DEFAULT NULL
)
RETURNS json AS $$
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
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Busca em lotes (TypeScript)

A listagem principal usara uma funcao que busca em lotes de 1000 registros usando `.range()` ate nao haver mais dados, garantindo que todos os registros filtrados sejam retornados para exibicao e exportacao.

### Arquivos modificados

- Nova migration SQL (funcoes RPC + grant de permissoes)
- `src/hooks/useInvoices.ts` (usar RPC para stats, busca em lotes para listagem)
- `src/hooks/useCollection.ts` (corrigir fetchFilterOptions)

