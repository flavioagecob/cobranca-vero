
# Adicionar Motivo da Inadimplencia ao Historico Preventivo

## Problema

O formulario de tentativa (`AttemptForm`) ja coleta o campo "Motivo da Inadimplencia" (obrigatorio), mas na cobranca preventiva esse dado e descartado. O `handleSubmitAttempt` em `PreventiveCollection.tsx` passa apenas `channel`, `status` e `notes` para o hook, ignorando `delinquencyReason`. O hook tambem nao aceita esse campo na interface `NewPreventiveAttempt`.

## Alteracoes

### 1. `src/hooks/usePreventiveCollection.ts`
- Adicionar `delinquencyReason` (opcional) na interface `NewPreventiveAttempt`
- No INSERT do `registerAttempt`, incluir `delinquency_reason: data.delinquencyReason || null`

### 2. `src/pages/PreventiveCollection.tsx`
- No `handleSubmitAttempt`, passar `delinquencyReason: data.delinquencyReason` ao chamar `registerAttempt`

Sao apenas duas pequenas alteracoes. O formulario ja coleta o dado corretamente -- so falta propaga-lo ate o banco.
