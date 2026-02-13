import { useState } from 'react';
import { Phone, MessageCircle, Mail, Clock, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatDateTime, formatCurrency } from '@/lib/formatters';
import { 
  CHANNEL_CONFIG, 
  RESULT_CONFIG, 
  PROMISE_STATUS_CONFIG,
  DELINQUENCY_REASON_CONFIG,
  type CollectionAttempt, 
  type PaymentPromise,
  type AttemptChannel,
  type AttemptResult,
  type DelinquencyReason,
  type PromiseStatus,
} from '@/types/collection';

interface HistoryTimelineProps {
  attempts: CollectionAttempt[];
  promises: PaymentPromise[];
  onEditAttempt?: (id: string, data: { channel: AttemptChannel; status: AttemptResult; notes?: string; delinquency_reason?: DelinquencyReason | null }) => Promise<void>;
  onDeleteAttempt?: (id: string) => Promise<void>;
  onEditPromise?: (id: string, data: { valor_prometido: number; data_prometida: string; status: PromiseStatus }) => Promise<void>;
  onDeletePromise?: (id: string) => Promise<void>;
}

type TimelineItem = {
  id: string;
  type: 'attempt' | 'promise';
  date: string;
  data: CollectionAttempt | PaymentPromise;
};

export function HistoryTimeline({ attempts, promises, onEditAttempt, onDeleteAttempt, onEditPromise, onDeletePromise }: HistoryTimelineProps) {
  const timeline: TimelineItem[] = [
    ...attempts.map((a) => ({
      id: a.id,
      type: 'attempt' as const,
      date: a.created_at,
      data: a,
    })),
    ...promises.map((p) => ({
      id: p.id,
      type: 'promise' as const,
      date: p.created_at,
      data: p,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                {index < timeline.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
                )}

                {item.type === 'attempt' ? (
                  <AttemptItem
                    attempt={item.data as CollectionAttempt}
                    onEdit={onEditAttempt}
                    onDelete={onDeleteAttempt}
                  />
                ) : (
                  <PromiseItem
                    promise={item.data as PaymentPromise}
                    onEdit={onEditPromise}
                    onDelete={onDeletePromise}
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AttemptItem({ attempt, onEdit, onDelete }: { 
  attempt: CollectionAttempt;
  onEdit?: (id: string, data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const channelConfig = CHANNEL_CONFIG[attempt.channel];
  const resultConfig = RESULT_CONFIG[attempt.status];
  const [editOpen, setEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    channel: attempt.channel as string,
    status: attempt.status as string,
    notes: attempt.notes || '',
    delinquency_reason: attempt.delinquency_reason || '',
  });

  const handleSave = async () => {
    if (!onEdit) return;
    setIsLoading(true);
    try {
      await onEdit(attempt.id, {
        channel: editData.channel as AttemptChannel,
        status: editData.status as AttemptResult,
        notes: editData.notes || undefined,
        delinquency_reason: editData.delinquency_reason ? editData.delinquency_reason as DelinquencyReason : null,
      });
      toast.success('Registro atualizado!');
      setEditOpen(false);
    } catch {
      toast.error('Erro ao atualizar registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(attempt.id);
      toast.success('Registro excluído!');
    } catch {
      toast.error('Erro ao excluir registro');
    }
  };

  const hasActions = onEdit || onDelete;

  return (
    <>
      <div className="flex gap-3 group">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {attempt.channel === 'telefone' && <Phone className="h-4 w-4 text-blue-600" />}
          {attempt.channel === 'whatsapp' && <MessageCircle className="h-4 w-4 text-emerald-600" />}
          {attempt.channel === 'email' && <Mail className="h-4 w-4 text-amber-600" />}
          {!['telefone', 'whatsapp', 'email'].includes(attempt.channel) && <Phone className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{channelConfig?.label || attempt.channel}</span>
            <div className="flex items-center gap-1">
              {hasActions && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este registro de tentativa? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDateTime(attempt.created_at)}
              </span>
            </div>
          </div>
          <Badge variant="outline" className={`mt-1 ${resultConfig?.color || ''}`}>
            {resultConfig?.label || attempt.status}
          </Badge>
          {attempt.delinquency_reason && DELINQUENCY_REASON_CONFIG[attempt.delinquency_reason] && (
            <Badge variant="outline" className={`mt-1 ml-1 ${DELINQUENCY_REASON_CONFIG[attempt.delinquency_reason].color}`}>
              {DELINQUENCY_REASON_CONFIG[attempt.delinquency_reason].label}
            </Badge>
          )}
          {attempt.notes && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {attempt.notes}
            </p>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tentativa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Canal</Label>
              <Select value={editData.channel} onValueChange={(v) => setEditData({ ...editData, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resultado</Label>
              <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RESULT_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo da Inadimplência</Label>
              <Select value={editData.delinquency_reason || 'none'} onValueChange={(v) => setEditData({ ...editData, delinquency_reason: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {Object.entries(DELINQUENCY_REASON_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PromiseItem({ promise, onEdit, onDelete }: { 
  promise: PaymentPromise;
  onEdit?: (id: string, data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const statusConfig = promise.status ? PROMISE_STATUS_CONFIG[promise.status] : null;
  const [editOpen, setEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    valor_prometido: promise.valor_prometido,
    data_prometida: promise.data_prometida,
    status: (promise.status || 'pendente') as PromiseStatus,
  });

  const handleSave = async () => {
    if (!onEdit) return;
    setIsLoading(true);
    try {
      await onEdit(promise.id, {
        valor_prometido: editData.valor_prometido,
        data_prometida: editData.data_prometida,
        status: editData.status as PromiseStatus,
      });
      toast.success('Promessa atualizada!');
      setEditOpen(false);
    } catch {
      toast.error('Erro ao atualizar promessa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      await onDelete(promise.id);
      toast.success('Promessa excluída!');
    } catch {
      toast.error('Erro ao excluir promessa');
    }
  };

  const hasActions = onEdit || onDelete;

  return (
    <>
      <div className="flex gap-3 group">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Clock className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Promessa de Pagamento</span>
            <div className="flex items-center gap-1">
              {hasActions && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir promessa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta promessa de pagamento? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDateTime(promise.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold">
              {formatCurrency(promise.valor_prometido)}
            </span>
            {statusConfig && (
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Previsão: {new Date(promise.data_prometida).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Promessa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor Prometido</Label>
              <Input
                type="number"
                step="0.01"
                value={editData.valor_prometido}
                onChange={(e) => setEditData({ ...editData, valor_prometido: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Data Prometida</Label>
              <Input
                type="date"
                value={editData.data_prometida}
                onChange={(e) => setEditData({ ...editData, data_prometida: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v as PromiseStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROMISE_STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
