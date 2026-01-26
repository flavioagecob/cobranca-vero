
Objetivo: corrigir de forma definitiva (1) o “Acesso negado” logo após login do operador e (2) a lentidão introduzida após as últimas alterações, sem comprometer segurança (roles continuam na tabela `user_roles`).

## O que encontrei (causa raiz)

### 1) Operador cai em “Acesso Negado” logo após login
No `src/pages/Login.tsx` existe este trecho:

- `const from = location.state?.from?.pathname || '/dashboard';`
- Ao logar com sucesso: `navigate(from, { replace: true });`

Ou seja: quando o operador entra pela página inicial/login (sem `state.from`), o app sempre manda para **/dashboard**.  
Como `/dashboard` é restrito a `admin/supervisor`, o operador cai em **/unauthorized** imediatamente.

Isso explica exatamente o comportamento que você marcou: “Logo após login” e “Página inicial/login”.

### 2) Lentidão (páginas lentas)
No `src/contexts/AuthContext.tsx`, o `onAuthStateChange` está com callback `async` e faz queries Supabase dentro dele:

```ts
supabase.auth.onAuthStateChange(async (event, currentSession) => {
  ...
  await fetchUserData(...)
  setIsLoading(false)
})
```

Esse padrão costuma causar travamentos/lentidão (deadlocks/espera desnecessária) porque:
- o listener de auth pode disparar com frequência (ex: refresh de token),
- e chamadas Supabase dentro do callback podem bloquear o fluxo de atualização do estado de sessão.

Além disso, hoje o AuthContext faz “duas inicializações”: `onAuthStateChange` + `getSession()` (duplica trabalho).

## Estratégia definitiva (o que vamos mudar)

### A) Consertar o redirecionamento pós-login (definitivo)
Mudaremos o fluxo do `Login.tsx` para **não mandar por padrão para /dashboard**.

Opções seguras; vamos implementar a mais robusta:
1) Após login bem-sucedido, navegar para `/` (em vez de `from`).
2) Deixar o `/` decidir o destino via `HomeRedirect` (com role carregada).
3) Opcionalmente preservar “from” somente quando fizer sentido (ex: usuário tentou `/customers/123`), mas com validação por role.

Resultado esperado:
- Operador: login -> `/` -> HomeRedirect -> `/collection`
- Admin/Supervisor: login -> `/` -> HomeRedirect -> `/dashboard`

### B) Refatorar AuthContext para eliminar lentidão/deadlocks
Vamos reestruturar o AuthContext para seguir um modelo “state machine” simples e performático:

1) `onAuthStateChange` **100% síncrono**:
   - apenas atualizar `session` e `user`
   - marcar que a autenticação inicial foi resolvida (ex: `authInitialized = true`)
   - não chamar `fetchUserData` ali

2) Buscar `profile` e `role` em um `useEffect` separado, disparado por `user?.id`:
   - quando `userId` muda:
     - resetar `profile/role`
     - setar `userDataLoading = true`
     - buscar `users_profile` e `user_roles`
     - setar `userDataLoading = false`
   - usar um `requestId` (ref) para ignorar respostas antigas (evita corrida quando troca usuário rapidamente)

3) Evitar duplicidade:
   - ou removemos o `getSession()` e confiamos no evento inicial do `onAuthStateChange` (se disponível),
   - ou mantemos `getSession()` mas com um guard para não “dobrar” o carregamento.

4) Definir claramente estados:
   - `isLoading = !authInitialized || userDataLoading`
   - criar um indicador para “role carregada mas não existe” (por exemplo `userDataLoaded` + `role === null`)
     - isso evita spinner infinito e melhora diagnósticos.

### C) Fortalecer as regras do ProtectedRoute e HomeRedirect
Hoje `ProtectedRoute` só bloqueia quando `role` existe. Vamos deixar isso mais correto:

- Se tem `session` mas ainda estamos carregando dados do usuário: mostrar loader
- Se dados carregaram e `role` está ausente (não existe linha em `user_roles`): mandar para `/unauthorized` com mensagem “usuário sem permissão/role não atribuída”
- Se `allowedRoles` existe e a role não está na lista: `/unauthorized`

E no `HomeRedirect`:
- se não autenticado -> `/login`
- se autenticado e ainda carregando role -> loader
- se role ausente -> `/unauthorized`
- role `cobrador` -> `/collection`
- role `admin/supervisor` -> `/dashboard`

## Sequência de implementação (passo a passo)

1) Ajustar `src/pages/Login.tsx`
   - trocar `from` default de `'/dashboard'` para `'/'`
   - ao sucesso de login, navegar para `'/'` (ou aguardar role e decidir)
   - (opcional) manter `from` somente se for uma rota permitida ao role (validação após role carregar)

2) Refatorar `src/contexts/AuthContext.tsx`
   - tornar callback do `onAuthStateChange` síncrono
   - mover carregamento de `profile/role` para `useEffect` por `userId`
   - adicionar `authInitialized`, `userDataLoading`, `userDataLoaded`
   - evitar chamadas duplicadas (onAuthStateChange + getSession) com guard

3) Atualizar `src/components/ProtectedRoute.tsx`
   - bloquear corretamente enquanto role não carregou
   - tratar role ausente como acesso negado (usuário sem role)

4) Atualizar `src/components/HomeRedirect.tsx`
   - usar o novo estado de loading/loaded
   - mandar role ausente para `/unauthorized` ao invés de loader infinito

5) Testes manuais (checklist)
   - Operador entra pela página inicial -> vai para `/collection` (sem passar por unauthorized)
   - Admin entra -> `/dashboard`
   - Supervisor entra -> `/dashboard`
   - Operador tentando acessar `/dashboard` diretamente:
     - se não logado: vai login
     - após login: deve cair em `/collection` (ou `/unauthorized` dependendo da escolha de preservar “from”; preferível mandar para home do role)
   - Navegação geral: sem travamentos; conferir que não há várias requisições repetidas de `users_profile/user_roles` a cada refresh de token

## Observações de performance adicionais (se ainda houver lentidão)
Se após isso ainda ficar lento, os próximos pontos a avaliar (sem mudar regra de roles):
- reduzir o número de selects no bootstrap (buscar apenas colunas necessárias)
- garantir que telas pesadas (ex: listas) não estejam fazendo fetch extra em loop
- revisar hooks (ex: `useCollection`) para confirmar que não está refazendo queries com alta frequência

## Entregáveis (arquivos que serão alterados)
- `src/pages/Login.tsx` (corrigir redirecionamento pós-login)
- `src/contexts/AuthContext.tsx` (refatoração para remover deadlock/lentidão e robustez de carregamento)
- `src/components/ProtectedRoute.tsx` (bloqueio correto com role carregada)
- `src/components/HomeRedirect.tsx` (decisão definitiva e tratamento de role ausente)

Resultado final esperado:
- Operador não cai mais em “Acesso negado” ao entrar (definitivo, mesmo acessando via login/raiz)
- Redução perceptível de lentidão por remover chamadas Supabase de dentro do callback de auth e eliminar duplicidades de carregamento
- Fluxo de autenticação/role determinístico e estável (sem race condition e sem spinner infinito)
