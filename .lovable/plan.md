

# Popup "Ver Ficha" em vez de navegar para outra pagina

## Problema

Ao clicar em "Ver Ficha" nas paginas de Cobranca e Cobranca Preventiva, o usuario e redirecionado para `/customers/:id`, perdendo o contexto de trabalho. Para voltar, precisa usar o botao voltar do navegador ou navegar manualmente.

## Solucao

Criar um componente `CustomerDetailDialog` que exibe os dados completos do cliente em um Dialog (popup modal), reutilizando o hook `useCustomerDetail` ja existente. O botao "Ver Ficha" abrira esse dialog em vez de navegar para outra pagina.

## Arquivos a criar

**`src/components/shared/CustomerDetailDialog.tsx`** (novo)
- Dialog/modal com largura grande (`max-w-4xl`) para acomodar os dados
- Recebe `customerId` e `open`/`onOpenChange` como props
- Usa o hook `useCustomerDetail(customerId)` para buscar dados
- Exibe as mesmas informacoes da pagina CustomerDetail:
  - Informacoes pessoais (nome, CPF, telefone, email, endereco)
  - Abas de Vendas e Contratos (tabelas)
  - Resumo de Faturas
  - Historico de cobranca (HistoryTimeline)
- Skeleton de loading enquanto carrega
- Link externo "Abrir pagina completa" para quem quiser ir a pagina dedicada

## Arquivos a modificar

**`src/components/preventive/PreventiveCustomerCard.tsx`**
- Substituir o `<Link to={...}>` por um botao que abre o `CustomerDetailDialog`
- Adicionar estado `dialogOpen` para controlar o dialog

**`src/components/collection/CustomerInfoCard.tsx`**
- Mesma alteracao: substituir o `<Link>` por botao que abre o `CustomerDetailDialog`

## Detalhes tecnicos

- O dialog usara `@radix-ui/react-dialog` ja disponivel no projeto
- O hook `useCustomerDetail` ja faz toda a busca necessaria (cliente, vendas, contratos, tentativas, promessas)
- O conteudo do dialog sera um ScrollArea para permitir rolagem interna quando houver muitos dados
- A pagina `/customers/:id` continua existindo normalmente para acesso direto

