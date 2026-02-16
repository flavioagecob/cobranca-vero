

## Dashboard Analitico - Filtros, Remocao de Acoes Rapidas e Ranking de Cidades

### Resumo
Transformar o Dashboard em uma visao analitica com filtros por Safra e Parcela que atualizam todos os cards dinamicamente, remover a secao de Acoes Rapidas, e adicionar um ranking de cidades por inadimplencia/adimplencia.

---

### 1. Adicionar Filtros de Safra e Parcela ao Dashboard

**Hook `useDashboardStats`**:
- Receber parametros opcionais `safra` e `parcela`
- Buscar as opcoes de filtro do banco usando a funcao `get_invoice_filter_options()` ja existente
- Aplicar os filtros na query de `operator_contracts` (filtrar por `mes_safra_cadastro` e `numero_fatura`)
- Recalcular todas as metricas (pendentes, pagas, vencidas, contratos) apenas com os dados filtrados
- Retornar tambem as listas de opcoes de safra e parcela

**Componente `DashboardFilters`** (novo):
- Dois selects: Safra e Parcela, seguindo o mesmo padrao visual ja usado em `InvoiceFilters`
- Botao "Limpar" quando algum filtro estiver ativo
- Posicionado logo abaixo do titulo do Dashboard

**Dashboard.tsx**:
- Gerenciar estado dos filtros (`safra`, `parcela`)
- Passar filtros para o hook `useDashboardStats`
- Todos os cards (principais, vencimentos, contratos por status) reagirem aos filtros

---

### 2. Remover Acoes Rapidas

- Remover toda a secao "Acoes Rapidas" (links para Importar, Clientes, Relatorios) do Dashboard
- Remover tambem o card de "Atividade Recente" (placeholder vazio)
- Manter o card "Contratos por Status" que ja tem valor analitico

---

### 3. Ranking de Cidades por Inadimplencia/Adimplencia

**Dados**: Fazer JOIN entre `operator_contracts` e `customers` para agrupar por cidade:
- Contar faturas vencidas nao pagas (inadimplentes) por cidade
- Contar faturas pagas (adimplentes) por cidade
- Calcular valor total em atraso por cidade
- Respeitar os filtros de Safra/Parcela aplicados

**Componente `CityRanking`** (novo):
- Card com duas abas (Tabs): "Mais Inadimplencia" e "Mais Adimplencia"
- Lista das top 10 cidades em cada aba
- Cada linha mostra: nome da cidade, quantidade de faturas, valor total, e uma barra de progresso proporcional
- Cores: vermelho para inadimplencia, verde para adimplencia

**Layout final do Dashboard (de cima para baixo)**:
1. Titulo + Filtros (Safra, Parcela)
2. Cards principais (4 colunas: Clientes, Pendentes, Pagas, Contratos Habilitados)
3. Cards de vencimento (3 colunas: Vencidos, Hoje, Proximos 7 dias)
4. Secao inferior (2 colunas): Ranking de Cidades | Contratos por Status

---

### Detalhes Tecnicos

**Arquivos modificados**:
- `src/hooks/useDashboardStats.ts` - adicionar filtros, buscar opcoes, incluir dados de cidades
- `src/pages/Dashboard.tsx` - estado de filtros, novo layout sem acoes rapidas
- `src/components/dashboard/DashboardFilters.tsx` (novo) - componente de filtros
- `src/components/dashboard/CityRanking.tsx` (novo) - componente de ranking de cidades

**Query de cidades**: O hook fara um JOIN client-side entre os contratos ja carregados e uma query separada de `customers(id, cidade)` para montar o ranking. Os filtros de Safra/Parcela serao aplicados antes da agregacao por cidade.

**Dependencias**: Nenhuma nova -- usa apenas componentes UI ja existentes (Select, Card, Tabs, Progress do shadcn/ui).

