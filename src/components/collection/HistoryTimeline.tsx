import { Phone, MessageCircle, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime, formatCurrency } from '@/lib/formatters';
import { 
  CHANNEL_CONFIG, 
  RESULT_CONFIG, 
  PROMISE_STATUS_CONFIG,
  type CollectionAttempt, 
  type PaymentPromise 
} from '@/types/collection';

interface HistoryTimelineProps {
  attempts: CollectionAttempt[];
  promises: PaymentPromise[];
}

type TimelineItem = {
  id: string;
  type: 'attempt' | 'promise';
  date: string;
  data: CollectionAttempt | PaymentPromise;
};

export function HistoryTimeline({ attempts, promises }: HistoryTimelineProps) {
  // Combine and sort by date
  const timeline: TimelineItem[] = [
    ...attempts.map((a) => ({
      id: a.id,
      type: 'attempt' as const,
      date: a.data_tentativa,
      data: a,
    })),
    ...promises.map((p) => ({
      id: p.id,
      type: 'promise' as const,
      date: p.created_at,
      data: p,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getChannelIcon = (canal: string) => {
    switch (canal) {
      case 'telefone': return <Phone className="h-4 w-4 text-blue-600" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-emerald-600" />;
      case 'email': return <Mail className="h-4 w-4 text-amber-600" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum registro de cobrança para este cliente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-4">
            {timeline.map((item, index) => (
              <div key={item.id} className="relative">
                {/* Timeline line */}
                {index < timeline.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
                )}

                {item.type === 'attempt' ? (
                  <AttemptItem attempt={item.data as CollectionAttempt} />
                ) : (
                  <PromiseItem promise={item.data as PaymentPromise} />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AttemptItem({ attempt }: { attempt: CollectionAttempt }) {
  const channelConfig = CHANNEL_CONFIG[attempt.canal];
  const resultConfig = RESULT_CONFIG[attempt.resultado];

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        {attempt.canal === 'telefone' && <Phone className="h-4 w-4 text-blue-600" />}
        {attempt.canal === 'whatsapp' && <MessageCircle className="h-4 w-4 text-emerald-600" />}
        {attempt.canal === 'email' && <Mail className="h-4 w-4 text-amber-600" />}
        {!['telefone', 'whatsapp', 'email'].includes(attempt.canal) && <Phone className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{channelConfig?.label || attempt.canal}</span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(attempt.data_tentativa)}
          </span>
        </div>
        <Badge variant="outline" className={`mt-1 ${resultConfig?.color || ''}`}>
          {resultConfig?.label || attempt.resultado}
        </Badge>
        {attempt.observacoes && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {attempt.observacoes}
          </p>
        )}
      </div>
    </div>
  );
}

function PromiseItem({ promise }: { promise: PaymentPromise }) {
  const statusConfig = PROMISE_STATUS_CONFIG[promise.status];

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
        <Clock className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Promessa de Pagamento</span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(promise.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold">
            {formatCurrency(promise.valor_prometido)}
          </span>
          <Badge variant="outline" className={statusConfig?.color || ''}>
            {statusConfig?.label || promise.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Previsão: {new Date(promise.data_pagamento_previsto).toLocaleDateString('pt-BR')}
        </p>
        {promise.observacoes && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {promise.observacoes}
          </p>
        )}
      </div>
    </div>
  );
}
