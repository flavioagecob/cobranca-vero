import { FileText, Clock, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import type { InvoiceStats } from '@/types/invoice';

interface InvoiceStatsCardsProps {
  stats: InvoiceStats;
  isLoading: boolean;
}

export function InvoiceStatsCards({ stats, isLoading }: InvoiceStatsCardsProps) {
  const cards = [
    {
      title: 'Total de Faturas',
      value: stats.total,
      subtitle: formatCurrency(stats.valorTotal),
      icon: FileText,
      iconClass: 'text-muted-foreground',
    },
    {
      title: 'Pendentes',
      value: stats.pendente,
      subtitle: formatCurrency(stats.valorPendente),
      icon: Clock,
      iconClass: 'text-amber-500',
    },
    {
      title: 'Atrasadas',
      value: stats.atrasado,
      subtitle: formatCurrency(stats.valorAtrasado),
      icon: AlertTriangle,
      iconClass: 'text-destructive',
    },
    {
      title: 'Pagas',
      value: stats.pago,
      subtitle: 'faturas quitadas',
      icon: CheckCircle,
      iconClass: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconClass}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '-' : card.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Carregando...' : card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
