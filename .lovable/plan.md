
# Implementação de Tags de Motivos de Inadimplência

## Visão Geral
Adicionar um sistema de tags para registrar os motivos reais de inadimplência dos clientes no formulário "Registrar Tentativa". Cada tentativa de contato terá exatamente uma tag de motivo selecionada da lista fixa fornecida pelo usuário.

## Arquitetura da Solução

### 1. **Banco de Dados - Criação de Enum e Coluna**
- **Arquivo**: `supabase/migrations/[timestamp].sql`
- Criar um enum `delinquency_reason` com os valores:
  - `cliente_nao_contratou`
  - `desconhece_divida`
  - `valor_errado`
  - `fraude`
  - `nao_recebeu_boleto`
  - `internet_sem_funcionar`
  - `nao_recebeu_chip`
  - `nao_ativado_streaming`
  - `nao_gerou_boleto`
- Adicionar coluna `delinquency_reason` (tipo enum, nullable) à tabela `collection_attempts`
- Atualizar índices se necessário

### 2. **TypeScript - Tipos Atualizados**
- **Arquivo**: `src/types/collection.ts`
- Criar um novo tipo: `DelinquencyReason` com os 9 motivos
- Expandir a interface `CollectionAttempt` para incluir `delinquency_reason: DelinquencyReason | null`
- Criar um mapa de configuração `DELINQUENCY_REASON_CONFIG` com label e cor para cada motivo (similar ao `RESULT_CONFIG`)
- Exportar a constante `DELINQUENCY_REASONS` com a lista completa de opcões

### 3. **UI - AttemptForm Component**
- **Arquivo**: `src/components/collection/AttemptForm.tsx`
- Adicionar campo "Motivo da Inadimplência" após "Resultado"
- Usar um `Select` component para escolher entre os 9 motivos
- Validar que um motivo foi selecionado antes de submeter o formulário
- Campo será obrigatório (sem opção "nenhum")

### 4. **Form Data Interface**
- **Arquivo**: `src/components/collection/AttemptForm.tsx`
- Expandir `AttemptFormData` para incluir `delinquencyReason: DelinquencyReason`
- Passar o campo no `handleSubmit`

### 5. **Hook useCollection**
- **Arquivo**: `src/hooks/useCollection.ts`
- Expandir `NewAttempt` interface para incluir `delinquency_reason?: DelinquencyReason`
- Atualizar função `registerAttempt` para aceitar e enviar o campo `delinquency_reason` ao Supabase

### 6. **Page Collection**
- **Arquivo**: `src/pages/Collection.tsx`
- Passar o `delinquencyReason` do formulário para o hook `registerAttempt`

### 7. **Supabase Types**
- **Arquivo**: `src/integrations/supabase/types.ts`
- Será automaticamente atualizado após a execução da migration para refletir o novo enum e coluna

### 8. **HistoryTimeline - Visualização**
- **Arquivo**: `src/components/collection/HistoryTimeline.tsx` (se necessário)
- Exibir a tag de motivo no card de tentativa usando `DELINQUENCY_REASON_CONFIG` para styling

## Sequência de Implementação

1. **Criar migration SQL** para enum e coluna
2. **Atualizar tipos TypeScript** em `collection.ts`
3. **Modificar AttemptForm** para incluir seletor de motivo
4. **Atualizar useCollection** para aceitar e registrar o motivo
5. **Atualizar página Collection** para passar o motivo
6. **Testar** o fluxo completo de registro de tentativa

## Considerações Técnicas

- O campo é **obrigatório** no formulário (validação client-side)
- Será **nullable** no banco (permite análise histórica sem quebrar registros antigos)
- **Validação de entrada**: Apenas valores do enum são aceitos (schema zod)
- **Persistência em localStorage**: O fallback mantém o campo `delinquency_reason` para consistência
- **Sem impacto em outras telas**: O histórico exibirá o motivo se disponível, sem quebrar a exibição

## Testes Necessários

- Registrar tentativa **com motivo** e verificar se aparece no histórico
- Verificar que **não é possível submeter** sem selecionar motivo
- Testar **todas as 9 opções** de motivo
- Confirmar que o motivo aparece corretamente no **HistoryTimeline**
- Validar que **clientes antigos** continuam funcionando sem motivo (campo null)

