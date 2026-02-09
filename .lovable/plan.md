
# Adicionar OS (Numero do Contrato) na Exportacao de Faturas

## Objetivo

Incluir o campo **OS** (ordem de servico da base de vendas) nos dados de faturas, tanto na tabela visivel quanto na exportacao Excel. Isso permitira o cruzamento dos dados exportados com a base de vendas importada.

## Como funciona hoje

A query de faturas busca dados de `operator_contracts` e faz join com `customers`, mas nao inclui o join com `sales_base`. O campo `sales_base_id` existe em `operator_contracts` e a tabela `sales_base` contem o campo `os`.

## Alteracoes

### 1. `src/hooks/useInvoices.ts`
- Adicionar o join com `sales_base` na query Supabase: `sales_base:sales_base_id(os)`
- Mapear o campo `os` da sales_base no objeto Invoice processado

### 2. `src/types/invoice.ts`
- Adicionar o campo `os` (string | null) na interface `Invoice`

### 3. `src/pages/Invoices.tsx`
- Adicionar a coluna **OS** no mapeamento de exportacao Excel, antes de "Cliente"

### 4. `src/components/invoices/InvoiceTable.tsx`
- Adicionar a coluna **OS** na tabela visivel (opcional, mas recomendado para consistencia)

## Detalhes tecnicos

A query Supabase sera atualizada de:
```
customer:customers(id, nome, cpf_cnpj, telefone, email)
```
Para:
```
customer:customers(id, nome, cpf_cnpj, telefone, email),
sales_base:sales_base_id(os)
```

O campo `os` sera extraido do resultado do join e mapeado para `invoice.os`. Na exportacao, aparecera como coluna "OS" no arquivo Excel.
