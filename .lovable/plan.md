

## Corrigir Total de Clientes para Refletir os Filtros

### Problema
O card "Total Clientes" sempre mostra a contagem total de clientes cadastrados, independentemente dos filtros de Safra e Parcela aplicados. Todos os demais cards ja respondem corretamente aos filtros.

### Solucao
Quando um filtro de Safra ou Parcela estiver ativo, calcular o total de clientes unicos a partir dos contratos ja filtrados (usando `customer_id`), em vez de contar todos os clientes da tabela.

### Mudanca tecnica

**Arquivo**: `src/hooks/useDashboardStats.ts`

Na funcao `fetchStats`, apos processar os contratos filtrados:
- Extrair os `customer_id` unicos dos contratos retornados pela query filtrada
- Quando filtros estiverem ativos: usar essa contagem de clientes unicos
- Quando nenhum filtro estiver ativo: manter o comportamento atual (total geral de clientes)

Logica simplificada:
```text
Se safra ou parcela estiverem ativos:
  totalCustomers = quantidade de customer_ids unicos nos contratos filtrados
Senao:
  totalCustomers = contagem total da tabela customers (comportamento atual)
```

### Mudanca visual

**Arquivo**: `src/pages/Dashboard.tsx`

Atualizar o texto descritivo do card "Total Clientes":
- Sem filtro: "clientes cadastrados"
- Com filtro ativo: "clientes no filtro"

### Arquivos modificados
- `src/hooks/useDashboardStats.ts` -- adicionar contagem de clientes unicos dos contratos filtrados
- `src/pages/Dashboard.tsx` -- ajustar label do card conforme estado dos filtros
