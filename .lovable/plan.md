

# Editar e Excluir Registros do Historico

## Objetivo

Permitir que o usuario edite ou exclua tentativas de cobranca e promessas de pagamento diretamente no historico do cliente, tanto na cobranca regular quanto na preventiva.

## Alteracoes

### 1. Migration SQL - Politicas RLS para cobrador

Atualmente, cobradores so podem INSERT e SELECT em `collection_attempts`. Para permitir edicao e exclusao dos proprios registros:

```sql
CREATE POLICY collection_attempts_cobrador_update
  ON collection_attempts FOR UPDATE
  USING (has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid());

CREATE POLICY collection_attempts_cobrador_delete
  ON collection_attempts FOR DELETE
  USING (has_role(auth.uid(), 'cobrador') AND collector_id = auth.uid());
```

Promessas de pagamento ja possuem politica ALL aberta, entao nao precisam de alteracao.

### 2. `src/components/collection/HistoryTimeline.tsx` - Botoes de acao

Adicionar a cada item do historico:
- Botao de **editar** (icone de lapis) que abre um dialog/modal com os campos editaveis
- Botao de **excluir** (icone de lixeira) que abre um AlertDialog de confirmacao

O componente passara a receber callbacks `onEditAttempt`, `onDeleteAttempt`, `onEditPromise` e `onDeletePromise` via props.

Para tentativas, o dialog de edicao permitira alterar: canal, resultado, motivo da inadimplencia e observacoes.
Para promessas, permitira alterar: valor prometido, data prometida e status.

### 3. `src/hooks/useCollection.ts` - Funcoes de update/delete

Adicionar ao hook:
- `updateAttempt(id, data)` - UPDATE na tabela `collection_attempts`
- `deleteAttempt(id)` - DELETE na tabela `collection_attempts`
- `deletePromise(id)` - DELETE na tabela `payment_promises`
- (A funcao `updatePromiseStatus` ja existe, sera expandida para `updatePromise` com mais campos)

### 4. `src/hooks/usePreventiveCollection.ts` - Mesmas funcoes

Replicar as funcoes de update/delete para o hook preventivo, ou reutilizar funcoes compartilhadas.

### 5. `src/pages/Collection.tsx` e `src/pages/PreventiveCollection.tsx`

Passar as novas callbacks (`onEditAttempt`, `onDeleteAttempt`, `onEditPromise`, `onDeletePromise`) para o componente `HistoryTimeline`.

## Comportamento esperado

- Cada item do historico tera icones discretos de edicao e exclusao no canto superior direito
- Ao clicar em excluir, aparece uma confirmacao "Tem certeza que deseja excluir este registro?"
- Ao clicar em editar, abre um dialog com os campos pre-preenchidos
- Apos qualquer acao, o historico e atualizado automaticamente
- Cobradores so podem editar/excluir seus proprios registros; admins e supervisores podem editar/excluir qualquer registro

