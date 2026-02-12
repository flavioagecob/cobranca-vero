

# Ajustes na tela de Cobranca

## 1. Scroll independente na fila (como na Preventiva)

A fila da Cobranca Preventiva possui scroll independente porque o container da fila usa `h-[calc(100vh-300px)] overflow-hidden`, enquanto o painel principal nao tem `overflow-y-auto`. Na Cobranca atual, o container da fila usa apenas `h-full` e o painel principal tem `overflow-y-auto`, o que faz a pagina inteira rolar.

**Alteracao em `src/pages/Collection.tsx`:**
- Linha 147: trocar `h-full` por `h-[calc(100vh-300px)] overflow-hidden` no container da fila
- Linha 157: remover `overflow-y-auto` do painel principal, deixando o scroll global para o conteudo de detalhes

## 2. Remover Acoes Rapidas do card do cliente

**Alteracao em `src/components/collection/CustomerInfoCard.tsx`:**
- Remover o bloco "Acoes Rapidas" (linhas 146-193): os botoes Ligar, WhatsApp e E-mail
- Remover o `Separator` que antecede as acoes (linha 145)
- Remover a prop `onStartAttempt` da interface, ja que nao sera mais usada neste componente

**Alteracao em `src/pages/Collection.tsx`:**
- Remover a prop `onStartAttempt` passada ao `CustomerInfoCard` (linha 181)

