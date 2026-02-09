

# Remover seção "Ações Rápidas" do card do cliente preventivo

## Mudança

**Arquivo: `src/components/preventive/PreventiveCustomerCard.tsx`**

- Remover o último bloco `<Separator />` e a seção "Ações Rápidas" (linhas ~131-155) que contém os botões Ligar, WhatsApp e E-mail
- Remover as variáveis não utilizadas: `whatsappLink`, `phoneLink`, `emailLink`, `cleanPhone`
- Remover os imports não utilizados: `Phone`, `MessageCircle`, `Mail` (de lucide-react) e `AttemptChannel` (do types)
- Remover a prop `onStartAttempt` da interface e do componente

**Arquivo: `src/pages/PreventiveCollection.tsx`**

- Remover a prop `onStartAttempt` passada ao `PreventiveCustomerCard`

