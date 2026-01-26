
# Plano: Remover Polling e Usar Apenas Realtime

## Problema Identificado
O sistema está fazendo múltiplas chamadas ao webhook externo porque o polling de status está ativo a cada 5 segundos. O webhook deve ser chamado **apenas uma vez** para iniciar a conexão, e depois o Realtime deve detectar quando o status muda para "connected".

## Causa Raiz
O `useEffect` de polling (linhas 109-115) chama `checkConnectionStatus` a cada 5 segundos, que por sua vez:
1. Chama `onCheckStatus` 
2. Que invoca a edge function `instance-webhook` com `action: 'status'`
3. Que faz uma chamada HTTP ao webhook externo do n8n

## Solução
Remover completamente o polling de status e confiar apenas no Supabase Realtime para detectar quando a instância foi conectada.

---

## Etapas de Implementação

### 1. Remover o polling de fallback
Eliminar o `useEffect` que faz polling a cada 5 segundos.

### 2. Remover a função checkConnectionStatus
Já que não será mais usada, pode ser removida.

### 3. Remover a prop onCheckStatus
Já que não será mais necessária no componente.

---

## Fluxo Corrigido

```text
Usuário clica "Conectar"
         │
         ▼
  ┌─────────────────┐
  │ onConnect()     │  ← Chamada ÚNICA ao webhook
  │ (gera QR Code)  │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐     ┌──────────────────────┐
  │   QR Code       │     │ Realtime Subscription│
  │   Exibido       │◄────│ (sem polling!)       │
  └────────┬────────┘     └──────────┬───────────┘
           │                         │
           │  (n8n atualiza banco)   │
           │                         ▼
           │           status = 'connected'
           │                         │
           │◄────────────────────────┘
           ▼
  ┌─────────────────┐
  │  ✓ Conectado    │
  │  com sucesso    │
  └─────────────────┘
```

---

## Arquivos a Modificar

### 1. ConnectInstanceDialog.tsx
- Remover a prop `onCheckStatus` da interface
- Remover a função `checkConnectionStatus`
- Remover o `useEffect` de polling (linhas 109-115)
- Manter apenas o Realtime subscription

### 2. InstanceList.tsx
- Remover a passagem de `onCheckStatus` para o `ConnectInstanceDialog`

---

## Código Resultante (ConnectInstanceDialog.tsx)

As principais mudanças serão:

**Remover da interface:**
```typescript
interface ConnectInstanceDialogProps {
  instance: Instance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (instanceId: string, token: string) => Promise<ConnectResult>;
  // onCheckStatus removido
}
```

**Remover função e useEffect de polling:**
```typescript
// checkConnectionStatus - REMOVIDO
// useEffect com setInterval - REMOVIDO
```

**Manter apenas o Realtime:**
```typescript
// Supabase Realtime subscription - MANTIDO
useEffect(() => {
  if (!open || !instance) return;

  const channel = supabase
    .channel(`instance-status-${instance.instance_id}`)
    .on('postgres_changes', ...)
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [open, instance, onOpenChange]);
```

---

## Resumo das Alterações
1. **ConnectInstanceDialog.tsx** - Remover polling e prop `onCheckStatus`, manter apenas Realtime
2. **InstanceList.tsx** - Remover passagem de `onCheckStatus` para o dialog
