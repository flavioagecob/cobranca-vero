import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { ColumnMapping } from '@/types/import';
import { FIELD_LABELS } from '@/types/import';

interface ColumnMapperProps {
  availableColumns: string[];
  mappings: ColumnMapping[];
  onMappingChange: (field: string, sourceColumn: string) => void;
}

export const ColumnMapper = ({
  availableColumns,
  mappings,
  onMappingChange,
}: ColumnMapperProps) => {
  const mappingStatus = useMemo(() => {
    const required = mappings.filter((m) => m.required);
    const mappedRequired = required.filter((m) => m.sourceColumn);
    return {
      total: mappings.length,
      mapped: mappings.filter((m) => m.sourceColumn).length,
      requiredTotal: required.length,
      requiredMapped: mappedRequired.length,
      isValid: mappedRequired.length === required.length,
    };
  }, [mappings]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Mapeamento de Colunas
        </h3>
        <div className="flex items-center gap-2">
          {mappingStatus.isValid ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Pronto
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              {mappingStatus.requiredTotal - mappingStatus.requiredMapped} obrigatório(s)
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {mappingStatus.mapped}/{mappingStatus.total} mapeados
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mappings.map((mapping) => (
          <div key={mapping.targetField} className="space-y-2">
            <Label className="flex items-center gap-2">
              {FIELD_LABELS[mapping.targetField] || mapping.targetField}
              {mapping.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Select
              value={mapping.sourceColumn || 'none'}
              onValueChange={(value) =>
                onMappingChange(mapping.targetField, value === 'none' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a coluna..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Não mapear</span>
                </SelectItem>
                {availableColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
};
