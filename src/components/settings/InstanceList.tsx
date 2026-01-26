import { useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInstances } from '@/hooks/useInstances';
import { InstanceCard } from './InstanceCard';
import { CreateInstanceDialog } from './CreateInstanceDialog';
import { ConnectInstanceDialog } from './ConnectInstanceDialog';
import { Instance } from '@/types/instance';

export function InstanceList() {
  const {
    instances,
    isLoading,
    error,
    isCreating,
    createInstance,
    connectInstance,
    checkStatus,
    disconnectInstance,
    deleteInstance,
    refreshInstances,
  } = useInstances();

  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const handleConnect = (instance: Instance) => {
    setSelectedInstance(instance);
    setConnectDialogOpen(true);
  };

  const handleConnectDialogChange = (open: boolean) => {
    setConnectDialogOpen(open);
    // Refresh instances when dialog closes to update status
    if (!open) {
      refreshInstances();
    }
  };

  const handleDisconnect = async (instance: Instance) => {
    setDisconnectingId(instance.id);
    await disconnectInstance(instance.instance_id, instance.token);
    setDisconnectingId(null);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar instâncias: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Instâncias WhatsApp
              </CardTitle>
              <CardDescription>
                Gerencie suas instâncias de WhatsApp para envio de mensagens
              </CardDescription>
            </div>
            <CreateInstanceDialog
              onCreateInstance={createInstance}
              isCreating={isCreating}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma instância cadastrada</p>
              <p className="text-sm text-muted-foreground">
                Clique em "Nova Instância" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <InstanceCard
                  key={instance.id}
                  instance={instance}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onDelete={deleteInstance}
                  isDisconnecting={disconnectingId === instance.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConnectInstanceDialog
        instance={selectedInstance}
        open={connectDialogOpen}
        onOpenChange={handleConnectDialogChange}
        onConnect={connectInstance}
      />
    </>
  );
}
