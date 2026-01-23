import { Search, X, Filter, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CustomerFilters as Filters } from '@/types/customer';

interface CustomerFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  safraOptions: string[];
  statusContratoOptions: string[];
  parcelaOptions: string[];
}

export function CustomerFilters({ 
  filters, 
  onFiltersChange, 
  safraOptions,
  statusContratoOptions,
  parcelaOptions
}: CustomerFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleParcelaChange = (value: string) => {
    onFiltersChange({ ...filters, parcela: value === 'all' ? '' : value });
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

  const handleStatusContratoChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      statusContrato: value === 'all' ? '' : value
    });
  };

  const clearFilters = () => {
    onFiltersChange({ search: '', parcela: '', status: 'all', safra: '', statusContrato: '' });
  };

  const hasFilters = filters.search || filters.parcela || filters.status !== 'all' || filters.safra || filters.statusContrato;

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF/CNPJ, email ou telefone..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={filters.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-40">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Situação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas Situações</SelectItem>
          <SelectItem value="paid">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Em Dia
            </span>
          </SelectItem>
          <SelectItem value="overdue">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Em Atraso
            </span>
          </SelectItem>
          <SelectItem value="no_contract">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              Sem Contrato
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {parcelaOptions.length > 0 && (
        <Select value={filters.parcela || 'all'} onValueChange={handleParcelaChange}>
          <SelectTrigger className="w-full sm:w-48">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Parcela Vencida" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Parcelas</SelectItem>
            {parcelaOptions.map((parcela) => (
              <SelectItem key={parcela} value={parcela}>
                {parcela}ª Parcela Vencida
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {statusContratoOptions.length > 0 && (
        <Select value={filters.statusContrato || 'all'} onValueChange={handleStatusContratoChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status Contrato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {statusContratoOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={filters.safra || 'all'} onValueChange={handleSafraChange}>
        <SelectTrigger className="w-full sm:w-36">
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

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
