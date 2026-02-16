import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyTrendItem } from '@/hooks/useDashboardStats';

const chartConfig = {
  overdueCount: { label: 'Vencidas', color: 'hsl(var(--destructive))' },
  pendingCount: { label: 'Pendentes', color: 'hsl(45 93% 47%)' },
  paidCount: { label: 'Pagas', color: 'hsl(142 76% 36%)' },
  overdueValue: { label: 'Vencidas', color: 'hsl(var(--destructive))' },
  pendingValue: { label: 'Pendentes', color: 'hsl(45 93% 47%)' },
  paidValue: { label: 'Pagas', color: 'hsl(142 76% 36%)' },
};

interface Props {
  data: MonthlyTrendItem[];
  isLoading: boolean;
}

export function MonthlyTrendChart({ data, isLoading }: Props) {
  const [tab, setTab] = useState<'count' | 'value'>('count');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  const countKeys = ['overdueCount', 'pendingCount', 'paidCount'] as const;
  const valueKeys = ['overdueValue', 'pendingValue', 'paidValue'] as const;

  const formatValue = (v: number) =>
    tab === 'value'
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
      : String(v);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Evolução Mensal</CardTitle>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'count' | 'value')}>
          <TabsList className="h-8">
            <TabsTrigger value="count" className="text-xs px-2 py-1">Quantidade</TabsTrigger>
            <TabsTrigger value="value" className="text-xs px-2 py-1">Valor (R$)</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (tab === 'value' ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const label = chartConfig[name as keyof typeof chartConfig]?.label || name;
                    return (
                      <span>
                        {label}: <strong>{formatValue(Number(value))}</strong>
                      </span>
                    );
                  }}
                />
              }
            />
            {(tab === 'count' ? countKeys : valueKeys).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={chartConfig[key].color}
                radius={key.includes('paid') ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
