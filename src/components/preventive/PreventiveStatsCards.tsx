import { CalendarClock, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import type { PreventiveStats } from '@/hooks/usePreventiveCollection';

interface PreventiveStatsCardsProps {
  stats: PreventiveStats;
  isLoading?: boolean;
}

export function PreventiveStatsCards({ stats, isLoading }: PreventiveStatsCardsProps) {
  const cards = [
    {
      title: 'Na Fila',
      value: stats.totalNaFila.toString(),
      icon: CalendarClock,
      description: 'Clientes a cobrar',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Vence em 7 dias',
      value: stats.vence7dias.toString(),
      icon: Clock,
      description: 'Prioridade alta',
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Valor Total',
      value: formatCurrency(stats.valorTotal),
      icon: DollarSign,
      description: 'A vencer',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Cobrados Hoje',
      value: stats.cobradosHoje.toString(),
      icon: CheckCircle,
      description: `de ${stats.vence15dias} leads`,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.title}</p>
                {isLoading ? (
                  <div className="h-5 w-12 bg-muted animate-pulse rounded mt-0.5" />
                ) : (
                  <p className="text-lg font-semibold truncate">{card.value}</p>
                )}
                <p className="text-[10px] text-muted-foreground truncate">{card.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
