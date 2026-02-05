import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, MessageSquare, Mail, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCpfCnpj, formatCurrency, formatPhone } from '@/lib/formatters';
import type { PreventiveLead, PreventiveFilters } from '@/hooks/usePreventiveCollection';
import { toast } from 'sonner';

interface PreventiveQueueProps {
  leads: PreventiveLead[];
  isLoading: boolean;
  filters: PreventiveFilters;
  onMarkAsCobrado: (id: string) => Promise<boolean>;
}

export function PreventiveQueue({ leads, isLoading, filters, onMarkAsCobrado }: PreventiveQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter by search
  const filteredLeads = leads.filter((lead) => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      lead.customer.nome.toLowerCase().includes(search) ||
      lead.customer.cpf_cnpj.includes(search.replace(/\D/g, '')) ||
      lead.os.includes(search)
    );
  });

  const handleMarkCobrado = async (lead: PreventiveLead) => {
    setProcessingId(lead.id);
    const success = await onMarkAsCobrado(lead.id);
    setProcessingId(null);
    
    if (success) {
      toast.success(`${lead.customer.nome} marcado como cobrado`);
    } else {
      toast.error('Erro ao marcar como cobrado');
    }
  };

  const getDaysLabel = (dias: number) => {
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence amanhã';
    return `Vence em ${dias} dias`;
  };

  const getDaysBadgeVariant = (dias: number) => {
    if (dias <= 1) return 'destructive';
    if (dias <= 7) return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredLeads.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Nenhum cliente encontrado na fila de cobrança preventiva.</p>
          <p className="text-sm mt-1">Importe vendas com data de vencimento para começar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredLeads.map((lead) => {
        const isExpanded = expandedId === lead.id;
        const isCobrado = lead.status_cobranca === 'cobrado';

        return (
          <Card 
            key={lead.id} 
            className={`transition-all ${isCobrado ? 'opacity-60' : ''}`}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{lead.customer.nome}</h3>
                    <Badge variant={getDaysBadgeVariant(lead.dias_ate_vencer)} className="text-xs">
                      {getDaysLabel(lead.dias_ate_vencer)}
                    </Badge>
                    {isCobrado && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Cobrado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{formatCpfCnpj(lead.customer.cpf_cnpj)}</span>
                    <span>OS: {lead.os}</span>
                    {lead.mes_safra && <span>Safra: {lead.mes_safra}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lead.valor && (
                    <span className="font-semibold text-amber-600">
                      {formatCurrency(lead.valor)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Contact info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Vencimento:</span>{' '}
                      <span className="font-medium">
                        {format(new Date(lead.data_vencimento), "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    {lead.customer.telefone && (
                      <div>
                        <span className="text-muted-foreground">Telefone:</span>{' '}
                        <span className="font-medium">{formatPhone(lead.customer.telefone)}</span>
                      </div>
                    )}
                    {lead.customer.telefone2 && (
                      <div>
                        <span className="text-muted-foreground">Telefone 2:</span>{' '}
                        <span className="font-medium">{formatPhone(lead.customer.telefone2)}</span>
                      </div>
                    )}
                    {lead.customer.email && (
                      <div>
                        <span className="text-muted-foreground">E-mail:</span>{' '}
                        <span className="font-medium">{lead.customer.email}</span>
                      </div>
                    )}
                    {lead.customer.cidade && (
                      <div>
                        <span className="text-muted-foreground">Cidade:</span>{' '}
                        <span className="font-medium">
                          {lead.customer.cidade}{lead.customer.uf ? `/${lead.customer.uf}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {lead.customer.telefone && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => window.open(`tel:${lead.customer.telefone}`, '_blank')}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          Ligar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => window.open(`https://wa.me/55${lead.customer.telefone?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          WhatsApp
                        </Button>
                      </>
                    )}
                    {lead.customer.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => window.open(`mailto:${lead.customer.email}`, '_blank')}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        E-mail
                      </Button>
                    )}
                    
                    {!isCobrado && (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 ml-auto bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleMarkCobrado(lead)}
                        disabled={processingId === lead.id}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {processingId === lead.id ? 'Salvando...' : 'Marcar Cobrado'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
