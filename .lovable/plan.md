
# Exportacao de Faturas com Filtros Aplicados

## O que sera feito

O botao "Exportar" na pagina de Faturas vai gerar um arquivo Excel (.xlsx) contendo todas as faturas que correspondem aos filtros atualmente aplicados (status, safra, parcela, dias de atraso, busca). O arquivo incluira todas as colunas visiveis na tabela.

## Alteracoes

### 1. `src/hooks/useInvoices.ts`
- Expor uma nova propriedade `allFilteredInvoices` que contem todos os registros filtrados (sem paginacao), para que a exportacao inclua todos os dados e nao apenas a pagina atual.

### 2. `src/pages/Invoices.tsx`
- Implementar a funcao `handleExport` no botao "Exportar" ja existente.
- Usar a biblioteca `xlsx` (ja instalada no projeto) para gerar o arquivo.
- Colunas do arquivo exportado:
  - Numero Fatura
  - Cliente (nome)
  - CPF/CNPJ
  - Telefone
  - Safra
  - Valor
  - Data Vencimento
  - Data Pagamento
  - Status
  - Dias Atraso
- O nome do arquivo incluira a data atual: `faturas_2026-02-09.xlsx`
- Exibir toast de sucesso/erro apos a exportacao
- Desabilitar o botao durante loading ou quando nao ha dados

## Detalhes tecnicos

- O hook `useInvoices` ja busca todos os dados e aplica filtros no client-side. Basta armazenar o array completo filtrado (antes do `.slice` de paginacao) em um novo estado e expor via retorno do hook.
- A geracao do XLSX usara `xlsx.utils.json_to_sheet` com headers em portugues e `xlsx.writeFile` para download direto.
- Nenhuma nova dependencia necessaria - `xlsx` ja esta no `package.json`.
