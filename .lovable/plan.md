

# Correcao da Paginacao nas Faturas (e verificacao em Clientes)

## Problema

O hook `useInvoices.ts` **nunca atualiza o campo `pagination.total`** apos buscar os dados. O valor permanece em `0` (valor inicial), o que faz com que:
- O componente `InvoicePagination` retorne `null` (ele verifica `if (total === 0) return null`)
- Mesmo que apareca, `totalPages` calcula como `0`, impedindo a navegacao

A pagina de **Clientes** nao tem esse problema -- ela atualiza `pagination.total` corretamente na linha 570 do hook.

## Causa raiz

Na refatoracao para busca em lotes (batch fetching), o codigo salva `allFilteredInvoices` e `invoices` (pagina atual), mas esqueceu de chamar `setPagination` com o total de registros filtrados.

## Correcao

### `src/hooks/useInvoices.ts`

Adicionar uma unica linha apos o slice de paginacao (por volta da linha 260):

```typescript
// Paginate
const from = (pagination.page - 1) * pagination.pageSize;
const paginatedInvoices = processedInvoices.slice(from, from + pagination.pageSize);

setAllFilteredInvoices(processedInvoices);
setInvoices(paginatedInvoices);
setPagination((prev) => ({ ...prev, total: processedInvoices.length }));  // <-- LINHA NOVA
```

Isso garante que `pagination.total` reflita a quantidade real de faturas apos todos os filtros client-side, permitindo que o componente de paginacao calcule corretamente o numero de paginas e habilite a navegacao.

Nenhuma outra alteracao e necessaria.

