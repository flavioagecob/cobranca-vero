

# Plano: Otimização do Sistema de Importação de Planilhas

## Diagnóstico: Por que está lento?

A importação está extremamente lenta porque o código atual faz **múltiplas queries por linha**:

### Fluxo Atual (para cada linha da planilha):

**Importação de Vendas (sales)**:
1. Upsert no customers → 1 query
2. Insert no sales_base → 1 query
- **Total: 2 queries por linha**

**Importação Operadora (operator)** - MUITO PIOR:
1. SELECT em sales_base (match exato) → 1 query
2. Se falhar: SELECT com LIKE (sufixo) → 1 query
3. Se falhar: SELECT para debug → 1 query  
4. SELECT em operator_contracts (verificar existente) → 1 query
5. UPDATE ou INSERT → 1 query
- **Total: 3-5 queries por linha**

### Exemplo Real:
- Planilha com 1.000 linhas de operadora
- Cada linha = ~4 queries em média
- **Total = ~4.000 queries sequenciais**
- Latência média por query = ~50ms
- **Tempo total = ~200 segundos (3+ minutos)**

### Problemas Adicionais:
- Todas as queries são **síncronas** (espera uma terminar para começar outra)
- O loop processa batchSize=50, mas dentro do batch ainda é sequencial
- Muitas queries de diagnóstico/debug em produção

---

## Solução: Bulk Operations + Caching

### Estratégia de Otimização

| Aspecto | Atual | Proposto |
|---------|-------|----------|
| Queries por linha | 3-5 | ~0.02 (bulk) |
| Lookups sales_base | 1 por linha | 1 único (cache) |
| Lookups operator_contracts | 1 por linha | 1 único (cache) |
| Inserts/Updates | 1 por linha | 1 bulk por batch |

---

## Mudanças Técnicas Detalhadas

### 1. Cache de Lookup para sales_base

Antes de iniciar a importação de operadora, carregar **toda a tabela sales_base** em memória (é pequena ~845 registros):

```typescript
// Carrega uma vez antes do loop
const { data: allSales } = await supabase
  .from('sales_base')
  .select('id, customer_id, os');

// Cria mapas para lookup O(1)
const osByExact = new Map(allSales.map(s => [s.os, s]));
const osBySuffix = new Map();
allSales.forEach(s => {
  const suffix7 = s.os.slice(-7);
  if (!osBySuffix.has(suffix7)) osBySuffix.set(suffix7, []);
  osBySuffix.get(suffix7).push(s);
});
```

**Ganho**: Elimina 1-3 queries por linha → 0 queries

### 2. Cache de Contratos Existentes

Carregar todos os pares (id_contrato, numero_fatura) existentes:

```typescript
const { data: existingContracts } = await supabase
  .from('operator_contracts')
  .select('id, id_contrato, numero_fatura');

const existingMap = new Map(
  existingContracts.map(c => [`${c.id_contrato}|${c.numero_fatura}`, c.id])
);
```

**Ganho**: Elimina 1 query de verificação por linha → 0 queries

### 3. Bulk Insert/Update com PostgreSQL Upsert

Em vez de processar linha a linha, acumular registros e fazer bulk upsert:

```typescript
// Acumula batch de 200-500 registros
const toUpsert = [];
for (const row of batchRows) {
  const record = mapRowToRecord(row);
  toUpsert.push(record);
}

// Um único upsert para todo o batch
const { error } = await supabase
  .from('operator_contracts')
  .upsert(toUpsert, { 
    onConflict: 'id_contrato,numero_fatura' 
  });
```

**Ganho**: 50 inserts → 1 bulk insert

### 4. Remover Logs de Debug em Produção

Logs com `console.log` e `console.warn` em cada linha impactam performance.

### 5. Processamento Paralelo de Batches

Usar Promise.all para processar múltiplos batches simultaneamente:

```typescript
const PARALLEL_BATCHES = 3;
for (let i = 0; i < totalBatches; i += PARALLEL_BATCHES) {
  const batchPromises = [];
  for (let j = 0; j < PARALLEL_BATCHES && i + j < totalBatches; j++) {
    batchPromises.push(processBatch(i + j));
  }
  await Promise.all(batchPromises);
}
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useImport.ts` | Refatorar para usar caching + bulk operations |

---

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| 1.000 linhas operadora | ~3-4 min | ~5-10 seg |
| 5.000 linhas operadora | ~15-20 min | ~30-60 seg |
| Queries no banco | ~4.000 | ~20-30 |

---

## Resumo das Otimizações

1. **Cache de Lookup**: Carregar sales_base e operator_contracts uma vez antes do loop
2. **Bulk Upsert**: Usar PostgreSQL upsert nativo com conflict key
3. **Aumentar batch size**: De 50 para 200-500 registros
4. **Paralelização**: Processar múltiplos batches simultaneamente
5. **Remover logs**: Eliminar console.log/warn em produção (condicional)

