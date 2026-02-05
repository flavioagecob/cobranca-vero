import { CalendarClock } from 'lucide-react';
import { usePreventiveCollection } from '@/hooks/usePreventiveCollection';
import { PreventiveStatsCards } from '@/components/preventive/PreventiveStatsCards';
import { PreventiveFilters } from '@/components/preventive/PreventiveFilters';
import { PreventiveQueue } from '@/components/preventive/PreventiveQueue';

export default function PreventiveCollection() {
  const {
    leads,
    stats,
    safras,
    isLoading,
    filters,
    setFilters,
    markAsCobrado,
  } = usePreventiveCollection();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-amber-500" />
          <h1 className="text-xl font-semibold">Cobrança Preventiva</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Fila de clientes com faturas a vencer nos próximos 15 dias
        </p>
      </div>

      {/* Stats */}
      <PreventiveStatsCards stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <PreventiveFilters
        filters={filters}
        safras={safras}
        onFiltersChange={setFilters}
      />

      {/* Queue */}
      <PreventiveQueue
        leads={leads}
        isLoading={isLoading}
        filters={filters}
        onMarkAsCobrado={markAsCobrado}
      />
    </div>
  );
}
