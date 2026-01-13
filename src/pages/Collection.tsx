import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/hooks/useCollection';
import { CollectionQueue } from '@/components/collection/CollectionQueue';
import { CustomerInfoCard } from '@/components/collection/CustomerInfoCard';
import { AttemptForm, type AttemptFormData } from '@/components/collection/AttemptForm';
import { MessageTemplates } from '@/components/collection/MessageTemplates';
import { HistoryTimeline } from '@/components/collection/HistoryTimeline';
import { toast } from 'sonner';
import type { AttemptChannel } from '@/types/collection';

export default function Collection() {
  const {
    queue,
    selectedCustomer,
    attempts,
    promises,
    isLoading,
    error,
    selectCustomer,
    registerAttempt,
    registerPromise,
    refreshQueue,
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

    setIsSaving(true);
    try {
      await registerAttempt({
        customer_id: selectedCustomer.customer_id,
        canal: data.canal,
        resultado: data.resultado,
        observacoes: data.observacoes,
      });

      if (data.createPromise && data.promiseData) {
        await registerPromise({
          customer_id: selectedCustomer.customer_id,
          valor_prometido: data.promiseData.valor_prometido,
          data_pagamento_previsto: data.promiseData.data_pagamento_previsto,
          observacoes: data.promiseData.observacoes,
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
          <h1 className="text-2xl font-bold tracking-tight">Workstation de Cobrança</h1>
          <p className="text-muted-foreground">
            Interface operacional para cobradores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshQueue}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-12 h-[calc(100vh-220px)]">
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
                      valorPendente={selectedCustomer.total_pendente}
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
              <h3 className="text-lg font-medium">Nenhum cliente selecionado</h3>
              <p className="text-muted-foreground mt-1">
                Selecione um cliente na fila para iniciar a cobrança
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
