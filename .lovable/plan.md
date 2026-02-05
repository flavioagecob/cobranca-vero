

# Plano: Cobrança Antecipada (Preventiva) + Novo Campo Safra

## Resumo do Que Será Feito

Vamos implementar duas mudanças principais:

1. **Novo campo na importação de vendas**: Adicionar "Mês Safra" e "Data de Vencimento" na planilha de vendas
2. **Nova página de Cobrança Preventiva**: Uma página separada para trabalhar clientes que ainda não venceram

---

## Entendendo a Mudança

### Situação Atual

| Base de Vendas | Base Operadora |
|----------------|----------------|
| Dados do cliente + OS | Dados de contrato vencido |
| Sem vencimento | Com data de vencimento |
| Sem safra | Com mês safra |

**Fluxo atual**: Vendas → Operadora (match) → Cobrança (só vencidos)

### Situação Nova

| Base de Vendas (ampliada) | Base Operadora |
|---------------------------|----------------|
| Dados do cliente + OS | Dados de contrato vencido |
| **Com data de vencimento** | Com data de vencimento |
| **Com mês safra** | Com mês safra |
| **Com valor** | Com valor |

**Novo fluxo**: 
- Vendas com vencimento futuro → **Cobrança Preventiva** (antes de vencer)
- Operadora com vencimento passado → **Cobrança** (já vencido)

---

## 1. Mudanças no Banco de Dados

### Novos campos na tabela `sales_base`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `mes_safra` | text | Mês da safra (ex: "2025-01") |
| `data_vencimento` | date | Data do vencimento previsto |
| `valor` | numeric | Valor a ser cobrado |
| `status_cobranca` | text | 'pendente', 'cobrado', 'pago' |

---

## 2. Mudanças na Importação

### Novos campos mapeáveis na Base de Vendas:

| Campo | Rótulo | Obrigatório |
|-------|--------|-------------|
| mes_safra | Mês Safra | Não |
| data_vencimento | Data de Vencimento | Não |
| valor | Valor | Não |

O sistema de auto-match também será atualizado para reconhecer colunas como "SAFRA", "VENCIMENTO", "VALOR", etc.

---

## 3. Nova Página: Cobrança Preventiva

### Acesso

- Nova entrada no menu lateral: **"Cobrança Preventiva"** (ícone de calendário)
- Rota: `/preventive-collection`
- Acessível por: admin, supervisor, cobrador

### Funcionalidades

A página terá a mesma estrutura da Cobrança atual, mas:

| Cobrança (atual) | Cobrança Preventiva (nova) |
|------------------|---------------------------|
| Busca em `operator_contracts` | Busca em `sales_base` |
| `data_vencimento < hoje` | `data_vencimento >= hoje` e `data_vencimento <= hoje + 15 dias` |
| Faturas já vencidas | Faturas prestes a vencer |
| Cor vermelha (urgência) | Cor amarela/laranja (atenção) |

### Cards de Estatísticas

- **A Vencer em 7 dias**: Quantidade de leads
- **A Vencer em 15 dias**: Quantidade de leads
- **Valor Total a Vencer**: Soma dos valores
- **Cobrados Hoje**: Leads contatados preventivamente hoje

### Filtros

- Safra (usa `sales_base.mes_safra`)
- Dias até vencer: "Hoje", "1-7 dias", "8-15 dias"

---

## 4. Arquivos a Criar/Modificar

### Banco de Dados

| Alteração | Descrição |
|-----------|-----------|
| Migration SQL | Adicionar campos à tabela `sales_base` |

### Importação

| Arquivo | Mudança |
|---------|---------|
| `src/types/import.ts` | Adicionar novos campos em `SALES_FIELDS` |
| `src/hooks/useImport.ts` | Incluir novos campos no processamento |

### Nova Página

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/PreventiveCollection.tsx` | Nova página de cobrança preventiva |
| `src/hooks/usePreventiveCollection.ts` | Hook para buscar dados de vendas a vencer |
| `src/components/preventive/PreventiveQueue.tsx` | Lista de clientes |
| `src/components/preventive/PreventiveStatsCards.tsx` | Cards de estatísticas |

### Navegação

| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/AppSidebar.tsx` | Adicionar menu "Cobrança Preventiva" |
| `src/App.tsx` | Adicionar rota `/preventive-collection` |

---

## 5. Interface Visual

### Menu Lateral (Sidebar)

```text
Principal
├── Dashboard
├── Clientes
├── Faturas
├── Cobrança           ← vencidos (existente)
├── Cobrança Preventiva ← a vencer (NOVO)
└── Conciliação
```

### Diferenciação Visual

| Elemento | Cobrança | Cobrança Preventiva |
|----------|----------|---------------------|
| Ícone | Phone (telefone) | CalendarClock (calendário) |
| Cor principal | Vermelho | Amarelo/Laranja |
| Título | "Fila de clientes com faturas vencidas" | "Fila de clientes com faturas a vencer" |
| Badge dias | "X dias de atraso" | "Vence em X dias" |

---

## 6. Fluxo de Trabalho do Operador

### Cobrança Preventiva (manhã)
1. Filtrar por "Vence em 1-7 dias"
2. Ligar/enviar WhatsApp lembrando do vencimento
3. Registrar tentativa com status "lembrete enviado"

### Cobrança Vencida (tarde)
1. Trabalhar clientes que já venceram
2. Cobrar valores em atraso
3. Negociar promessas de pagamento

---

## Resumo das Mudanças

| Etapa | Arquivos |
|-------|----------|
| 1. Migration banco | 1 arquivo SQL |
| 2. Tipos importação | 1 arquivo |
| 3. Hook importação | 1 arquivo |
| 4. Nova página + componentes | 4 arquivos |
| 5. Navegação (sidebar + rotas) | 2 arquivos |
| **Total** | **~9 arquivos** |

