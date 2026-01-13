import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UF_LIST } from '@/lib/formatters';
import type { CustomerFilters as Filters } from '@/types/customer';

interface CustomerFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  safraOptions: string[];
}

export function CustomerFilters({ filters, onFiltersChange, safraOptions }: CustomerFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleUfChange = (value: string) => {
    onFiltersChange({ ...filters, uf: value === 'all' ? '' : value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value as Filters['status']
    });
  };

  const handleSafraChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      safra: value === 'all' ? '' : value
    });
  };

  const clearFilters = () => {
    onFiltersChange({ search: '', uf: '', status: 'all', safra: '' });
  };

  const hasFilters = filters.search || filters.uf || filters.status !== 'all' || filters.safra;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF/CNPJ, email ou telefone..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={filters.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-44">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Contrato Ativo</SelectItem>
          <SelectItem value="pending">Fatura Pendente</SelectItem>
          <SelectItem value="overdue">Fatura Vencida</SelectItem>
          <SelectItem value="no_contract">Sem Contrato</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.safra || 'all'} onValueChange={handleSafraChange}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Safra" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Safras</SelectItem>
          {safraOptions.map((safra) => (
            <SelectItem key={safra} value={safra}>
              {safra}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.uf || 'all'} onValueChange={handleUfChange}>
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue placeholder="UF" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos UF</SelectItem>
          {UF_LIST.map((uf) => (
            <SelectItem key={uf} value={uf}>
              {uf}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
