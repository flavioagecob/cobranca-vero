import { Users, PhoneCall, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import type { CollectionStats } from '@/hooks/useCollection';

interface CollectionStatsCardsProps {
  stats: CollectionStats;
  isLoading?: boolean;
}

export function CollectionStatsCards({ stats, isLoading }: CollectionStatsCardsProps) {
  const cards = [
    {
      title: 'Na Fila',
      value: stats.totalNaFila.toString(),
      icon: Users,
      description: 'Clientes inadimplentes',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Cobrados Hoje',
      value: stats.cobradosHoje.toString(),
      icon: Calendar,
      description: `de ${stats.totalNaFila} clientes`,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Total Cobrados',
      value: stats.cobradosTotal.toString(),
      icon: PhoneCall,
      description: `${stats.totalNaFila > 0 ? Math.round((stats.cobradosTotal / stats.totalNaFila) * 100) : 0}% da fila`,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Valor Pendente',
      value: formatCurrency(stats.valorTotalPendente),
      icon: DollarSign,
      description: 'Total em atraso',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
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
