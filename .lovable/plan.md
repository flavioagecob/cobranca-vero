

# Plano: Sistema Completo de Cobranca Preventiva

## Resumo

Transformar a pagina de Cobranca Preventiva de uma lista simples para um sistema operacional completo, similar a pagina de Cobranca de vencidos. Isso inclui:

1. **Nova aba de importacao "Preventiva"** com campos simplificados (sem valor, sem contrato)
2. **Pagina operacional completa** com fila lateral, painel do cliente, templates de mensagem, registro de contato e historico
3. **Cruzamento automatico** quando a base da operadora e importada: se o cliente preventivo aparece na operadora, ele sai da preventiva e entra no fluxo normal

---

## O Que Muda

### Importacao

Hoje existem 2 tipos de importacao: "Base de Vendas" e "Base Operadora". Vamos adicionar um terceiro tipo: **"Base Preventiva"**.

| Campo | Obrigatorio | Descricao |
|-------|-------------|-----------|
| OS (Ordem de Servico) | Sim | Chave de identificacao |
| CPF/CNPJ | Sim | Identificar o cliente |
| Nome | Sim | Nome do cliente |
| Telefone | Nao | Para contato |
| Telefone 2 | Nao | Para contato |
| Email | Nao | Para contato |
| Data Vencimento | Nao | Quando vence |
| Mes Safra | Nao | Safra da venda |

Nota: Sem campo de valor, sem plano, sem produto -- apenas dados basicos para contato preventivo.

### Pagina de Cobranca Preventiva

A pagina atual mostra cards expandiveis. Vamos transforma-la no mesmo layout da Cobranca de vencidos:

- **Coluna esquerda (3 colunas)**: Fila de clientes com busca
- **Coluna direita (9 colunas)**: Painel do cliente selecionado com:
  - Card de informacoes do cliente
  - Templates de mensagem (com templates especificos para lembrete de vencimento)
  - Formulario de registro de tentativa
  - Historico de contatos
  - Navegacao anterior/proximo

### Cruzamento Automatico (Operadora x Preventiva)

Quando a base da operadora e importada, o sistema faz o match pelo campo `os` (OS da sales_base). Se encontrar match:
- O registro `sales_base` correspondente tem seu `status_cobranca` atualizado para `'migrado'`
- O cliente passa a ter contrato na operadora e entra no fluxo normal de cobranca de vencidos
- Na fila preventiva, registros com `status_cobranca = 'migrado'` sao excluidos automaticamente

---

## Detalhes Tecnicos

### 1. Tipo de Importacao

**Arquivo: `src/types/import.ts`**
- Adicionar tipo `'preventive'` ao `ImportType`
- Criar `PREVENTIVE_FIELDS` com campos simplificados (os, cpf_cnpj, nome, telefone, telefone2, email, data_vencimento, mes_safra)
- Adicionar labels dos campos novos

### 2. Pagina de Importacao

**Arquivo: `src/pages/Import.tsx`**
- Adicionar terceira aba "Base Preventiva" com icone CalendarClock
- Atualizar sinonimos de auto-match para os campos preventivos
- Atualizar descricao da aba

### 3. Hook de Importacao

**Arquivo: `src/hooks/useImport.ts`**
- Adicionar funcao `importPreventiveOptimized` similar a `importSalesOptimized`
- Fluxo: upsert customers -> inserir em sales_base com `status_cobranca = 'preventivo'`
- Os registros preventivos sao inseridos na mesma tabela `sales_base` mas com status diferenciado

### 4. Cruzamento na Importacao da Operadora

**Arquivo: `src/hooks/useImport.ts`**
- Ao importar operadora, apos fazer match com sales_base, verificar se o registro tem `status_cobranca = 'preventivo'`
- Se sim, atualizar para `status_cobranca = 'migrado'`
- Isso remove automaticamente o lead da fila preventiva

### 5. Hook da Cobranca Preventiva

**Arquivo: `src/hooks/usePreventiveCollection.ts`**
- Refatorar para retornar dados no formato de fila (similar ao `useCollection`)
- Adicionar: selectedCustomer, selectCustomer, nextCustomer, previousCustomer
- Adicionar: registerAttempt (registrar contato preventivo)
- Filtrar apenas registros com `status_cobranca` diferente de `'migrado'` e `'pago'`
- Buscar historico de tentativas de contato por customer_id

### 6. Pagina de Cobranca Preventiva

**Arquivo: `src/pages/PreventiveCollection.tsx`**
- Reestruturar com layout de 2 paineis (fila + painel do cliente)
- Fila lateral com busca e lista de clientes
- Painel principal com: informacoes do cliente, templates de mensagem, formulario de tentativa, historico
- Navegacao anterior/proximo

### 7. Novos Componentes Preventivos

**Arquivo: `src/components/preventive/PreventiveCustomerCard.tsx`** (criar)
- Card de informacoes do cliente adaptado para preventivo
- Mostra: nome, CPF, telefone, email, data de vencimento, dias ate vencer
- Sem valor pendente (dados preventivos nao tem valor)
- Botoes de acao rapida (ligar, WhatsApp, email)

**Arquivo: `src/components/preventive/PreventiveQueue.tsx`** (refatorar)
- Transformar de lista expandivel para fila lateral compacta (similar a CollectionQueue)
- Mostrar nome, dias ate vencer, badge de status

### 8. Templates de Mensagem Preventivos

**Arquivo: `src/types/collection.ts`**
- Adicionar templates especificos para lembrete de vencimento (tom amigavel, sem cobranca agressiva)
- Variaveis: {nome}, {cpf_ultimos5}, {data_vencimento}

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/types/import.ts` | Modificar | Adicionar tipo 'preventive' e PREVENTIVE_FIELDS |
| `src/pages/Import.tsx` | Modificar | Adicionar aba "Base Preventiva" |
| `src/hooks/useImport.ts` | Modificar | Logica de importacao preventiva + cruzamento |
| `src/hooks/usePreventiveCollection.ts` | Refatorar | Hook completo com fila, selecao, tentativas |
| `src/pages/PreventiveCollection.tsx` | Refatorar | Layout operacional com 2 paineis |
| `src/components/preventive/PreventiveQueue.tsx` | Refatorar | Fila lateral compacta |
| `src/components/preventive/PreventiveCustomerCard.tsx` | Criar | Card do cliente preventivo |
| `src/components/preventive/PreventiveStatsCards.tsx` | Manter | Atualizar stats se necessario |
| `src/components/preventive/PreventiveFilters.tsx` | Manter | Filtros existentes |
| `src/types/collection.ts` | Modificar | Adicionar templates preventivos |

**Total: ~10 arquivos**

---

## Fluxo do Operador

```text
1. Admin importa "Base Preventiva" (clientes novos)
2. Leads aparecem na Cobranca Preventiva
3. Operador trabalha a fila: envia lembretes, registra contatos
4. Admin importa "Base Operadora" (faturas vencidas)
5. Sistema cruza automaticamente:
   - Se cliente preventivo aparece na operadora -> sai da preventiva
   - Cliente passa para Cobranca (vencidos) com contrato e fatura
6. Leads que nao cruzaram continuam na preventiva
```

