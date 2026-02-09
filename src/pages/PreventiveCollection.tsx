import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreventiveCollection } from '@/hooks/usePreventiveCollection';
import { PreventiveQueue } from '@/components/preventive/PreventiveQueue';
import { PreventiveCustomerCard } from '@/components/preventive/PreventiveCustomerCard';
import { PreventiveMessageTemplates } from '@/components/preventive/PreventiveMessageTemplates';
import { PreventiveStatsCards } from '@/components/preventive/PreventiveStatsCards';
import { PreventiveFilters } from '@/components/preventive/PreventiveFilters';
import { AttemptForm, type AttemptFormData } from '@/components/collection/AttemptForm';
import { HistoryTimeline } from '@/components/collection/HistoryTimeline';
import { toast } from 'sonner';
import type { AttemptChannel } from '@/types/collection';

export default function PreventiveCollection() {
  const {
    queue,
    selectedCustomer,
    attempts,
    stats,
    safras,
    isLoading,
    filters,
    setFilters,
    selectCustomer,
    nextCustomer,
    previousCustomer,
    registerAttempt,
    refreshQueue,
    refreshHistory,
  } = usePreventiveCollection();

  const [showAttemptForm, setShowAttemptForm] = useState(false);
  const [attemptChannel, setAttemptChannel] = useState<AttemptChannel>('telefone');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartAttempt = (channel: AttemptChannel) => {
    setAttemptChannel(channel);
    setShowAttemptForm(true);
  };

  const handleSubmitAttempt = async (data: AttemptFormData) => {
    if (!selectedCustomer) return;

    setIsSaving(true);
    try {
      await registerAttempt({
        customer_id: selectedCustomer.customer_id,
        invoice_id: selectedCustomer.id, // sales_base id as reference
        channel: data.channel,
        status: data.status,
        notes: data.notes,
      });

      toast.success('Tentativa registrada!');
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
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight">Cobrança Preventiva</h1>
          </div>
          <p className="text-muted-foreground">
            Fila de clientes com faturas a vencer
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.safra || 'todas'}
            onValueChange={(v) => setFilters({ ...filters, safra: v === 'todas' ? undefined : v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Safra: Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Safra: Todas</SelectItem>
              {safras.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.diasAteVencer || 'todos'}
            onValueChange={(v) => setFilters({ ...filters, diasAteVencer: v as any })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Vencimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="hoje">Vence Hoje</SelectItem>
              <SelectItem value="1-7">1 a 7 dias</SelectItem>
              <SelectItem value="8-15">8 a 15 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={refreshQueue}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <PreventiveStatsCards stats={stats} isLoading={isLoading} />

      {/* Main Content - Two Pane Layout */}
      <div className="grid gap-4 lg:grid-cols-12 overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
        {/* Queue Sidebar */}
        <div className="lg:col-span-3 h-full">
          <PreventiveQueue
            queue={queue}
            selectedCustomerId={selectedCustomer?.id || null}
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
                  {queue.findIndex((c) => c.id === selectedCustomer.id) + 1} de {queue.length}
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
                  <PreventiveCustomerCard
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
                    <PreventiveMessageTemplates
                      customerName={selectedCustomer.customer_name}
                      customerCpf={selectedCustomer.customer_cpf_cnpj}
                      customerPhone={selectedCustomer.customer_phone || ''}
                      customerId={selectedCustomer.customer_id}
                      salesBaseId={selectedCustomer.id}
                      dataVencimento={selectedCustomer.data_vencimento}
                      onMessageSent={async () => {
                        await refreshHistory();
                        refreshQueue();
                      }}
                    />
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <HistoryTimeline attempts={attempts} promises={[]} />

                  {!showAttemptForm && (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleStartAttempt('telefone')}
                    >
                      <CalendarClock className="h-4 w-4 mr-2" />
                      Registrar Nova Tentativa
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {isLoading ? 'Carregando...' : 'Nenhum cliente na fila preventiva'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {isLoading
                  ? 'Buscando clientes com faturas a vencer...'
                  : 'Importe uma base preventiva para começar a trabalhar'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
