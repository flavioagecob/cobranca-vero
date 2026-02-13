

## Corrigir Erro ao Registrar Tentativas de Contato

### Problema
Os logs do banco mostram repetidamente o erro:
```
invalid input value for enum delinquency_reason: "cliente_nao_responde"
```

O valor `cliente_nao_responde` existe no frontend (tipo TypeScript + configuracao visual) mas **nunca foi adicionado ao enum `delinquency_reason` no banco de dados**. Quando o operador seleciona esse motivo, o INSERT falha.

### Solucao
Executar uma migracao SQL para adicionar o valor ausente ao enum:

```sql
ALTER TYPE public.delinquency_reason ADD VALUE 'cliente_nao_responde';
```

### Impacto
- Nenhuma alteracao de codigo necessaria -- o frontend ja esta correto
- Apenas uma migracao de banco de dados
- Apos a correcao, todos os motivos de inadimplencia funcionarao normalmente

