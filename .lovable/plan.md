

# Plano: Corrigir Acesso Negado + Edição de Usuários

## Problema 1: Acesso Negado (Race Condition)

### Causa Raiz

No `AuthContext.tsx`, o `isLoading` é setado como `false` antes que o `fetchUserData` termine de carregar o `role`. Quando `HomeRedirect` verifica o `role`, ele ainda é `null`, então o usuário é redirecionado para `/dashboard` (comportamento padrão).

```text
Login bem-sucedido
        |
        v
  onAuthStateChange dispara
        |
        v
  setTimeout(fetchUserData, 0)  <-- Agendado, não executado
        |
        v
  setIsLoading(false)  <-- Problema! Role ainda não carregou
        |
        v
  HomeRedirect executa com role = null
        |
        v
  Vai para /dashboard (default)
        |
        v
  ACESSO NEGADO (cobrador não pode acessar)
```

### Solucao

1. **AuthContext.tsx**: Aguardar o `fetchUserData` completar antes de setar `isLoading = false`
2. **HomeRedirect.tsx**: Aguardar o `role` carregar (além de `isLoading`)
3. **Unauthorized.tsx**: Redirecionar de volta para `/` ao invés de `/dashboard`

---

## Problema 2: Edição de Usuários

### Componentes a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/settings/EditUserDialog.tsx` | Dialog para editar usuario existente |
| `supabase/functions/update-user/index.ts` | Edge function para atualizar email/senha |

### Modificacoes

| Arquivo | Mudanca |
|---------|---------|
| `src/components/settings/UserList.tsx` | Adicionar botao de editar em cada linha |
| `src/hooks/useUsers.ts` | Adicionar funcao `updateUser` |

---

## Detalhes Tecnicos

### 1. Corrigir AuthContext (Race Condition)

```typescript
// Antes (problema):
if (currentSession?.user) {
  setTimeout(() => {
    fetchUserData(currentSession.user.id);
  }, 0);
}
setIsLoading(false);  // Role ainda nao carregou!

// Depois (corrigido):
if (currentSession?.user) {
  await fetchUserData(currentSession.user.id);
}
setIsLoading(false);  // Agora o role ja carregou
```

### 2. Corrigir HomeRedirect (Aguardar Role)

```typescript
// Adicionar verificacao se role esta carregando
if (isLoading) {
  return <Loader />;
}

// NOVO: Se session existe mas role ainda nao carregou, aguardar
if (session && role === null) {
  return <Loader />;
}
```

### 3. Corrigir Unauthorized (Botao)

```typescript
// Antes:
<Button onClick={() => navigate('/dashboard')}>

// Depois:
<Button onClick={() => navigate('/')}>
```

### 4. Edge Function update-user

A funcao vai:
- Receber: `user_id`, `full_name`, `email`, `phone`, `role`, `password` (opcional)
- Verificar se quem chama e admin
- Atualizar `users_profile` (nome, phone)
- Atualizar `user_roles` (role)
- Se email mudou: `adminClient.auth.admin.updateUserById(user_id, { email })`
- Se senha fornecida: `adminClient.auth.admin.updateUserById(user_id, { password })`

### 5. EditUserDialog

Campos do formulario:
- Nome completo (obrigatorio)
- Email (obrigatorio)
- Telefone (opcional)
- Tipo: Administrador / Operador
- Nova senha (opcional, campo vazio = nao altera)

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/contexts/AuthContext.tsx` | Aguardar fetchUserData completar |
| `src/components/HomeRedirect.tsx` | Aguardar role carregar |
| `src/pages/Unauthorized.tsx` | Redirecionar para `/` |
| `src/components/settings/UserList.tsx` | Adicionar botao editar |
| `src/hooks/useUsers.ts` | Adicionar updateUser |

## Arquivos a Criar

| Arquivo | Tipo |
|---------|------|
| `src/components/settings/EditUserDialog.tsx` | Componente React |
| `supabase/functions/update-user/index.ts` | Edge Function |

## Migrations SQL

Adicionar politica RLS para admins poderem fazer UPDATE em `users_profile`.

---

## Fluxo Corrigido de Login

```text
Login bem-sucedido
        |
        v
  onAuthStateChange dispara
        |
        v
  await fetchUserData()  <-- Aguarda completar
        |
        v
  role = 'cobrador' (carregado)
        |
        v
  setIsLoading(false)
        |
        v
  HomeRedirect executa com role = 'cobrador'
        |
        v
  Redireciona para /collection
        |
        v
  SUCESSO!
```

---

## Resultado Esperado

1. Operadores fazem login e vao direto para `/collection`
2. Administradores fazem login e vao para `/dashboard`
3. Administradores podem editar usuarios existentes (nome, email, telefone, tipo, senha)
4. Botao "Voltar" na pagina de acesso negado leva para a home correta

