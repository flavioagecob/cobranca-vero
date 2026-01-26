import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from '@/hooks/useCollection';
import { CollectionQueue } from '@/components/collection/CollectionQueue';
import { CustomerInfoCard } from '@/components/collection/CustomerInfoCard';
import { AttemptForm, type AttemptFormData } from '@/components/collection/AttemptForm';
import { MessageTemplates } from '@/components/collection/MessageTemplates';
import { HistoryTimeline } from '@/components/collection/HistoryTimeline';
import { CollectionStatsCards } from '@/components/collection/CollectionStatsCards';
import { toast } from 'sonner';
import type { AttemptChannel } from '@/types/collection';

export default function Collection() {
  const {
    queue,
    selectedCustomer,
    attempts,
    promises,
    stats,
    isLoading,
    error,
    filters,
    safraOptions,
    parcelaOptions,
    setFilters,
    selectCustomer,
    registerAttempt,
    registerPromise,
    refreshQueue,
    refreshHistory,
    nextCustomer,
    previousCustomer,
  } = useCollection();

  const [showAttemptForm, setShowAttemptForm] = useState(false);
  const [attemptChannel, setAttemptChannel] = useState<AttemptChannel>('telefone');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartAttempt = (channel: AttemptChannel) => {
    setAttemptChannel(channel);
    setShowAttemptForm(true);
  };

  const handleSubmitAttempt = async (data: AttemptFormData) => {
    if (!selectedCustomer) return;

    // Use first_invoice_id from the customer queue item
    const invoiceId = selectedCustomer.first_invoice_id;
    if (!invoiceId) {
      toast.error('Nenhuma fatura encontrada para este cliente');
      return;
    }

    setIsSaving(true);
    try {
      await registerAttempt({
        customer_id: selectedCustomer.customer_id,
        invoice_id: invoiceId,
        channel: data.channel,
        status: data.status,
        notes: data.notes,
      });

      if (data.createPromise && data.promiseData) {
        await registerPromise({
          invoice_id: invoiceId,
          valor_prometido: data.promiseData.valor_prometido,
          data_prometida: data.promiseData.data_prometida,
        });
        toast.success('Tentativa e promessa registradas!');
      } else {
        toast.success('Tentativa registrada!');
      }

      setShowAttemptForm(false);
    } catch (err) {
      toast.error('Erro ao registrar tentativa');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cobrança</h1>
          <p className="text-muted-foreground">
            Fila de clientes com faturas vencidas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select 
            value={filters.safra} 
            onValueChange={(v) => setFilters({ ...filters, safra: v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Safra: Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Safra: Todas</SelectItem>
              {safraOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={filters.parcela} 
            onValueChange={(v) => setFilters({ ...filters, parcela: v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Parcela: Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Parcela: Todas</SelectItem>
              {parcelaOptions.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={refreshQueue}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <CollectionStatsCards stats={stats} isLoading={isLoading} />

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-12 h-[calc(100vh-300px)]">
        {/* Queue Sidebar */}
        <div className="lg:col-span-3 h-full">
          <CollectionQueue
            queue={queue}
            selectedCustomerId={selectedCustomer?.customer_id || null}
            onSelectCustomer={selectCustomer}
            isLoading={isLoading}
          />
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-9 space-y-4 overflow-y-auto">
          {selectedCustomer ? (
            <>
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={previousCustomer}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  {queue.findIndex((c) => c.customer_id === selectedCustomer.customer_id) + 1} de {queue.length}
                </span>
                <Button variant="outline" size="sm" onClick={nextCustomer}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Two-column layout */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  <CustomerInfoCard 
                    customer={selectedCustomer} 
                    onStartAttempt={handleStartAttempt}
                  />

                  {showAttemptForm ? (
                    <AttemptForm
                      customerId={selectedCustomer.customer_id}
                      initialChannel={attemptChannel}
                      onSubmit={handleSubmitAttempt}
                      onCancel={() => setShowAttemptForm(false)}
                      isLoading={isSaving}
                    />
                  ) : (
                    <MessageTemplates
                      customerName={selectedCustomer.customer_name}
                      customerCpf={selectedCustomer.customer_cpf_cnpj}
                      customerPhone={selectedCustomer.customer_phone || ''}
                      customerId={selectedCustomer.customer_id}
                      invoiceId={selectedCustomer.first_invoice_id}
                      valorPendente={selectedCustomer.total_pendente}
                      diasAtraso={selectedCustomer.max_dias_atraso}
                      onMessageSent={async () => {
                        await refreshHistory();
                        refreshQueue();
                      }}
                    />
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <HistoryTimeline attempts={attempts} promises={promises} />

                  {!showAttemptForm && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleStartAttempt('telefone')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Registrar Nova Tentativa
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {isLoading ? 'Carregando...' : 'Nenhum cliente com fatura vencida'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {isLoading 
                  ? 'Buscando clientes com faturas vencidas...' 
                  : 'Todos os clientes estão em dia ou não há faturas para os filtros selecionados'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
