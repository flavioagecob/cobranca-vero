
## Transformar Formulário de Tentativa em Modal/Dialog

### Problema Identificado
Atualmente, o `AttemptForm` é renderizado inline na página quando `showAttemptForm` é `true`, ocupando espaço vertical e forçando scroll na coluna esquerda. Isso prejudica a experiência, especialmente em telas menores.

### Solução Proposta
Envolver o `AttemptForm` em um componente `Dialog` (do shadcn/ui), mantendo o mesmo formulário mas apresentando-o em um modal flutuante.

### Alterações Necessárias

#### 1. `src/pages/Collection.tsx`
- Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` de `@/components/ui/dialog`
- Remover a renderização condicional do `AttemptForm` inline (linhas 185-192)
- Adicionar um `Dialog` que:
  - Fica aberto quando `showAttemptForm === true`
  - Renderiza o `AttemptForm` dentro do `DialogContent`
  - Fecha quando `onCancel` é chamado (setando `showAttemptForm` para `false`)
- Manter o botão "Registrar Nova Tentativa" sempre visível (remover a condição `{!showAttemptForm && ...}`)
- O `MessageTemplates` também fica sempre visível

#### 2. `src/pages/PreventiveCollection.tsx`
- Mesmas alterações do arquivo `Collection.tsx`
- Importar os componentes do Dialog
- Envolver o `AttemptForm` em um `Dialog`
- Manter o botão sempre visível

#### 3. `src/components/collection/AttemptForm.tsx` (sem alterações)
- O componente continua igual, apenas muda sua contexto de renderização
- O `Card` wrapper pode ser removido já que agora será renderizado dentro de um `Dialog` que já tem visual de modal

**Opcional**: Remover o `Card` e `CardHeader`/`CardContent` do `AttemptForm` para deixá-lo mais limpo dentro do modal, aplicando as classes direto na `DialogContent`.

### Benefícios
- Evita scroll desnecessário na página
- Mantém a visão das mensagens e histórico enquanto preenche o formulário
- Interface mais limpa e focada
- Padrão comum em aplicações web

### Componentes Já Disponíveis
O projeto já possui o componente `Dialog` do shadcn/ui (arquivo `src/components/ui/dialog.tsx`), então não precisa instalar dependências.

