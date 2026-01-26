

# Plano: Envio de Mensagens WhatsApp via Webhook

## Objetivo
Substituir a abertura do WhatsApp Web pelo envio automático de mensagens através de um webhook, utilizando as instâncias WhatsApp conectadas no sistema.

## Situação Atual
- O botão "Abrir WhatsApp" no componente `MessageTemplates` abre o WhatsApp Web com a mensagem pré-preenchida
- O usuário precisa enviar manualmente
- Já temos instâncias WhatsApp conectadas no banco de dados

## Solução Proposta
Criar uma Edge Function que receba os dados da mensagem e chame o webhook do n8n para disparo automático, e atualizar o componente `MessageTemplates` para usar esse fluxo.

---

## Fluxo de Envio

```text
Usuário seleciona template
         │
         ▼
Usuário clica "Enviar WhatsApp"
         │
         ▼
  ┌─────────────────────┐
  │ Seleciona instância │  (se houver mais de uma conectada)
  │ conectada           │
  └──────────┬──────────┘
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
  │ Toast de sucesso    │
  │ ou erro             │
  └─────────────────────┘
```

---

## Etapas de Implementação

### 1. Criar Edge Function `send-whatsapp`

**Arquivo:** `supabase/functions/send-whatsapp/index.ts`

**Responsabilidades:**
- Receber os dados da mensagem (telefone, mensagem, instance_id)
- Validar que a instância está conectada
- Chamar o webhook do n8n para disparo
- Retornar sucesso ou erro

**Dados enviados ao webhook:**
```json
{
  "instance_id": "rfe56023e0359b1",
  "token": "bd7edd56-e98c-46f0-93ea-7e6c058c37d4",
  "phone": "5511999999999",
  "message": "Olá João! Identificamos uma pendência..."
}
```

### 2. Atualizar `supabase/config.toml`

Adicionar a configuração da nova Edge Function.

### 3. Criar Hook `useSendWhatsapp`

**Arquivo:** `src/hooks/useSendWhatsapp.ts`

**Responsabilidades:**
- Buscar instâncias conectadas
- Função para enviar mensagem via Edge Function
- Gerenciar estado de loading/erro

### 4. Atualizar Componente `MessageTemplates`

**Arquivo:** `src/components/collection/MessageTemplates.tsx`

**Mudanças:**
- Adicionar prop `customerPhone` para o número do destinatário
- Importar e usar o hook `useSendWhatsapp`
- Substituir `window.open(wa.me...)` por chamada à Edge Function
- Adicionar seletor de instância (se houver múltiplas conectadas)
- Mostrar estado de loading durante envio
- Mostrar toast de sucesso/erro

### 5. Atualizar Página `Collection`

**Arquivo:** `src/pages/Collection.tsx`

**Mudanças:**
- Passar `customerPhone` para o componente `MessageTemplates`

---

## Detalhes Técnicos

### Edge Function: send-whatsapp

```text
POST /functions/v1/send-whatsapp
Authorization: Bearer <user_token>

Body:
{
  "instance_id": string,
  "phone": string,
  "message": string
}

Response (sucesso):
{
  "success": true,
  "message_id": string (opcional, se o webhook retornar)
}

Response (erro):
{
  "success": false,
  "error": string
}
```

### Webhook URL (n8n)
```
https://n8n.srv743366.hstgr.cloud/webhook-test/b6e0f090-6b10-4eb6-a26f-1bc9fd21ae8b
```

### Interface Atualizada do MessageTemplates

```text
┌─────────────────────────────────────┐
│  Templates de Mensagem              │
├─────────────────────────────────────┤
│  [Lista de templates WhatsApp]      │
│  [Lista de templates E-mail]        │
├─────────────────────────────────────┤
│  Template selecionado:              │
│  ┌─────────────────────────────┐    │
│  │  Conteúdo editável          │    │
│  │  ...                        │    │
│  └─────────────────────────────┘    │
│                                     │
│  Enviar via: [Instância: whats-8538]│  ← NOVO
│                                     │
│  [Copiar]  [Enviar WhatsApp]        │  ← Botão atualizado
└─────────────────────────────────────┘
```

---

## Resumo dos Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/send-whatsapp/index.ts` | Criar |
| `supabase/config.toml` | Modificar |
| `src/hooks/useSendWhatsapp.ts` | Criar |
| `src/components/collection/MessageTemplates.tsx` | Modificar |
| `src/pages/Collection.tsx` | Modificar |

---

## Validações e Tratamentos de Erro

1. **Sem instância conectada:** Mostrar alerta pedindo para conectar uma instância em Configurações
2. **Telefone inválido/ausente:** Mostrar erro informando que o cliente não possui telefone cadastrado
3. **Erro no webhook:** Mostrar toast com mensagem de erro e opção de tentar novamente
4. **Sucesso:** Mostrar toast confirmando o envio e registrar a tentativa automaticamente

