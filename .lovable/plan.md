

# Plano: Popup de Conexão com Supabase Realtime

## Problema Identificado
O QR Code fica na tela mesmo após a conexão ser realizada porque o polling de status não está detectando corretamente quando a instância foi conectada. O status pode ser atualizado diretamente no banco de dados pelo webhook do n8n, mas o polling não está capturando essa mudança.

## Solução Proposta
Usar **Supabase Realtime** para monitorar mudanças no status da instância diretamente no banco de dados. Quando o status mudar para "connected", exibiremos o popup de sucesso e removeremos o QR Code automaticamente.

## Benefícios
- Resposta imediata quando o status muda no banco
- Não depende do webhook de status funcionar
- Funciona mesmo se o n8n atualizar o banco diretamente
- Mais confiável que polling a cada 3 segundos

---

## Etapas de Implementação

### 1. Verificar Publicação Realtime
Garantir que a tabela `instances` está incluída na publicação do Supabase Realtime para receber eventos de UPDATE.

### 2. Atualizar ConnectInstanceDialog.tsx
Adicionar uma subscription Realtime que escuta mudanças na tabela `instances`:

```text
┌─────────────────────────────────────────────────────┐
│              ConnectInstanceDialog                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Estado: 'loading' | 'qr_code' | 'connected' | 'error'
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Ao abrir o dialog:                         │   │
│  │  1. Mostrar "Gerando QR Code..."            │   │
│  │  2. Chamar onConnect para obter QR          │   │
│  │  3. Mostrar QR Code                         │   │
│  │  4. Iniciar subscription Realtime ← NOVO   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Quando Realtime detectar status=connected: │   │
│  │  1. Mudar estado para 'connected'           │   │
│  │  2. Mostrar popup de sucesso                │   │
│  │  3. Fechar dialog após 2 segundos           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Ao fechar o dialog:                        │   │
│  │  1. Cancelar subscription Realtime          │   │
│  │  2. Resetar estados                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Arquivo: src/components/settings/ConnectInstanceDialog.tsx

**Mudanças:**
1. Importar o cliente Supabase
2. Adicionar useEffect com subscription Realtime para a instância específica
3. Manter o polling como fallback (caso Realtime falhe)
4. Cleanup da subscription quando o dialog fechar

**Código da Subscription Realtime:**
```typescript
// Escutar mudanças no banco para esta instância
useEffect(() => {
  if (!open || !instance) return;

  const channel = supabase
    .channel(`instance-status-${instance.instance_id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'instances',
        filter: `instance_id=eq.${instance.instance_id}`,
      },
      (payload) => {
        const updated = payload.new;
        if (updated.status === 'connected') {
          setState('connected');
          setTimeout(() => onOpenChange(false), 2000);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [open, instance, onOpenChange]);
```

### Arquivo: SQL Migration (se necessário)
Se a tabela `instances` não estiver na publicação Realtime, adicionar:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE instances;
```

---

## Fluxo Visual Atualizado

```text
Usuário clica "Conectar"
         │
         ▼
  ┌─────────────┐
  │  Loading... │  (Gerando QR Code)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     ┌──────────────────────┐
  │  QR Code    │◄────│ Subscription Realtime│
  │  Exibido    │     │ escutando changes    │
  └──────┬──────┘     └──────────┬───────────┘
         │                       │
         │   (n8n atualiza banco)│
         │                       ▼
         │            status = 'connected'
         │                       │
         │◄──────────────────────┘
         ▼
  ┌─────────────┐
  │  ✓ Conectado│  (Popup de sucesso)
  │  com sucesso│
  └──────┬──────┘
         │ (2 segundos)
         ▼
    Dialog fecha
```

---

## Resumo das Alterações
1. **ConnectInstanceDialog.tsx** - Adicionar subscription Realtime para detectar quando status muda para "connected"
2. **Migration SQL** (se necessário) - Garantir que a tabela está na publicação Realtime

