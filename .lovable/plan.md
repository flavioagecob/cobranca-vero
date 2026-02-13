

## Rastrear Usuario que Marcou como Pago (para Comissionamento)

### Objetivo
Quando uma fatura for marcada como "pago" e NAO for "pago pela empresa", registrar qual usuario fez essa marcacao. Isso permite controlar comissoes dos cobradores.

### Alteracoes Necessarias

#### 1. Migracao de Banco de Dados
Adicionar duas colunas na tabela `operator_contracts`:
- `marcado_pago_by` (uuid, nullable) - ID do usuario que marcou como pago
- `marcado_pago_at` (timestamptz, nullable) - Data/hora da marcacao

#### 2. `src/hooks/useInvoices.ts`
- Importar `useAuth` para obter o usuario logado
- Na funcao `updateInvoiceStatus`, quando o status for `pago`, incluir `marcado_pago_by: user.id` e `marcado_pago_at: now()` no update
- Quando o status voltar para `pendente`/`atrasado`, limpar esses campos (setar como `null`)
- Incluir no select da query o join com `users_profile` para trazer o nome de quem marcou: adicionar `marcado_pago_by` no select e fazer lookup

#### 3. `src/types/invoice.ts`
- Adicionar campos `marcado_pago_by` e `marcado_pago_by_name` na interface `Invoice`

#### 4. `src/hooks/useInvoices.ts` (fetch)
- Na query de fetch, incluir `marcado_pago_by` no select
- Apos buscar os contratos, fazer uma query separada em `users_profile` para resolver os nomes dos usuarios que marcaram como pago
- Mapear o nome no campo `marcado_pago_by_name` do Invoice

#### 5. `src/components/invoices/InvoiceTable.tsx`
- Na coluna de Status ou em uma nova coluna, quando o status for `pago` e `pago_pela_empresa` for `false`, exibir o nome do usuario que marcou (ex: "Pago - Recebido por: Joao Silva")
- Pode ser um tooltip ou texto pequeno abaixo do badge de status

### Detalhes Tecnicos

- A tabela `operator_contracts` ja tem `pago_pela_empresa_by` para o caso de pago pela empresa. O novo campo `marcado_pago_by` cobre o caso oposto (pago pelo cliente, recebido pelo cobrador)
- As politicas RLS existentes de UPDATE para cobrador e supervisor ja cobrem a atualizacao desses campos
- O `useAuth` ja esta disponivel no projeto via `src/contexts/AuthContext.tsx`

