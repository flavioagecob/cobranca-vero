
# Corrigir historico na Cobranca Preventiva

## Problema identificado

Os logs do Supabase mostram o erro exato:

```
ERROR: insert or update on table "collection_attempts" violates foreign key constraint "collection_attempts_invoice_id_fkey"
Key (invoice_id)=(d33b6763-...) is not present in table "operator_contracts".
```

A coluna `invoice_id` da tabela `collection_attempts` tem uma Foreign Key que referencia `operator_contracts(id)`. Porem, na cobranca preventiva, o sistema passa o ID da tabela `sales_base` como `invoice_id` -- tanto no registro manual (formulario) quanto no automatico (envio de WhatsApp). Como esse ID nao existe na tabela `operator_contracts`, o INSERT falha silenciosamente e o historico nunca e gravado.

Na cobranca regular isso funciona porque la o `invoice_id` vem de `operator_contracts.id`, que e a tabela correta.

## Solucao

Tornar a coluna `invoice_id` **nullable** na tabela `collection_attempts`, permitindo que registros preventivos sejam gravados sem um vinculo com `operator_contracts`. Clientes preventivos nao possuem contratos na operadora, entao nao ha um ID valido para referenciar.

### Alteracoes

**1. Migration SQL (nova migration)**
- `ALTER TABLE collection_attempts ALTER COLUMN invoice_id DROP NOT NULL;`
- Isso permite inserir tentativas sem `invoice_id`

**2. `src/hooks/usePreventiveCollection.ts`**
- Na funcao `registerAttempt`, passar `invoice_id` como `null` em vez de `sales_base.id`
- O campo `customer_id` ja e suficiente para vincular o historico ao cliente

**3. `src/components/preventive/PreventiveMessageTemplates.tsx`**
- Na chamada a `sendMessage`, passar `undefined` como `invoiceId` em vez de `salesBaseId`

**4. `supabase/functions/send-whatsapp/index.ts`**
- No bloco que registra o `collection_attempt` automatico, inserir `invoice_id` somente quando ele for fornecido (tratar como opcional)
- Alterar a condicao de `if (customer_id && invoice_id)` para `if (customer_id)`, registrando o contato mesmo sem `invoice_id`

**5. `src/pages/PreventiveCollection.tsx`**
- Remover o `invoice_id: selectedCustomer.id` do payload de `registerAttempt`, ou passar `null`

Essas mudancas garantem que o historico funcione para ambos os fluxos (preventivo e regular) sem quebrar a integridade referencial existente.
