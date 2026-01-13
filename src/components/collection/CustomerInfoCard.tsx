import { Phone, MessageCircle, Mail, User, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCpfCnpj, formatPhone, formatCurrency } from '@/lib/formatters';
import type { CollectionQueueItem } from '@/types/collection';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface CustomerInfoCardProps {
  customer: CollectionQueueItem;
  onStartAttempt: (channel: 'telefone' | 'whatsapp' | 'email') => void;
}

export function CustomerInfoCard({ customer, onStartAttempt }: CustomerInfoCardProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const cleanPhone = (phone: string | null) => {
    if (!phone) return null;
    return phone.replace(/\D/g, '');
  };

  const whatsappLink = customer.customer_phone
    ? `https://wa.me/55${cleanPhone(customer.customer_phone)}`
    : null;

  const phoneLink = customer.customer_phone
    ? `tel:+55${cleanPhone(customer.customer_phone)}`
    : null;

  const emailLink = customer.customer_email
    ? `mailto:${customer.customer_email}`
    : null;

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
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{customer.customer_name}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{formatCpfCnpj(customer.customer_cpf_cnpj)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(customer.customer_cpf_cnpj, 'CPF/CNPJ')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-3">
          {customer.customer_phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatPhone(customer.customer_phone)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(customer.customer_phone!, 'Telefone')}
              >
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
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(customer.customer_phone2!, 'Telefone 2')}
              >
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
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(customer.customer_email!, 'E-mail')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Valor Pendente</p>
            <p className="text-lg font-bold">{formatCurrency(customer.total_pendente)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Faturas Atrasadas</p>
            <p className="text-lg font-bold">{customer.faturas_atrasadas}</p>
          </div>
        </div>

        {customer.max_dias_atraso > 0 && (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            Maior atraso: {customer.max_dias_atraso} dias
          </Badge>
        )}

        <Separator />

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Ações Rápidas</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-3"
              disabled={!phoneLink}
              onClick={() => {
                if (phoneLink) window.open(phoneLink);
                onStartAttempt('telefone');
              }}
            >
              <Phone className="h-5 w-5 mb-1 text-blue-600" />
              <span className="text-xs">Ligar</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-3"
              disabled={!whatsappLink}
              onClick={() => {
                if (whatsappLink) window.open(whatsappLink, '_blank');
                onStartAttempt('whatsapp');
              }}
            >
              <MessageCircle className="h-5 w-5 mb-1 text-emerald-600" />
              <span className="text-xs">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-3"
              disabled={!emailLink}
              onClick={() => {
                if (emailLink) window.open(emailLink);
                onStartAttempt('email');
              }}
            >
              <Mail className="h-5 w-5 mb-1 text-amber-600" />
              <span className="text-xs">E-mail</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
