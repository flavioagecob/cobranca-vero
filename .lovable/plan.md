
# Corrigir scroll da fila preventiva

## Problema

O `overflow-hidden` aplicado ao container grid esta impedindo o scroll da pagina inteira. O objetivo real e diferente: a fila preventiva (coluna esquerda) deve ter scroll independente para que, ao selecionar um cliente no final da lista, o operador nao precise rolar a pagina toda para ver os dados dele.

## Solucao

**Arquivo: `src/pages/PreventiveCollection.tsx`**

- Remover `overflow-hidden` do container grid para restaurar o scroll normal da pagina
- Remover o `style={{ height: 'calc(100vh - 280px)' }}` do grid
- Aplicar altura fixa apenas na coluna da fila (esquerda), com `h-[calc(100vh-300px)]` e `overflow-hidden`
- Manter a coluna direita sem restricao de altura, rolando junto com a pagina normalmente

Resultado: a fila preventiva rola sozinha internamente (ja usa `ScrollArea`), e o restante da pagina rola normalmente como antes.

## Mudanca especifica

```text
Antes:
  <div className="grid ... overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
    <div className="lg:col-span-3 h-full">
    <div className="lg:col-span-9 space-y-4 overflow-y-auto">

Depois:
  <div className="grid ... lg:grid-cols-12">
    <div className="lg:col-span-3 h-[calc(100vh-300px)] overflow-hidden">
    <div className="lg:col-span-9 space-y-4">
```

Apenas 1 arquivo modificado, 1 linha alterada no grid e 2 classes ajustadas nas colunas.
