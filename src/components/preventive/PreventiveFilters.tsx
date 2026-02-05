import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { PreventiveFilters as Filters } from '@/hooks/usePreventiveCollection';

interface PreventiveFiltersProps {
  filters: Filters;
  safras: string[];
  onFiltersChange: (filters: Filters) => void;
}

export function PreventiveFilters({ filters, safras, onFiltersChange }: PreventiveFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-8 h-9"
        />
      </div>

      <Select
        value={filters.safra || 'todas'}
        onValueChange={(value) => onFiltersChange({ ...filters, safra: value === 'todas' ? undefined : value })}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Safra" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas Safras</SelectItem>
          {safras.map((safra) => (
            <SelectItem key={safra} value={safra}>
              {safra}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.diasAteVencer || 'todos'}
        onValueChange={(value) => onFiltersChange({ ...filters, diasAteVencer: value as Filters['diasAteVencer'] })}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Dias até vencer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos (15 dias)</SelectItem>
          <SelectItem value="hoje">Vence Hoje</SelectItem>
          <SelectItem value="1-7">1 a 7 dias</SelectItem>
          <SelectItem value="8-15">8 a 15 dias</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
