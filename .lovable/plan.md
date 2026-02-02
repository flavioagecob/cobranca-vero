

# Plano: Adicionar Funcionalidade de Limpeza de Dados

## Objetivo

Criar uma nova aba nas Configurações chamada "Dados" que permite ao administrador excluir todos os registros do banco de dados para poder subir uma listagem nova (reset completo).

## Dados Atuais no Banco

| Tabela | Quantidade |
|--------|------------|
| customers | 741 |
| sales_base | 845 |
| operator_contracts | 1.082 |
| collection_attempts | 27 |
| payment_promises | 0 |
| invoices | 0 |
| reconciliation_issues | 0 |
| import_batches | 14 |

## Funcionalidades

### Opções de Limpeza

1. **Limpar Base de Vendas** - Exclui `sales_base` e `customers` vinculados
2. **Limpar Base Operadora** - Exclui `operator_contracts`
3. **Limpar Histórico de Cobrança** - Exclui `collection_attempts` e `payment_promises`
4. **Limpar TUDO** - Remove todos os dados (exceto usuários e instâncias)

### Segurança

- Apenas administradores têm acesso
- Dialog de confirmação com texto "CONFIRMAR" que o usuário precisa digitar
- Mostra contagem de registros que serão excluídos
- Operação irreversível com aviso claro

## Interface

Nova aba "Dados" nas Configurações com:
- Cards para cada tipo de limpeza
- Contador de registros em cada tabela
- Botões de exclusão com ícone de lixeira
- Cores de alerta (vermelho) para indicar perigo

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/settings/DataManagement.tsx` | Criar - Componente principal |
| `src/components/settings/ClearDataDialog.tsx` | Criar - Dialog de confirmação |
| `src/hooks/useDataManagement.ts` | Criar - Hook para operações |
| `src/pages/Settings.tsx` | Modificar - Adicionar nova aba |

## Detalhes Técnicos

### Ordem de Exclusão (respeitando foreign keys)

A exclusão precisa seguir ordem específica para evitar erros de constraint:

```text
1. collection_attempts (referencia customers, invoices)
2. payment_promises (referencia invoices)
3. invoices (referencia customers, contracts)
4. reconciliation_issues (referencia customers, sales_base, contracts)
5. operator_contracts (referencia customers, sales_base)
6. sales_base (referencia customers)
7. import_batches (standalone)
8. customers (base)
```

### Hook useDataManagement

```typescript
// Funções do hook:
- fetchCounts() - Busca contagem de cada tabela
- clearSalesData() - Limpa vendas + clientes órfãos
- clearOperatorData() - Limpa contratos operadora
- clearCollectionHistory() - Limpa tentativas e promessas
- clearAllData() - Limpa tudo na ordem correta
```

### Dialog de Confirmação

- Usuário precisa digitar "CONFIRMAR" para habilitar botão
- Mostra resumo do que será excluído
- Loading state durante exclusão
- Toast de sucesso/erro ao finalizar

## Resultado Esperado

- Nova aba "Dados" visível apenas para admins
- Interface clara mostrando quantidade de registros
- Processo seguro com confirmação obrigatória
- Permite reset completo para nova importação

