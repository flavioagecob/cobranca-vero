import { useCustomers } from '@/hooks/useCustomers';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerPagination } from '@/components/customers/CustomerPagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Download } from 'lucide-react';
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
    setFilters,
    setPage,
  } = useCustomers(20);

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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              clientes cadastrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtro Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              clientes nesta página
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Páginas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagination.page} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
            </div>
            <p className="text-xs text-muted-foreground">
              {pagination.pageSize} por página
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <CustomerFilters filters={filters} onFiltersChange={setFilters} safraOptions={safraOptions} />

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <CustomerTable customers={customers} isLoading={isLoading} />

      {/* Pagination */}
      <CustomerPagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
