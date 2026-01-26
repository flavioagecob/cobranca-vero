import { Users, Search, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CollectionQueueItem } from '@/types/collection';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CollectionQueueProps {
  queue: CollectionQueueItem[];
  selectedCustomerId: string | null;
  onSelectCustomer: (customer: CollectionQueueItem) => void;
  isLoading: boolean;
}

export function CollectionQueue({ 
  queue, 
  selectedCustomerId, 
  onSelectCustomer,
  isLoading 
}: CollectionQueueProps) {
  const [search, setSearch] = useState('');

  const filteredQueue = queue.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.customer_name.toLowerCase().includes(searchLower) ||
      item.customer_cpf_cnpj.includes(search)
    );
  });

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      {/* Header */}
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Fila de Cobrança</span>
          </div>
          <Badge variant="secondary">{queue.length}</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Queue List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search ? 'Nenhum cliente encontrado' : 'Fila vazia'}
            </div>
          ) : (
            filteredQueue.map((item) => (
              <Button
                key={item.customer_id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto py-2 px-3",
                  selectedCustomerId === item.customer_id && "bg-accent"
                )}
                onClick={() => onSelectCustomer(item)}
              >
                <div className="flex flex-col items-start w-full gap-1">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {item.has_attempt && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cliente já cobrado</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <span className="font-medium text-sm truncate max-w-[130px]">
                        {item.customer_name}
                      </span>
                    </div>
                    {item.max_dias_atraso > 0 && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1 py-0",
                          item.max_dias_atraso <= 15 && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          item.max_dias_atraso > 15 && item.max_dias_atraso <= 30 && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                          item.max_dias_atraso > 30 && "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                      >
                        {item.max_dias_atraso}d
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span className="font-mono">
                      {item.customer_cpf_cnpj.slice(0, 3)}...{item.customer_cpf_cnpj.slice(-2)}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.total_pendente)}
                    </span>
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
