

# Plano: Manter Seleção + Dashboard de Estatísticas + Indicador de Cobrança

## Problema Principal

Quando `refreshQueue()` é chamado após uma cobrança, a função `fetchQueue` sempre seleciona o primeiro cliente da lista (linha 189-191), ignorando o cliente que estava selecionado.

## Soluções

### 1. Manter Cliente Selecionado Após Atualização

Modificar a função `fetchQueue` para preservar o cliente selecionado se ele ainda existir na nova lista.

**Arquivo:** `src/hooks/useCollection.ts`

**Mudancas:**
- Guardar o `customer_id` do cliente selecionado antes de atualizar
- Apos construir a nova lista, verificar se o cliente anterior ainda existe
- Se existir, manter a selecao nele; se nao, selecionar o primeiro

### 2. Dashboard de Estatísticas na Pagina de Cobranca

Adicionar cards de estatísticas no topo da pagina mostrando:
- Total de clientes na fila
- Clientes já cobrados (hoje/total)
- Valor total pendente
- Taxa de contato

**Arquivo:** `src/hooks/useCollection.ts`

**Mudancas:**
- Adicionar busca de estatísticas de cobranças (quantos clientes foram contatados)
- Retornar `stats` no hook

**Arquivo:** `src/pages/Collection.tsx`

**Mudancas:**
- Adicionar componente de cards de estatísticas abaixo do header

### 3. Ícone de Cliente Ja Cobrado

Adicionar um ícone visual (checkmark verde) nos clientes que já possuem pelo menos uma tentativa de cobrança registrada.

**Arquivo:** `src/types/collection.ts`

**Mudancas:**
- Adicionar campo `has_attempt: boolean` ao `CollectionQueueItem`

**Arquivo:** `src/hooks/useCollection.ts`

**Mudancas:**
- Buscar os `customer_id`s que ja possuem tentativas de cobranca
- Popular o campo `has_attempt` e `ultima_tentativa` na construcao da fila

**Arquivo:** `src/components/collection/CollectionQueue.tsx`

**Mudancas:**
- Importar ícone `CheckCircle` do lucide-react
- Exibir o ícone ao lado do nome quando `has_attempt === true`

---

## Fluxo Corrigido

```text
Usuario envia WhatsApp
         |
         v
  +---------------------+
  | refreshHistory()    |
  | (atualiza timeline) |
  +----------+----------+
             |
             v
  +---------------------+
  | refreshQueue()      |
  | COM preservacao     |  <-- CORRIGIDO
  | do cliente atual    |
  +----------+----------+
             |
             v
  Cliente permanece selecionado
  + icone de "cobrado" aparece
```

---

## Resumo dos Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/types/collection.ts` | Adicionar campo `has_attempt: boolean` ao `CollectionQueueItem` |
| `src/hooks/useCollection.ts` | 1) Preservar cliente selecionado apos refresh. 2) Buscar estatísticas. 3) Popular `has_attempt` |
| `src/components/collection/CollectionQueue.tsx` | Exibir icone CheckCircle para clientes ja cobrados |
| `src/pages/Collection.tsx` | Adicionar cards de estatísticas no topo |

---

## Detalhes Técnicos

### Logica de Preservacao do Cliente

```typescript
// Antes de atualizar a queue, salvar o ID atual
const currentSelectedId = selectedCustomer?.customer_id;

// Apos construir queueItems...
if (queueItems.length > 0) {
  // Tentar encontrar o cliente anteriormente selecionado
  const previousIndex = currentSelectedId 
    ? queueItems.findIndex(c => c.customer_id === currentSelectedId)
    : -1;
    
  if (previousIndex >= 0) {
    // Manter o mesmo cliente selecionado
    setSelectedCustomer(queueItems[previousIndex]);
    setSelectedIndex(previousIndex);
  } else {
    // Selecionar o primeiro se o anterior nao existe mais
    setSelectedCustomer(queueItems[0]);
    setSelectedIndex(0);
  }
}
```

### Busca de Clientes Cobrados

```typescript
// Buscar todos os customer_ids que ja tem tentativas
const { data: attemptedCustomers } = await supabase
  .from('collection_attempts')
  .select('customer_id, created_at')
  .order('created_at', { ascending: false });

// Criar um Map para lookup rapido
const attemptMap = new Map<string, string>();
attemptedCustomers?.forEach(a => {
  if (!attemptMap.has(a.customer_id)) {
    attemptMap.set(a.customer_id, a.created_at);
  }
});

// Ao construir cada item da fila:
has_attempt: attemptMap.has(customer.id),
ultima_tentativa: attemptMap.get(customer.id) || null,
```

### Estrutura de Estatísticas

```typescript
interface CollectionStats {
  totalNaFila: number;
  cobradosHoje: number;
  cobradosTotal: number;
  valorTotalPendente: number;
}
```

---

## Benefícios

1. **Fluxo contínuo**: Operador pode cobrar clientes em sequência sem perder a posição
2. **Visibilidade**: Ícone mostra claramente quem já foi contatado
3. **Métricas**: Dashboard permite acompanhar produtividade em tempo real
4. **Performance**: Lookup via Map é O(1), não afeta tempo de carregamento

