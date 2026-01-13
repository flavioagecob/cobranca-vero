import { Link } from 'react-router-dom';
import { Eye, Phone, Mail } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCpfCnpj, formatPhone } from '@/lib/formatters';
import type { Customer } from '@/types/customer';

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
}

export function CustomerTable({ customers, isLoading }: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente ajustar os filtros ou importe novos clientes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF/CNPJ</TableHead>
            <TableHead className="hidden md:table-cell">Contato</TableHead>
            <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="font-medium">{customer.nome}</div>
                {customer.email && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" />
                    {customer.email}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatCpfCnpj(customer.cpf_cnpj)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {customer.telefone && (
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {formatPhone(customer.telefone)}
                  </div>
                )}
                {customer.telefone2 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {formatPhone(customer.telefone2)}
                  </div>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {customer.cidade && customer.uf ? (
                  <span>{customer.cidade}/{customer.uf}</span>
                ) : customer.uf ? (
                  <span>{customer.uf}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/customers/${customer.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
