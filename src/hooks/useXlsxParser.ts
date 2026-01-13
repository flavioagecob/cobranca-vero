import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { ImportPreview, ParsedRow } from '@/types/import';

interface UseXlsxParserReturn {
  isLoading: boolean;
  error: string | null;
  parseFile: (file: File, fullData?: boolean) => Promise<ImportPreview | null>;
  reset: () => void;
}

export const useXlsxParser = (): UseXlsxParserReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File, fullData: boolean = false): Promise<ImportPreview | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      // Use raw: true to preserve original numeric values without formatting
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Planilha vazia ou sem abas');
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        raw: true, // Keep raw values to preserve large numbers
        defval: '',
      });

      if (jsonData.length < 2) {
        throw new Error('Planilha deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
      }

      // First row is headers - preserve column positions and handle duplicates
      const rawHeaders = jsonData[0] as unknown[];
      const seenHeaders = new Map<string, number>();
      const headers: string[] = [];
      
      for (let i = 0; i < rawHeaders.length; i++) {
        let header = String(rawHeaders[i] || '').trim();
        
        // Generate placeholder for empty headers to preserve column alignment
        if (!header) {
          header = `__col_${i}`;
        }
        
        // Handle duplicate headers by adding suffix
        if (seenHeaders.has(header)) {
          const count = seenHeaders.get(header)! + 1;
          seenHeaders.set(header, count);
          header = `${header}__${count}`;
        } else {
          seenHeaders.set(header, 1);
        }
        
        headers.push(header);
      }

      // Check if we have any real headers (not just placeholders)
      const realHeaders = headers.filter(h => !h.startsWith('__col_'));
      if (realHeaders.length === 0) {
        throw new Error('Nenhum cabeçalho encontrado na primeira linha');
      }

      // Helper to safely convert cell value preserving large numbers
      const formatCellValue = (value: unknown): string | null => {
        if (value === undefined || value === null || value === '') return null;
        
        // Handle numbers - convert to string without scientific notation
        if (typeof value === 'number') {
          if (!isFinite(value)) return null;
          // Para números grandes (provavelmente IDs/contratos), arredonda para evitar precisão de float
          if (Math.abs(value) >= 1000000) {
            return Math.round(value).toString();
          }
          // Check if it's an integer
          if (Number.isInteger(value)) {
            return String(value);
          }
          // For floats, use toFixed to avoid scientific notation
          return value.toFixed(10).replace(/\.?0+$/, '');
        }
        
        // Handle strings that might be scientific notation
        const strValue = String(value).trim();
        if (/^[\d.]+[eE][+-]?\d+$/.test(strValue)) {
          const num = parseFloat(strValue);
          if (!isNaN(num) && isFinite(num)) {
            return Math.round(num).toString();
          }
        }
        
        return strValue;
      };

      // Log de debug para verificar parsing
      console.log('[XLSX Parser] Primeira linha raw (antes de formatar):', jsonData[1]);

      // Parse data rows
      const rows: ParsedRow[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i] as unknown[];
        if (!rowData || rowData.every((cell) => cell === '' || cell === null || cell === undefined)) {
          continue; // Skip empty rows
        }

        const row: ParsedRow = {};
        headers.forEach((header, index) => {
          row[header] = formatCellValue(rowData[index]);
        });
        rows.push(row);
      }

      if (rows.length === 0) {
        throw new Error('Nenhum dado encontrado na planilha');
      }

      return {
        headers,
        rows: fullData ? rows : rows.slice(0, 100), // Full data or preview (100 rows)
        totalRows: rows.length,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar arquivo';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    parseFile,
    reset,
  };
};
