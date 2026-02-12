

# Corrigir visibilidade do botão "Pago pela Empresa"

## Problema identificado

O botão "Pago Empresa" atualmente so aparece dentro da aba **Contratos** na tabela de contratos, na ultima coluna "Acoes". Isso causa dois problemas:

1. O usuario precisa clicar na aba "Contratos" para ver o botao - nao e visivel na aba "Vendas" que e a aba padrao
2. A tabela de contratos tem muitas colunas (8 colunas incluindo Acoes), e em telas menores a coluna "Acoes" pode ficar fora da area visivel, exigindo scroll horizontal

## Solucao proposta

### 1. Tornar a aba "Contratos" a aba padrao quando existirem contratos

Alterar o `defaultValue` do Tabs de `"sales"` para `"contracts"` quando o cliente tiver contratos, para que o botao "Pago Empresa" fique imediatamente visivel ao abrir o dialog.

### 2. Melhorar a visibilidade do botao na tabela

- Garantir que o botao "Pago Empresa" fique mais acessivel, movendo-o para ser renderizado junto ao Status (coluna "Status") ao inves de numa coluna separada "Acoes", reduzindo o numero de colunas e evitando que fique escondido pelo scroll horizontal.

### Detalhes tecnicos

**Arquivo: `src/components/shared/CustomerDetailDialog.tsx`**
- Mover o botao "Pago Empresa" da coluna "Acoes" para dentro da coluna "Status", abaixo dos badges de status existentes
- Remover a coluna "Acoes" separada para simplificar a tabela
- Isso garante que o botao fique visivel sem necessidade de scroll horizontal

**Arquivo: `src/pages/CustomerDetail.tsx`**
- Aplicar a mesma mudanca na pagina completa do cliente, movendo o botao para a coluna de Status

Ambos os arquivos serao atualizados de forma consistente.

