import { useState, useEffect, useCallback } from 'react';
import { Loader2, QrCode, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Instance, ConnectResult, StatusResult } from '@/types/instance';

interface ConnectInstanceDialogProps {
  instance: Instance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (instanceId: string, token: string) => Promise<ConnectResult>;
  onCheckStatus: (instanceId: string, token: string) => Promise<StatusResult>;
}

type ConnectionState = 'loading' | 'qr_code' | 'connected' | 'error';

export function ConnectInstanceDialog({
  instance,
  open,
  onOpenChange,
  onConnect,
  onCheckStatus,
}: ConnectInstanceDialogProps) {
  const [state, setState] = useState<ConnectionState>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startConnection = useCallback(async () => {
    if (!instance) return;

    setState('loading');
    setError(null);

    const result = await onConnect(instance.instance_id, instance.token);

    if (result.success && result.qr_code_base64) {
      setQrCode(result.qr_code_base64);
      setState('qr_code');
    } else {
      setError(result.error || 'Erro ao gerar QR Code');
      setState('error');
    }
  }, [instance, onConnect]);

  const checkConnectionStatus = useCallback(async () => {
    if (!instance || state !== 'qr_code') return;

    const result = await onCheckStatus(instance.instance_id, instance.token);

    if (result.success && result.status === 'connected') {
      setState('connected');
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    }
  }, [instance, state, onCheckStatus, onOpenChange]);

  // Start connection when dialog opens
  useEffect(() => {
    if (open && instance) {
      startConnection();
    } else {
      setState('loading');
      setQrCode(null);
      setError(null);
    }
  }, [open, instance, startConnection]);

  // Poll for status when showing QR code
  useEffect(() => {
    if (state !== 'qr_code') return;

    const interval = setInterval(checkConnectionStatus, 3000);
    return () => clearInterval(interval);
  }, [state, checkConnectionStatus]);

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Gerando QR Code...</p>
          </div>
        );

      case 'qr_code':
        return (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            {qrCode ? (
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code"
                className="w-64 h-64 border rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-muted">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <div className="text-center space-y-1">
              <p className="font-medium">Escaneie o QR Code</p>
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp no seu celular e escaneie o código acima
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aguardando conexão...
            </div>
          </div>
        );

      case 'connected':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <div className="text-center">
              <p className="font-medium text-lg">Conectado com sucesso!</p>
              <p className="text-sm text-muted-foreground">
                A instância está pronta para uso
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <div className="text-center">
              <p className="font-medium text-lg">Erro ao conectar</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={startConnection}>Tentar novamente</Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar Instância</DialogTitle>
          <DialogDescription>
            {instance?.name}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
