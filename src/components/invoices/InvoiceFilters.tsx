import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InvoiceFilters as Filters } from '@/types/invoice';

interface InvoiceFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  safraOptions: string[];
  parcelaOptions: string[];
}

export function InvoiceFilters({ filters, onFiltersChange, safraOptions, parcelaOptions }: InvoiceFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value as Filters['status']
    });
  };

  const handleOverdueChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      overdueRange: value as Filters['overdueRange']
    });
  };

  const handleSafraChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      safra: value
    });
  };

  const handleParcelaChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      parcela: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({ 
      search: '', 
      status: 'all', 
      overdueRange: 'all',
      safra: 'all',
      parcela: 'all'
    });
  };

  const hasFilters = filters.search || filters.status !== 'all' || filters.overdueRange !== 'all' || filters.safra !== 'all' || filters.parcela !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº fatura, cliente ou CPF/CNPJ..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>

        {/* Overdue Range */}
        <Select value={filters.overdueRange} onValueChange={handleOverdueChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Dias Atraso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Dias Atraso: Todos</SelectItem>
            <SelectItem value="1-15">1-15 dias</SelectItem>
            <SelectItem value="16-30">16-30 dias</SelectItem>
            <SelectItem value="31-60">31-60 dias</SelectItem>
            <SelectItem value="60+">60+ dias</SelectItem>
          </SelectContent>
        </Select>

        {/* Safra Filter */}
        <Select value={filters.safra} onValueChange={handleSafraChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Safra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Safra: Todas</SelectItem>
            {safraOptions.map((safra) => (
              <SelectItem key={safra} value={safra}>
                {safra}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Parcela Filter */}
        {parcelaOptions.length > 0 && (
          <Select value={filters.parcela} onValueChange={handleParcelaChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Parcela" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Parcela: Todas</SelectItem>
              {parcelaOptions.map((parcela) => (
                <SelectItem key={parcela} value={parcela}>
                  {parcela}ª Parcela
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Button */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
