

# Scroll independente na coluna principal (painel direito)

O problema atual e que ao rolar o conteudo do painel do cliente (coluna direita), a pagina inteira rola junto. A solucao e aplicar scroll independente tambem na coluna direita, de forma que apenas o conteudo interno role.

## Mudanca

**Arquivo: `src/pages/PreventiveCollection.tsx`**

- Adicionar `overflow-y-auto` na div da coluna direita (`lg:col-span-9`) para que ela tenha scroll proprio
- Garantir que o container pai (`grid`) tenha altura fixa e `overflow-hidden` para impedir o scroll da pagina

A coluna da fila (esquerda) ja tem scroll independente via `ScrollArea`. Agora a coluna direita tambem tera seu proprio scroll, mantendo o header, stats e filtros sempre visiveis no topo.

