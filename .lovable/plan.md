

# Plano: Permitir Operador Usar Instâncias de WhatsApp

## Problema Identificado

O operador (cobrador) não consegue ver as instâncias de WhatsApp disponíveis para fazer disparos de cobrança. Na página de Cobrança, o hook `useSendWhatsapp` tenta buscar instâncias conectadas:

```typescript
const { data, error } = await supabase
  .from('instances')
  .select('*')
  .eq('status', 'connected')
```

Mas a tabela `instances` só tem políticas RLS para:
- Admin: acesso total
- Supervisor: somente leitura (SELECT)
- **Cobrador: NENHUM ACESSO** ← problema

Por isso, o operador vê a mensagem "Nenhuma instância WhatsApp conectada" mesmo quando existem instâncias ativas.

## Solução

Adicionar uma política RLS de SELECT na tabela `instances` para o role `cobrador`.

Isso permite:
- ✅ Operador pode **ver** instâncias conectadas (para selecionar no disparo)
- ✅ Operador pode **usar** instâncias para enviar mensagens
- ❌ Operador **NÃO** pode criar/editar/deletar instâncias (somente SELECT)

## Mudança Necessária

### Nova Política RLS

```sql
CREATE POLICY "instances_cobrador_select" 
ON public.instances 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'cobrador'::app_role));
```

## Arquivo a Criar

| Arquivo | Descrição |
|---------|-----------|
| Migration SQL | Nova política RLS para tabela `instances` |

## Permissões Após a Mudança

| Tabela | Admin | Supervisor | Cobrador |
|--------|-------|------------|----------|
| instances | ALL | SELECT | **SELECT** ✅ |
| operator_contracts | ALL | SELECT | SELECT ✅ |
| customers | ALL | SELECT, UPDATE | SELECT |
| invoices | ALL | ALL | SELECT |

## Resultado Esperado

- Operador verá instâncias WhatsApp conectadas na página de Cobrança
- Poderá selecionar qual instância usar para disparos
- Conseguirá enviar mensagens de cobrança via WhatsApp
- **NÃO** terá acesso à página de Configurações (continua bloqueado)

