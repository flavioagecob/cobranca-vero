import { Phone, Mail, Copy, ExternalLink, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCpfCnpj, formatPhone } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PreventiveQueueItem } from '@/hooks/usePreventiveCollection';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface PreventiveCustomerCardProps {
  customer: PreventiveQueueItem;
}

export function PreventiveCustomerCard({ customer }: PreventiveCustomerCardProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const getDaysLabel = (dias: number) => {
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence amanhã';
    if (dias < 0) return `Vencido há ${Math.abs(dias)} dias`;
    return `Vence em ${dias} dias`;
  };

  const getDaysBadgeClass = (dias: number) => {
    if (dias <= 1) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (dias <= 7) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Cliente</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/customers/${customer.customer_id}`}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Ver Ficha
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{customer.customer_name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{formatCpfCnpj(customer.customer_cpf_cnpj)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6"
              onClick={() => copyToClipboard(customer.customer_cpf_cnpj, 'CPF/CNPJ')}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          {customer.customer_phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatPhone(customer.customer_phone)}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => copyToClipboard(customer.customer_phone!, 'Telefone')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
          {customer.customer_phone2 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatPhone(customer.customer_phone2)}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => copyToClipboard(customer.customer_phone2!, 'Telefone 2')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
          {customer.customer_email && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate max-w-[180px]">{customer.customer_email}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6"
                onClick={() => copyToClipboard(customer.customer_email!, 'E-mail')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Vencimento info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">
              {format(new Date(customer.data_vencimento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <Badge variant="outline" className={getDaysBadgeClass(customer.dias_ate_vencer)}>
            {getDaysLabel(customer.dias_ate_vencer)}
          </Badge>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>OS: {customer.os}</span>
            {customer.mes_safra && <span>Safra: {customer.mes_safra}</span>}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
