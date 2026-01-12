import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { ParsedRow } from '@/types/import';

interface DataPreviewProps {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  highlightedColumns?: string[];
}

export const DataPreview = ({
  headers,
  rows,
  totalRows,
  highlightedColumns = [],
}: DataPreviewProps) => {
  const displayRows = rows.slice(0, 10);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Prévia dos Dados
        </h3>
        <span className="text-sm text-muted-foreground">
          Mostrando {displayRows.length} de {totalRows} registros
        </span>
      </div>

      <ScrollArea className="w-full border rounded-lg">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                {headers.map((header) => (
                  <TableHead
                    key={header}
                    className={
                      highlightedColumns.includes(header)
                        ? 'bg-primary/10 font-semibold'
                        : ''
                    }
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  {headers.map((header) => (
                    <TableCell
                      key={header}
                      className={
                        highlightedColumns.includes(header)
                          ? 'bg-primary/5'
                          : ''
                      }
                    >
                      <span className="max-w-[200px] truncate block">
                        {String(row[header] ?? '-')}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {totalRows > 10 && (
        <p className="text-sm text-muted-foreground text-center">
          ... e mais {totalRows - 10} registros
        </p>
      )}
    </div>
  );
};
