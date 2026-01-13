import { useState, useCallback, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Phone, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { PROMISE_STATUS_CONFIG, type PaymentPromise, type PromiseStatus } from '@/types/collection';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function CollectionKanban() {
  const [promises, setPromises] = useState<(PaymentPromise & { customer?: { nome: string } })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPromises = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_promises')
        .select(`
          *,
          customer:customers(nome)
        `)
        .order('data_pagamento_previsto', { ascending: true });

      if (error) {
        console.log('Payment promises table not available:', error.message);
        setPromises([]);
        return;
      }

      setPromises(data || []);
    } catch (err) {
      console.error('Error fetching promises:', err);
      setPromises([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromises();
  }, [fetchPromises]);

  const updateStatus = async (id: string, status: PromiseStatus) => {
    try {
      const { error } = await supabase
        .from('payment_promises')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Status atualizado para ${PROMISE_STATUS_CONFIG[status].label}`);
      fetchPromises();
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  const columns: { status: PromiseStatus; title: string; icon: React.ReactNode }[] = [
    { status: 'pendente', title: 'Pendentes', icon: <Clock className="h-4 w-4 text-amber-600" /> },
    { status: 'cumprida', title: 'Cumpridas', icon: <CheckCircle className="h-4 w-4 text-emerald-600" /> },
    { status: 'quebrada', title: 'Quebradas', icon: <XCircle className="h-4 w-4 text-destructive" /> },
  ];

  const getPromisesByStatus = (status: PromiseStatus) => 
    promises.filter((p) => p.status === status);

  const isOverdue = (promise: PaymentPromise) => {
    if (promise.status !== 'pendente') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const promiseDate = new Date(promise.data_pagamento_previsto);
    promiseDate.setHours(0, 0, 0, 0);
    return promiseDate < today;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kanban de Promessas</h1>
        <p className="text-muted-foreground">
          Acompanhe as promessas de pagamento
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando...
        </div>
      ) : promises.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma promessa registrada</h3>
              <p className="text-muted-foreground mt-1">
                Registre promessas de pagamento na tela de cobrança
              </p>
              <Button className="mt-4" asChild>
                <Link to="/collection">Ir para Cobrança</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((column) => (
            <div key={column.status} className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className="font-medium">{column.title}</h3>
                </div>
                <Badge variant="secondary">
                  {getPromisesByStatus(column.status).length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/50">
                {getPromisesByStatus(column.status).map((promise) => (
                  <Card 
                    key={promise.id} 
                    className={isOverdue(promise) ? 'border-destructive/50' : ''}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm line-clamp-1">
                            {promise.customer?.nome || 'Cliente'}
                          </p>
                          <p className="text-lg font-bold">
                            {formatCurrency(promise.valor_prometido)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {column.status !== 'cumprida' && (
                              <DropdownMenuItem onClick={() => updateStatus(promise.id, 'cumprida')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                                Marcar como Cumprida
                              </DropdownMenuItem>
                            )}
                            {column.status !== 'quebrada' && (
                              <DropdownMenuItem onClick={() => updateStatus(promise.id, 'quebrada')}>
                                <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                Marcar como Quebrada
                              </DropdownMenuItem>
                            )}
                            {column.status !== 'pendente' && (
                              <DropdownMenuItem onClick={() => updateStatus(promise.id, 'pendente')}>
                                <Clock className="h-4 w-4 mr-2 text-amber-600" />
                                Voltar para Pendente
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Previsão: {formatDate(promise.data_pagamento_previsto)}</span>
                        {isOverdue(promise) && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Vencida
                          </Badge>
                        )}
                      </div>

                      {promise.observacoes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {promise.observacoes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {getPromisesByStatus(column.status).length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Nenhuma promessa
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
