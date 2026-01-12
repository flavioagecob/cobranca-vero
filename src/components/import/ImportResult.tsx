import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ImportResult as ImportResultType } from '@/types/import';

interface ImportResultProps {
  result: ImportResultType;
  onNewImport: () => void;
  onViewData: () => void;
}

export const ImportResult = ({
  result,
  onNewImport,
  onViewData,
}: ImportResultProps) => {
  const isSuccess = result.errorCount === 0;
  const isPartial = result.successCount > 0 && result.errorCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-8">
        {isSuccess ? (
          <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
        ) : isPartial ? (
          <AlertTriangle className="h-16 w-16 text-yellow-600 mb-4" />
        ) : (
          <XCircle className="h-16 w-16 text-destructive mb-4" />
        )}

        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isSuccess
            ? 'Importação Concluída!'
            : isPartial
            ? 'Importação Parcial'
            : 'Falha na Importação'}
        </h2>

        <p className="text-muted-foreground text-center max-w-md">
          {isSuccess
            ? `${result.successCount} registros importados com sucesso.`
            : isPartial
            ? `${result.successCount} registros importados, ${result.errorCount} com erro.`
            : 'Nenhum registro foi importado.'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Processado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {result.totalProcessed}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {result.successCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {result.errorCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {result.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Erros Encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Linha</TableHead>
                    <TableHead className="w-32">Campo</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell>{error.field || '-'}</TableCell>
                      <TableCell className="text-destructive">
                        {error.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onNewImport}>
          Nova Importação
        </Button>
        <Button onClick={onViewData}>Ver Dados Importados</Button>
      </div>
    </div>
  );
};
