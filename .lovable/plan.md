
# Plano: Sistema de Criação de Usuários nas Configurações

## Resumo

Implementar uma interface de gestão de usuários na aba Configurações, permitindo que administradores criem novos usuários (operadores) com níveis de acesso diferenciados.

---

## Mapeamento de Roles

| Role no Sistema | Nome Exibido | Acesso |
|-----------------|--------------|--------|
| `admin` | Administrador | Acesso completo |
| `cobrador` | Operador | Clientes, Faturas, Cobrança |

**Nota:** O enum `app_role` já possui `'admin' | 'supervisor' | 'cobrador'`. Utilizaremos `cobrador` para o perfil "Operador" que você mencionou.

---

## Permissões por Tipo de Usuário

### Administrador (`admin`)
- Dashboard
- Clientes
- Faturas
- Cobrança
- Conciliação
- Importação
- Relatórios
- Configurações

### Operador (`cobrador`)
- Clientes
- Faturas
- Cobrança

---

## Implementação

### 1. Backend: Trigger para Criação Automática de Perfil

Criar uma migration que adiciona um trigger `SECURITY DEFINER` para criar automaticamente o registro em `users_profile` quando um novo usuário é criado no `auth.users`.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profile (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Backend: Políticas RLS para Administradores

Adicionar políticas que permitem administradores:
- Visualizar todos os perfis de usuários
- Inserir e atualizar roles de usuários

```sql
-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.users_profile FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem gerenciar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### 3. Backend: Edge Function para Criação de Usuário

Criar edge function `create-user` que usa a `service_role` key para criar usuários no Supabase Auth (necessário para contornar a limitação do client-side).

```typescript
// supabase/functions/create-user/index.ts
- Recebe: email, password, full_name, role, phone
- Cria usuário no auth.users
- Cria entrada no user_roles
- Retorna sucesso ou erro
```

### 4. Frontend: Componentes de Gestão de Usuários

#### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/components/settings/UserList.tsx` | Lista de usuários com ações |
| `src/components/settings/CreateUserDialog.tsx` | Dialog para criar novo usuário |
| `src/hooks/useUsers.ts` | Hook para gerenciar usuários |

#### Modificações

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Settings.tsx` | Adicionar nova aba "Usuários" |
| `src/components/layout/AppSidebar.tsx` | Ajustar permissões para `cobrador` não ver Dashboard |
| `src/App.tsx` | Ajustar rota Dashboard para `['admin', 'supervisor']` |
| `src/contexts/AuthContext.tsx` | Adicionar label "Operador" para role `cobrador` |

---

## Fluxo de Criação de Usuário

```text
Admin acessa Configurações > Usuários
              |
              v
      Clica em "Novo Usuário"
              |
              v
    Preenche formulário:
    - Nome completo
    - Email
    - Senha
    - Telefone (opcional)
    - Tipo: Administrador ou Operador
              |
              v
    +-----------------------+
    | Edge Function         |
    | create-user           |
    +-----------------------+
              |
              v
    +-------------------------+
    | 1. Cria em auth.users   |
    | 2. Trigger cria profile |
    | 3. Insere em user_roles |
    +-------------------------+
              |
              v
    Usuário aparece na lista
```

---

## Detalhes da Interface

### Aba Usuários (nova)

- Card com lista de usuários cadastrados
- Botão "Novo Usuário" no header
- Cada usuário mostra:
  - Avatar com iniciais
  - Nome completo
  - Email
  - Badge com tipo (Administrador/Operador)
  - Botões de ação (editar, excluir)

### Dialog de Criação

- Campo: Nome completo (obrigatório)
- Campo: Email (obrigatório, validação de email)
- Campo: Senha (obrigatório, mínimo 6 caracteres)
- Campo: Telefone (opcional)
- Select: Tipo de usuário (Administrador/Operador)
- Botão: Criar Usuário

---

## Arquivos a Criar

| Arquivo | Tipo |
|---------|------|
| `supabase/functions/create-user/index.ts` | Edge Function |
| `src/components/settings/UserList.tsx` | Componente |
| `src/components/settings/CreateUserDialog.tsx` | Componente |
| `src/hooks/useUsers.ts` | Hook |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Settings.tsx` | Adicionar aba Usuários |
| `src/components/layout/AppSidebar.tsx` | Dashboard: `['admin', 'supervisor']` |
| `src/App.tsx` | Dashboard: `allowedRoles={['admin', 'supervisor']}` |

## Migrations SQL

| Mudança |
|---------|
| Criar trigger `handle_new_user` |
| Criar políticas RLS para admins em `users_profile` e `user_roles` |

---

## Segurança

1. **Edge Function com Service Role**: A criação de usuários usa a `service_role` key no backend, nunca exposta ao cliente
2. **RLS**: Apenas admins podem ver todos os usuários e gerenciar roles
3. **Validação**: Email e senha validados no frontend com zod antes do envio
4. **Trigger SECURITY DEFINER**: Permite criar profile mesmo com RLS ativo

---

## Resultado Esperado

1. Administrador acessa Configurações > Usuários
2. Visualiza lista de todos os usuários do sistema
3. Pode criar novos usuários (operadores ou administradores)
4. Operadores fazem login e veem apenas: Clientes, Faturas, Cobrança
5. Administradores têm acesso completo

