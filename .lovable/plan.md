
# Marcação "Pago pela Empresa" em Faturas

## Objetivo
Permitir marcar faturas/contratos como "pagos pela empresa" para evitar estorno de comissão pela operadora. Essa marcação deve ser **permanente** e **imune a reimportações** da planilha da operadora.

## Como vai funcionar

1. Na tela de Cobranca ou na ficha do cliente, o cobrador/supervisor podera marcar uma fatura como "Pago pela Empresa"
2. A marcacao fica visivel com um badge/tag destacado na fatura
3. Quando a planilha da operadora for reimportada e atualizar o status para "pago", a marcacao de "pago pela empresa" permanece intacta
4. Nos relatorios futuros sera possivel filtrar e contabilizar quantos clientes e qual valor total foi pago pela empresa

## Detalhes Tecnicos

### 1. Banco de Dados - Nova coluna na tabela `operator_contracts`

Adicionar duas colunas:
- `pago_pela_empresa` (boolean, default false) - flag principal
- `pago_pela_empresa_at` (timestamp, nullable) - quando foi marcado
- `pago_pela_empresa_by` (uuid, nullable) - quem marcou

### 2. Protecao na Importacao

No hook `useImport.ts`, ao construir o `contractData` para update (linha ~304-318), **excluir** as colunas `pago_pela_empresa`, `pago_pela_empresa_at` e `pago_pela_empresa_by` do objeto de update. Como essas colunas nunca sao incluidas no `contractData`, elas naturalmente nao serao sobrescritas. Porem, para garantia extra, sera adicionado um comentario explicativo no codigo.

### 3. Tipos TypeScript

Atualizar `src/types/customer.ts` (interface `OperatorContract`) para incluir os novos campos.

### 4. UI - Botao de Marcacao

Adicionar um botao "Pago pela Empresa" na interface de cobranca. Locais candidatos:
- Na `CustomerInfoCard` ao lado das informacoes financeiras
- Na ficha detalhada do cliente (`CustomerDetailDialog`) junto a lista de contratos

O botao ira:
- Chamar o Supabase para atualizar `pago_pela_empresa = true`, registrar timestamp e user_id
- Mostrar confirmacao antes de executar (AlertDialog)
- Exibir badge "Pago pela Empresa" nos contratos marcados

### 5. Hook dedicado

Criar funcao `markAsPaidByCompany(contractId: string)` no hook `useCollection` que:
- Atualiza `operator_contracts` com `pago_pela_empresa = true`, `pago_pela_empresa_at = now()`, `pago_pela_empresa_by = user.id`
- Atualiza a UI localmente

### 6. Visualizacao

- Badge roxo/azul "Pago pela Empresa" nos contratos marcados
- Na fila de cobranca, contratos marcados nao devem aparecer como pendentes
- No `HistoryTimeline` ou `CustomerInfoCard`, exibir indicador visual

### 7. Impacto nos Relatorios

Os campos `pago_pela_empresa` e `valor_fatura` permitirao gerar relatorios com:
- Total de contratos pagos pela empresa
- Valor total pago pela empresa
- Listagem por safra/periodo

## Sequencia de Implementacao

1. Migration SQL (nova coluna)
2. Atualizar tipos TypeScript
3. Adicionar funcao de marcacao no hook
4. Criar componente de UI com botao + confirmacao
5. Proteger dados na importacao (comentario + validacao)
6. Exibir badge nos contratos marcados
