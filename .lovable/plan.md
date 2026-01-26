
# Plano: Corrigir Exibição do Histórico de Cobrança

## Problemas Identificados

### Problema 1: Cliente MICHELE CRISTIANE JOVINO SILVA
A cobrança foi disparada **antes** da correção da foreign key, por isso falhou. Após a correção, os disparos para JARBAS e PEDRO funcionaram perfeitamente. Para resolver, basta enviar novamente a mensagem para MICHELE.

### Problema 2: Página de Cobrança não atualiza em tempo real
Após enviar uma mensagem WhatsApp, o histórico de tentativas não é atualizado automaticamente. O usuário precisa atualizar manualmente a página.

**Causa:** O `fetchAttempts` só é executado quando o `selectedCustomer` muda, mas após o envio da mensagem, o cliente selecionado permanece o mesmo.

### Problema 3: Página de Detalhes do Cliente sem histórico
A página `CustomerDetail.tsx` exibe um texto fixo "Nenhuma tentativa de cobrança registrada" - **não busca dados reais do banco de dados**.

---

## Soluções Propostas

### Solução 1: Atualização Automática na Página de Cobrança

Modificar o hook `useCollection.ts` para expor uma função que força o refetch das tentativas e promessas para o cliente selecionado.

**Arquivo:** `src/hooks/useCollection.ts`

**Mudanças:**
- Adicionar função `refreshHistory` que chama `fetchAttempts` e `fetchPromises`
- Expor essa função no retorno do hook

**Arquivo:** `src/components/collection/MessageTemplates.tsx`

**Mudanças:**
- Atualizar `onMessageSent` para também refrescar o histórico

**Arquivo:** `src/pages/Collection.tsx`

**Mudanças:**
- Passar uma função que atualiza tanto a fila quanto o histórico

### Solução 2: Implementar Histórico Real na Página de Detalhes

Criar uma busca de `collection_attempts` e `payment_promises` na página `CustomerDetail.tsx`.

**Arquivo:** `src/hooks/useCustomers.ts`

**Mudanças:**
- Adicionar busca de `collection_attempts` e `payment_promises` no `useCustomerDetail`
- Retornar esses dados junto com as informações do cliente

**Arquivo:** `src/pages/CustomerDetail.tsx`

**Mudanças:**
- Importar e usar o componente `HistoryTimeline` já existente
- Exibir as tentativas e promessas reais do banco

---

## Fluxo Atualizado

```text
Usuário envia WhatsApp
         │
         ▼
  ┌─────────────────────┐
  │ Edge Function       │
  │ registra tentativa  │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │ onMessageSent()     │
  │ chamado             │
  └──────────┬──────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ refreshHistory()         │  ← NOVO
  │ + refreshQueue()         │
  │ (atualiza histórico      │
  │  e fila em tempo real)   │
  └──────────────────────────┘
```

---

## Resumo dos Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useCollection.ts` | Adicionar função `refreshHistory` para forçar refetch de tentativas e promessas |
| `src/pages/Collection.tsx` | Atualizar `onMessageSent` para também chamar `refreshHistory` |
| `src/hooks/useCustomers.ts` | Adicionar busca de `collection_attempts` e `payment_promises` no `useCustomerDetail` |
| `src/pages/CustomerDetail.tsx` | Usar componente `HistoryTimeline` para exibir histórico real |

---

## Benefícios

1. **Atualização em tempo real**: Histórico atualiza imediatamente após enviar mensagem
2. **Histórico completo**: Página de detalhes do cliente mostra todas as tentativas de cobrança
3. **Consistência**: Mesmo componente `HistoryTimeline` usado em ambas as páginas
4. **Experiência fluida**: Operador pode fazer cobranças em sequência sem precisar atualizar a página

---

## Sobre MICHELE CRISTIANE JOVINO SILVA

Para registrar a cobrança dela, basta:
1. Acessar a página de Cobrança
2. Localizar a cliente MICHELE CRISTIANE JOVINO SILVA
3. Selecionar um template e enviar novamente

Agora que a foreign key está corrigida, o registro será salvo automaticamente.
