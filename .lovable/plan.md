

## Trocar Templates de Mensagem por Botao + Modal

### Objetivo
Substituir o componente `MessageTemplates` / `PreventiveMessageTemplates` renderizado inline na coluna esquerda por um botao "Cobrar Cliente" que, ao ser clicado, abre os templates dentro de um modal Dialog. Isso libera espaco na tela e mantem o foco no historico e dados do cliente.

### Alteracoes

#### 1. `src/pages/Collection.tsx`
- Adicionar estado `showMessageTemplates` (boolean, inicialmente `false`)
- Remover o componente `<MessageTemplates ... />` inline (linhas 186-198)
- No lugar, colocar um botao "Cobrar Cliente" (com icone `MessageCircle`) que seta `showMessageTemplates = true`
- Adicionar um `<Dialog>` controlado por `showMessageTemplates` que renderiza o `<MessageTemplates>` dentro do `<DialogContent>`
- O callback `onMessageSent` fecha o modal alem de atualizar o historico

#### 2. `src/pages/PreventiveCollection.tsx`
- Mesma abordagem: estado `showMessageTemplates`, botao "Cobrar Cliente" e Dialog envolvendo `<PreventiveMessageTemplates>`
- O callback `onMessageSent` fecha o modal alem de atualizar o historico

### Layout Resultante (coluna esquerda)
```text
+----------------------------+
| CustomerInfoCard           |
+----------------------------+
| [Cobrar Cliente]  (botao)  |
+----------------------------+
```

Nenhuma alteracao nos componentes `MessageTemplates` ou `PreventiveMessageTemplates` em si -- eles continuam funcionando igual, apenas renderizados dentro de um Dialog.

