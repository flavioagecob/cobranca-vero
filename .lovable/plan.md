

## Graficos de Evolucao Temporal no Dashboard

### Resumo
Adicionar dois graficos ao dashboard que mostram a evolucao mensal de inadimplencia e pagamentos, usando os dados de `operator_contracts` ja carregados pelo hook. Os graficos usarao a biblioteca Recharts (ja instalada) e os componentes de chart do shadcn/ui ja existentes.

---

### Dados

Agrupar os contratos ja carregados no hook por mes de vencimento (`data_vencimento`):
- Para cada mes (ex: "2025-01", "2025-02"...): contar faturas vencidas nao pagas (inadimplentes), faturas pagas, e somar os valores respectivos
- Ordenar cronologicamente
- Respeitar os filtros de Safra e Parcela ja aplicados

### Novo tipo de dados no hook

```text
MonthlyTrendItem {
  month: string        // "Jan/25", "Fev/25"...
  overdueCount: number
  overdueValue: number
  paidCount: number
  paidValue: number
  pendingCount: number
  pendingValue: number
}
```

O array `monthlyTrend` sera adicionado ao `DashboardStats` e calculado dentro do loop existente em `fetchStats`, sem queries adicionais ao banco.

---

### Componente novo: `MonthlyTrendChart`

- Card com titulo "Evolucao Mensal"
- Tabs para alternar entre "Quantidade" e "Valor (R$)"
- Grafico de barras empilhadas (BarChart do Recharts) mostrando por mes:
  - Vermelho: faturas vencidas (inadimplentes)
  - Amarelo: faturas pendentes (ainda nao vencidas)
  - Verde: faturas pagas
- Tooltip com detalhes ao passar o mouse
- Responsivo usando `ResponsiveContainer`

### Layout do Dashboard atualizado

1. Titulo + Filtros
2. Cards principais (4 colunas)
3. Cards de vencimento (3 colunas)
4. **Grafico de Evolucao Mensal (largura total)**
5. Ranking de Cidades | Contratos por Status

---

### Arquivos modificados

- **`src/hooks/useDashboardStats.ts`** -- adicionar interface `MonthlyTrendItem`, agregar dados por mes dentro do loop existente, incluir `monthlyTrend` no retorno
- **`src/components/dashboard/MonthlyTrendChart.tsx`** (novo) -- componente com BarChart empilhado, tabs Quantidade/Valor, usando `ChartContainer` e `ChartTooltipContent` do shadcn/ui
- **`src/pages/Dashboard.tsx`** -- importar e posicionar o `MonthlyTrendChart` entre os cards de vencimento e o ranking de cidades

### Dependencias
Nenhuma nova. Usa Recharts (ja instalado) e componentes de chart do shadcn/ui (`src/components/ui/chart.tsx`).

