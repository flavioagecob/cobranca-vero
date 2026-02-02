import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ClearDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  recordCount: number;
  onConfirm: () => Promise<void>;
  isClearing: boolean;
}

export function ClearDataDialog({
  open,
  onOpenChange,
  title,
  description,
  recordCount,
  onConfirm,
  isClearing,
}: ClearDataDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  
  const isConfirmEnabled = confirmText === 'CONFIRMAR';

  const handleConfirm = async () => {
    if (!isConfirmEnabled) return;
    await onConfirm();
    setConfirmText('');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isClearing) {
      setConfirmText('');
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              ⚠️ Esta ação é irreversível!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Serão excluídos <strong className="text-foreground">{recordCount.toLocaleString('pt-BR')}</strong> registros.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Digite <strong>CONFIRMAR</strong> para prosseguir:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Digite CONFIRMAR"
              disabled={isClearing}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isClearing}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isClearing}
          >
            {isClearing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Dados'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
