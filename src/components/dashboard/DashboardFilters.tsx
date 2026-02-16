import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardFiltersProps {
  safra: string;
  parcela: string;
  onSafraChange: (value: string) => void;
  onParcelaChange: (value: string) => void;
  safraOptions: string[];
  parcelaOptions: string[];
}

export function DashboardFilters({
  safra,
  parcela,
  onSafraChange,
  onParcelaChange,
  safraOptions,
  parcelaOptions,
}: DashboardFiltersProps) {
  const hasFilters = safra !== 'all' || parcela !== 'all';

  const clearFilters = () => {
    onSafraChange('all');
    onParcelaChange('all');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={safra} onValueChange={onSafraChange}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Safra" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Safra: Todas</SelectItem>
          {safraOptions.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {parcelaOptions.length > 0 && (
        <Select value={parcela} onValueChange={onParcelaChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Parcela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Parcela: Todas</SelectItem>
            {parcelaOptions.map((p) => (
              <SelectItem key={p} value={p}>{p}ª Parcela</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
