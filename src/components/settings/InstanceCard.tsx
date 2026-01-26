import { Wifi, WifiOff, Loader2, Phone, Trash2, Link, Unlink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Instance } from '@/types/instance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface InstanceCardProps {
  instance: Instance;
  onConnect: (instance: Instance) => void;
  onDisconnect: (instance: Instance) => void;
  onDelete: (id: string) => void;
  isDisconnecting?: boolean;
}

export function InstanceCard({ 
  instance, 
  onConnect, 
  onDisconnect, 
  onDelete,
  isDisconnecting 
}: InstanceCardProps) {
  const getStatusBadge = () => {
    switch (instance.status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
            <Wifi className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Conectando
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <WifiOff className="h-3 w-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{instance.name}</h3>
              {getStatusBadge()}
            </div>
            {instance.phone_number && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {instance.phone_number}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              ID: {instance.instance_id}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {instance.status === 'connected' ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDisconnect(instance)}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Unlink className="h-4 w-4 mr-1" />
                    Desconectar
                  </>
                )}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onConnect(instance)}
                disabled={instance.status === 'connecting'}
              >
                <Link className="h-4 w-4 mr-1" />
                Conectar
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir instância?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A instância "{instance.name}" será permanentemente excluída.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(instance.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
