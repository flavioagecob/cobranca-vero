

## Corrigir Politicas RLS que Impedem Cobradores de Salvar Tentativas

### Problema Identificado
Todas as politicas RLS nas tabelas `collection_attempts` e `payment_promises` estao como **RESTRICTIVE** (nao-permissivas). No PostgreSQL, politicas restritivas funcionam com logica AND -- todas devem passar. Como um cobrador nao e admin nem supervisor, o INSERT sempre falha silenciosamente. O codigo tem um fallback para localStorage que faz parecer que salvou, mas os dados nao vao para o banco.

### Solucao
Recriar as politicas RLS como **PERMISSIVE** (que usam logica OR -- basta uma passar). Tambem remover as politicas genericas duplicadas ("Users can insert/view attempts") que sao redundantes.

### Alteracoes

#### 1. Migracao SQL - Tabela `collection_attempts`
- Dropar todas as politicas existentes
- Recriar como PERMISSIVE:
  - **admin**: ALL (usando `has_role(auth.uid(), 'admin')`)
  - **supervisor**: ALL (usando `has_role(auth.uid(), 'supervisor')`)
  - **cobrador SELECT**: SELECT (usando `has_role(auth.uid(), 'cobrador')`)
  - **cobrador INSERT**: INSERT (com check `has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid()`)
  - **cobrador UPDATE**: UPDATE (usando `has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid()`)
  - **cobrador DELETE**: DELETE (usando `has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid()`)

#### 2. Migracao SQL - Tabela `payment_promises`
- Mesma correcao: dropar politicas e recriar como PERMISSIVE
- Remover politicas genericas duplicadas ("Users can manage/view promises")

#### 3. Codigo - `src/hooks/useCollection.ts`
- Remover o fallback silencioso para localStorage no `registerAttempt` e `registerPromise`
- Quando o insert falhar, propagar o erro (throw) para que o toast de erro apareca na tela em vez de fingir que salvou
- Manter a funcao de leitura do localStorage como fallback apenas para fetch (leitura)

### Impacto
- Cobradores poderao salvar tentativas e promessas corretamente no banco de dados
- Erros de salvamento serao exibidos ao usuario em vez de serem silenciados
- Dados existentes no banco nao sao afetados

