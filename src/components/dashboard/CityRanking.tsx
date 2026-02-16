import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import type { CityRankingItem } from '@/hooks/useDashboardStats';

interface CityRankingProps {
  inadimplencia: CityRankingItem[];
  adimplencia: CityRankingItem[];
  isLoading: boolean;
}

function RankingList({ items, variant }: { items: CityRankingItem[]; variant: 'destructive' | 'success' }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum dado encontrado
      </p>
    );
  }

  const maxValue = items[0]?.value || 1;

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.cidade} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium truncate mr-2">
              {index + 1}. {item.cidade}
            </span>
            <span className="text-muted-foreground whitespace-nowrap">
              {item.count} faturas · {formatCurrency(item.value)}
            </span>
          </div>
          <Progress
            value={(item.value / maxValue) * 100}
            className={`h-2 ${variant === 'destructive' ? '[&>div]:bg-destructive' : '[&>div]:bg-emerald-500'}`}
          />
        </div>
      ))}
    </div>
  );
}

export function CityRanking({ inadimplencia, adimplencia, isLoading }: CityRankingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ranking de Cidades</CardTitle>
        <CardDescription>Top 10 cidades por volume financeiro</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Tabs defaultValue="inadimplencia">
            <TabsList className="w-full">
              <TabsTrigger value="inadimplencia" className="flex-1">Mais Inadimplência</TabsTrigger>
              <TabsTrigger value="adimplencia" className="flex-1">Mais Adimplência</TabsTrigger>
            </TabsList>
            <TabsContent value="inadimplencia">
              <RankingList items={inadimplencia} variant="destructive" />
            </TabsContent>
            <TabsContent value="adimplencia">
              <RankingList items={adimplencia} variant="success" />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
