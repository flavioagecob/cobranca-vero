

# Plano: Corrigir Redirecionamento Inicial para Operadores

## Problema

Quando um usuário com role `cobrador` (Operador) faz login, ele é automaticamente redirecionado para `/dashboard`, que só permite `admin` e `supervisor`. Isso causa o "acesso negado".

## Solução

Criar um componente de redirecionamento inteligente que direciona o usuário para a página correta baseado no seu role.

---

## Implementação

### 1. Criar Componente de Redirecionamento Inteligente

**Arquivo:** `src/components/HomeRedirect.tsx`

Componente que verifica o role do usuário e redireciona:
- `admin` / `supervisor` → `/dashboard`
- `cobrador` → `/collection`

```typescript
// Lógica:
const { role, isLoading, session } = useAuth();

if (isLoading) return <Loader />;
if (!session) return <Navigate to="/login" />;

// Redirecionar baseado no role
if (role === 'cobrador') {
  return <Navigate to="/collection" replace />;
}

// Admin e supervisor vão para dashboard
return <Navigate to="/dashboard" replace />;
```

### 2. Atualizar App.tsx

Substituir o redirecionamento fixo por um componente inteligente:

**De:**
```tsx
<Route path="/" element={<Navigate to="/dashboard" replace />} />
```

**Para:**
```tsx
<Route path="/" element={<HomeRedirect />} />
```

---

## Fluxo Após Correção

```text
Operador faz login
       |
       v
  Autenticação OK
       |
       v
  Redireciona para "/"
       |
       v
  +------------------+
  | HomeRedirect     |
  | verifica role    |
  +--------+---------+
           |
    +------+------+
    |             |
    v             v
 cobrador    admin/supervisor
    |             |
    v             v
/collection   /dashboard
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/HomeRedirect.tsx` | **CRIAR** - Componente de redirecionamento inteligente |
| `src/App.tsx` | Usar `HomeRedirect` na rota "/" |

---

## Resultado Esperado

1. Operador (cobrador) faz login → vai para `/collection`
2. Administrador faz login → vai para `/dashboard`
3. Supervisor faz login → vai para `/dashboard`
4. Ninguém mais recebe "acesso negado" ao entrar

