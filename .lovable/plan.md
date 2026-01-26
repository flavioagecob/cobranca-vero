
# Plano: Registro Automático de Contato Após Envio de WhatsApp

## Objetivo
Quando uma mensagem WhatsApp for disparada automaticamente, registrar a tentativa de contato (`collection_attempt`) no banco de dados de forma automática, eliminando a necessidade de registro manual.

## Situação Atual
- A Edge Function `send-whatsapp` dispara a mensagem via webhook do n8n
- O n8n executa o disparo e encerra o workflow
- O registro de tentativa (`collection_attempts`) é feito manualmente pelo operador através do formulário `AttemptForm`

## Solução Proposta
Registrar a tentativa de contato diretamente na Edge Function `send-whatsapp` após receber confirmação de sucesso do webhook do n8n.

---

## Fluxo Atualizado

```text
Usuário clica "Enviar WhatsApp"
         │
         ▼
  ┌─────────────────────┐
  │ Edge Function       │
  │ send-whatsapp       │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │ Webhook n8n         │
  │ (disparo real)      │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │ n8n retorna sucesso │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────────────┐
  │ Edge Function registra      │   ← NOVO
  │ collection_attempt no banco │
  └──────────┬──────────────────┘
             │
             ▼
  ┌─────────────────────┐
  │ Toast de sucesso    │
  │ + histórico atualiza│
  └─────────────────────┘
```

---

## Etapas de Implementação

### 1. Atualizar Edge Function `send-whatsapp`

**Arquivo:** `supabase/functions/send-whatsapp/index.ts`

**Mudanças:**
- Receber dados adicionais no payload: `customer_id` e `invoice_id`
- Após sucesso do webhook, inserir registro em `collection_attempts`
- Retornar o ID da tentativa criada na resposta

**Novo Payload:**
```json
{
  "instance_id": "string",
  "phone": "string",
  "message": "string",
  "customer_id": "string",
  "invoice_id": "string"
}
```

**Registro a inserir:**
```json
{
  "customer_id": "uuid do cliente",
  "invoice_id": "uuid da fatura",
  "collector_id": "uuid do usuário logado",
  "channel": "whatsapp",
  "status": "sucesso",
  "notes": "Mensagem enviada automaticamente via template"
}
```

### 2. Atualizar Hook `useSendWhatsapp`

**Arquivo:** `src/hooks/useSendWhatsapp.ts`

**Mudanças:**
- Adicionar parâmetros `customer_id` e `invoice_id` na função `sendMessage`
- Passar esses dados para a Edge Function

### 3. Atualizar Componente `MessageTemplates`

**Arquivo:** `src/components/collection/MessageTemplates.tsx`

**Mudanças:**
- Receber props adicionais: `customerId` e `invoiceId`
- Passar esses dados na chamada `sendMessage`

### 4. Atualizar Página `Collection`

**Arquivo:** `src/pages/Collection.tsx`

**Mudanças:**
- Passar `customerId` e `invoiceId` para o componente `MessageTemplates`
- Após envio bem-sucedido, atualizar o histórico de tentativas (já feito pelo hook useCollection)

---

## Detalhes Técnicos

### Edge Function: send-whatsapp (atualizada)

```text
POST /functions/v1/send-whatsapp
Authorization: Bearer <user_token>

Body:
{
  "instance_id": string,
  "phone": string,
  "message": string,
  "customer_id": string,    ← NOVO
  "invoice_id": string      ← NOVO
}

Response (sucesso):
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "attempt_id": string      ← NOVO (ID do registro criado)
}
```

### Dados do collection_attempt

| Campo | Valor |
|-------|-------|
| customer_id | UUID do cliente |
| invoice_id | UUID da fatura |
| collector_id | UUID do usuário logado (extraído do token) |
| channel | 'whatsapp' |
| status | 'sucesso' |
| notes | 'Mensagem enviada automaticamente via template' |

---

## Sobre o n8n

O workflow do n8n **não precisa de alteração** para esta implementação, pois:
- O n8n já retorna `{"message": "Workflow was started"}` com status 200
- Isso é suficiente para considerarmos que o disparo foi iniciado
- O registro será feito pela Edge Function após receber essa confirmação

Se no futuro o n8n precisar retornar mais informações (como ID da mensagem do WhatsApp), basta ajustar o workflow para retornar esses dados e a Edge Function para capturá-los.

---

## Resumo dos Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/send-whatsapp/index.ts` | Adicionar registro de `collection_attempt` após sucesso |
| `src/hooks/useSendWhatsapp.ts` | Adicionar parâmetros `customer_id` e `invoice_id` |
| `src/components/collection/MessageTemplates.tsx` | Receber e passar `customerId` e `invoiceId` |
| `src/pages/Collection.tsx` | Passar dados adicionais para `MessageTemplates` |

---

## Benefícios

1. **Automação completa**: Um clique dispara a mensagem E registra o contato
2. **Histórico preciso**: Todas as mensagens enviadas ficam registradas automaticamente
3. **Menos trabalho manual**: Operador não precisa preencher formulário após enviar mensagem
4. **Rastreabilidade**: Cada tentativa tem o registro do usuário que enviou
