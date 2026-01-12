import { useCallback } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isLoading?: boolean;
  accept?: string;
}

export const FileUploadZone = ({
  onFileSelect,
  selectedFile,
  onClear,
  isLoading = false,
  accept = '.xlsx,.xls,.csv',
}: FileUploadZoneProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors',
        'border-border hover:border-primary/50 hover:bg-muted/50',
        isLoading && 'opacity-50 pointer-events-none'
      )}
    >
      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg font-medium text-foreground mb-1">
        Arraste sua planilha aqui
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        ou clique para selecionar
      </p>
      <label>
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={isLoading}
        />
        <Button variant="outline" asChild disabled={isLoading}>
          <span className="cursor-pointer">Selecionar Arquivo</span>
        </Button>
      </label>
      <p className="text-xs text-muted-foreground mt-4">
        Formatos aceitos: XLSX, XLS, CSV
      </p>
    </div>
  );
};
