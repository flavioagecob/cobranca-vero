import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  Building2,
  User,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCustomerDetail } from '@/hooks/useCustomers';
import { 
  formatCpfCnpj, 
  formatPhone, 
  formatDate, 
  formatCurrency,
  getStatusColor 
} from '@/lib/formatters';
import { toast } from 'sonner';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customer, isLoading, error } = useCustomerDetail(id);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-destructive font-medium">
                {error || 'Cliente não encontrado'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/customers')}
              >
                Voltar para lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const whatsappLink = customer.telefone
    ? `https://wa.me/55${customer.telefone.replace(/\D/g, '')}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{customer.nome}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-sm">{formatCpfCnpj(customer.cpf_cnpj)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(customer.cpf_cnpj, 'CPF/CNPJ')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {whatsappLink && (
            <Button variant="outline" size="sm" asChild>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
          <Button size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Iniciar Cobrança
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contact Info */}
            <div className="space-y-3">
              {customer.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{formatPhone(customer.telefone)}</p>
                    <p className="text-xs text-muted-foreground">Telefone principal</p>
                  </div>
                </div>
              )}
              {customer.telefone2 && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{formatPhone(customer.telefone2)}</p>
                    <p className="text-xs text-muted-foreground">Telefone secundário</p>
                  </div>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium break-all">{customer.email}</p>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {customer.endereco && (
                    <p className="text-sm font-medium">{customer.endereco}</p>
                  )}
                  {(customer.cidade || customer.uf) && (
                    <p className="text-sm text-muted-foreground">
                      {customer.cidade}{customer.cidade && customer.uf && ' - '}{customer.uf}
                    </p>
                  )}
                  {customer.cep && (
                    <p className="text-sm text-muted-foreground">CEP: {customer.cep}</p>
                  )}
                  {!customer.endereco && !customer.cidade && !customer.uf && (
                    <p className="text-sm text-muted-foreground">Endereço não informado</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{formatDate(customer.created_at)}</p>
                  <p className="text-xs text-muted-foreground">Cadastrado em</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Sales and Contracts */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="sales" className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Histórico</CardTitle>
                <TabsList>
                  <TabsTrigger value="sales" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Vendas ({customer.total_sales || 0})
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Contratos ({customer.total_contracts || 0})
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="sales" className="mt-0">
                {customer.sales_base && customer.sales_base.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>OS</TableHead>
                          <TableHead>Produto/Plano</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Data Venda</TableHead>
                          <TableHead>Vendedor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.sales_base.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-mono text-sm font-medium">
                              {sale.os}
                            </TableCell>
                            <TableCell>
                              <div>
                                {sale.produto && (
                                  <p className="font-medium">{sale.produto}</p>
                                )}
                                {sale.plano && (
                                  <p className="text-sm text-muted-foreground">{sale.plano}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(sale.valor_plano)}</TableCell>
                            <TableCell>{formatDate(sale.data_venda)}</TableCell>
                            <TableCell>{sale.vendedor || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma venda registrada
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contracts" className="mt-0">
                {customer.operator_contracts && customer.operator_contracts.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Contrato</TableHead>
                          <TableHead>Nº Fatura</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Valor Fatura</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Pagamento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.operator_contracts.map((contract) => {
                          const isOverdue = contract.data_vencimento && 
                            new Date(contract.data_vencimento) < new Date() &&
                            !contract.data_pagamento;
                          const isPaid = !!contract.data_pagamento;
                          
                          return (
                            <TableRow 
                              key={contract.id}
                              className={isOverdue ? 'bg-destructive/5' : isPaid ? 'bg-emerald-500/5' : undefined}
                            >
                              <TableCell className="font-mono text-sm font-medium">
                                {contract.id_contrato}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {contract.numero_fatura || '-'}
                              </TableCell>
                              <TableCell>
                                {isPaid ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    PAGO
                                  </Badge>
                                ) : isOverdue ? (
                                  <Badge variant="destructive">
                                    VENCIDO
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                    PENDENTE
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className={isOverdue ? 'font-medium text-destructive' : ''}>
                                {formatCurrency(contract.valor_fatura || contract.valor_contrato)}
                              </TableCell>
                              <TableCell className={isOverdue ? 'font-medium text-destructive' : ''}>
                                {formatDate(contract.data_vencimento)}
                              </TableCell>
                              <TableCell>
                                {contract.data_pagamento ? (
                                  <span className="text-emerald-600 font-medium">
                                    {formatDate(contract.data_pagamento)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum contrato registrado
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Faturas Summary and Collection History */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo de Faturas</CardTitle>
            <CardDescription>Visão geral das faturas do cliente</CardDescription>
          </CardHeader>
          <CardContent>
            {customer.operator_contracts && customer.operator_contracts.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  const contracts = customer.operator_contracts;
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  
                  const pendingContracts = contracts.filter(c => !c.data_pagamento);
                  const overdueContracts = pendingContracts.filter(c => {
                    if (!c.data_vencimento) return false;
                    const match = c.data_vencimento.match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (!match) return false;
                    const dueDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                    return dueDate < now;
                  });
                  const paidContracts = contracts.filter(c => c.data_pagamento);
                  
                  const totalPending = pendingContracts.reduce((sum, c) => sum + (c.valor_fatura || 0), 0);
                  const totalOverdue = overdueContracts.reduce((sum, c) => sum + (c.valor_fatura || 0), 0);
                  
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold text-destructive">{overdueContracts.length}</p>
                          <p className="text-xs text-muted-foreground">Vencidas</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold text-amber-600">{pendingContracts.length - overdueContracts.length}</p>
                          <p className="text-xs text-muted-foreground">A vencer</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total vencido:</span>
                          <span className="font-medium text-destructive">{formatCurrency(totalOverdue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total pendente:</span>
                          <span className="font-medium">{formatCurrency(totalPending)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Faturas pagas:</span>
                          <span className="font-medium text-emerald-600">{paidContracts.length}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma fatura registrada
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Cobrança</CardTitle>
            <CardDescription>Tentativas e promessas de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma tentativa de cobrança registrada</p>
              <Button variant="outline" size="sm" className="mt-4">
                <Phone className="h-4 w-4 mr-2" />
                Registrar Contato
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
