import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import type { InvoiceStats, InvoiceStatus } from '@/types/invoice';

interface InvoiceStatsCardsProps {
  stats: InvoiceStats;
  isLoading: boolean;
  currentFilter: InvoiceStatus | 'all';
  onFilterChange: (status: InvoiceStatus | 'all') => void;
}

export function InvoiceStatsCards({ stats, isLoading, currentFilter, onFilterChange }: InvoiceStatsCardsProps) {
  const cards = [
    {
      title: 'Total de Faturas',
      value: stats.total,
      subtitle: formatCurrency(stats.valorTotal),
      icon: FileText,
      iconClass: 'text-muted-foreground',
      filterValue: 'all' as const,
    },
    {
      title: 'Pendentes',
      value: stats.pendente,
      subtitle: formatCurrency(stats.valorPendente),
      icon: Clock,
      iconClass: 'text-amber-500',
      filterValue: 'pendente' as InvoiceStatus,
    },
    {
      title: 'Atrasadas',
      value: stats.atrasado,
      subtitle: formatCurrency(stats.valorAtrasado),
      icon: AlertTriangle,
      iconClass: 'text-destructive',
      filterValue: 'atrasado' as InvoiceStatus,
    },
    {
      title: 'Pagas',
      value: stats.pago,
      subtitle: 'faturas quitadas',
      icon: CheckCircle,
      iconClass: 'text-emerald-600',
      filterValue: 'pago' as InvoiceStatus,
    },
  ];

  const getCardHighlightClass = (filterValue: InvoiceStatus | 'all') => {
    if (currentFilter !== filterValue) return '';
    switch (filterValue) {
      case 'all': return 'ring-2 ring-primary';
      case 'pendente': return 'ring-2 ring-amber-500';
      case 'atrasado': return 'ring-2 ring-destructive';
      case 'pago': return 'ring-2 ring-emerald-600';
      default: return '';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card 
          key={card.title}
          className={`cursor-pointer transition-all hover:shadow-md ${getCardHighlightClass(card.filterValue)}`}
          onClick={() => onFilterChange(card.filterValue)}
        >
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
