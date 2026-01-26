

# Plano: Corrigir Registro de Contato - Foreign Key Incorreta

## Problema Identificado

A mensagem WhatsApp para **MICHELE CRISTIANE JOVINO SILVA** foi **enviada com sucesso** pelo n8n, porém o **registro do contato falhou** devido a um erro de foreign key no banco de dados.

### Erro nos Logs

```
Error registering attempt: {
  code: "23503",
  details: 'Key (invoice_id)=(2f44c1c9-9c8b-4c76-b56c-527f5242cafd) is not present in table "invoices".',
  message: 'insert or update on table "collection_attempts" violates foreign key constraint "collection_attempts_invoice_id_fkey"'
}
```

### Causa Raiz

A tabela `collection_attempts` está configurada com uma foreign key que referencia a tabela `invoices`:

```
collection_attempts.invoice_id → invoices.id
```

**Porém**, os dados da fila de cobrança vêm da tabela `operator_contracts`, não de `invoices`. Quando passamos o ID do contrato como `invoice_id`, o banco rejeita porque esse UUID não existe na tabela `invoices`.

---

## Solução

Alterar a foreign key da coluna `invoice_id` na tabela `collection_attempts` para referenciar `operator_contracts` em vez de `invoices`.

### Opção 1: Alterar a Foreign Key (Recomendado)

Criar uma migration que:
1. Remove a constraint antiga (`collection_attempts_invoice_id_fkey`)
2. Cria uma nova constraint referenciando `operator_contracts`

### Opção 2: Permitir NULL ou Remover a FK

Se a tabela `invoices` for usada para outro propósito:
1. Tornar o campo `invoice_id` nullable
2. Remover a foreign key constraint completamente

---

## Implementacao

### Migration SQL

```sql
-- Remove a foreign key antiga que referencia 'invoices'
ALTER TABLE collection_attempts
DROP CONSTRAINT IF EXISTS collection_attempts_invoice_id_fkey;

-- Cria nova foreign key referenciando 'operator_contracts'
ALTER TABLE collection_attempts
ADD CONSTRAINT collection_attempts_invoice_id_fkey
FOREIGN KEY (invoice_id) REFERENCES operator_contracts(id) ON DELETE CASCADE;
```

### Tabela payment_promises

Verificar se a tabela `payment_promises` também possui a mesma foreign key incorreta e aplicar a mesma correção se necessário.

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Criar para corrigir as foreign keys |

---

## Resultado Esperado

Apos a correcao:
1. O envio de mensagem WhatsApp continuara funcionando normalmente
2. O registro de contato sera salvo automaticamente no banco
3. O historico do cliente sera atualizado em tempo real

