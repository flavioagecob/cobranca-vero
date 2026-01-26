

# Plano: Adicionar Políticas RLS para Operador (Cobrador)

## Causa Raiz

A tabela `operator_contracts` não possui política RLS para o role `cobrador`. Quando o operador acessa a página de Cobrança:

1. O hook `useCollection` tenta buscar contratos em `operator_contracts`
2. A RLS bloqueia a query (não há política para `cobrador`)
3. Retorna array vazio `[]`
4. A fila de cobrança aparece vazia

As políticas atuais são:
- `operator_contracts_admin_all`: Admin pode tudo
- `operator_contracts_supervisor_select`: Supervisor pode SELECT
- **Cobrador: NENHUMA POLÍTICA** (bloqueado)

## Solução

Criar política RLS para permitir que o role `cobrador` possa fazer SELECT na tabela `operator_contracts`.

## Mudanças Necessárias

### 1. Nova Política RLS

Criar uma nova política para permitir SELECT na tabela `operator_contracts` para usuários com role `cobrador`:

```sql
CREATE POLICY "operator_contracts_cobrador_select" 
ON public.operator_contracts 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'cobrador'::app_role));
```

Esta política:
- Aplica-se apenas a operações SELECT (leitura)
- Verifica se o usuário autenticado tem o role `cobrador`
- Permite que o operador veja todos os contratos (necessário para a fila de cobrança)

## Arquivo a Criar

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/[timestamp]_add_cobrador_operator_contracts_policy.sql` | Migration SQL com a nova política |

## Resultado Esperado

Após aplicar a migration:
- Operadores poderão visualizar a fila de cobrança com todos os clientes inadimplentes
- A página de Cobrança funcionará igual ao admin/supervisor
- A segurança é mantida (operador só pode SELECT, não pode modificar contratos)

## Verificação Adicional

Após a correção, confirmar que:
1. A fila de cobrança mostra clientes com faturas vencidas
2. Os filtros de Safra e Parcela funcionam corretamente
3. O operador consegue registrar tentativas e promessas (já tem permissão)

