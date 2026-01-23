import { useCustomers } from '@/hooks/useCustomers';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerPagination } from '@/components/customers/CustomerPagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, FileX, AlertTriangle, Download, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Customers() {
  const {
    customers,
    isLoading,
    error,
    pagination,
    filters,
    safraOptions,
    statusContratoOptions,
    stats,
    sortState,
    setFilters,
    setPage,
    toggleSort,
  } = useCustomers(20);

  const handleCardClick = (status: typeof filters.status) => {
    setFilters({ ...filters, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie e visualize todos os clientes cadastrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" asChild>
            <Link to="/import">
              <UserPlus className="h-4 w-4 mr-2" />
              Importar
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            filters.status === 'all' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => handleCardClick('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-emerald-500/30 ${
            filters.status === 'paid' ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => handleCardClick('paid')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Em Dia</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              sem faturas pendentes
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-muted-foreground/30 ${
            filters.status === 'no_contract' ? 'ring-2 ring-muted-foreground' : ''
          }`}
          onClick={() => handleCardClick('no_contract')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sem Contrato</CardTitle>
            <FileX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.noContract}</div>
            <p className="text-xs text-muted-foreground">
              sem dados de fatura
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md border-destructive/30 ${
            filters.status === 'overdue' ? 'ring-2 ring-destructive' : ''
          }`}
          onClick={() => handleCardClick('overdue')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              faturas vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <CustomerFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        safraOptions={safraOptions}
        statusContratoOptions={statusContratoOptions}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <CustomerTable 
        customers={customers} 
        isLoading={isLoading} 
        sortState={sortState}
        onSort={toggleSort}
      />

      {/* Pagination */}
      <CustomerPagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
