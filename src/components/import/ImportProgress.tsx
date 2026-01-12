import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ImportProgressProps {
  progress: number;
  message?: string;
}

export const ImportProgress = ({
  progress,
  message = 'Importando dados...',
}: ImportProgressProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{message}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};
