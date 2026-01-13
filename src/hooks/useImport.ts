import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ImportType, 
  ColumnMapping, 
  ParsedRow, 
  ImportResult, 
  ImportError 
} from '@/types/import';

interface UseImportReturn {
  isImporting: boolean;
  progress: number;
  executeImport: (
    type: ImportType,
    rows: ParsedRow[],
    mappings: ColumnMapping[],
    fileName: string
  ) => Promise<ImportResult>;
}

// Helper to format CPF/CNPJ
const formatCpfCnpj = (value: string | null): string | null => {
  if (!value) return null;
  return value.replace(/\D/g, '');
};

// Helper to parse date
const parseDate = (value: string | null): string | null => {
  if (!value) return null;
  
  // Try different date formats
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = value.match(format);
    if (match) {
      if (format === formats[0]) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      } else if (format === formats[1]) {
        return value;
      } else if (format === formats[2]) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
  }
  
  // Try native Date parsing
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
};

// Helper to parse currency - handles Brazilian format and cents
const parseCurrency = (value: string | null): number | null => {
  if (!value) return null;
  
  let cleaned = value.toString().replace(/[R$\s]/g, '').trim();
  
  // If it's a pure integer without decimal separators and > 100, assume it's in cents
  // e.g., "2532" → 25.32 (common in spreadsheets that strip decimal separators)
  if (/^\d+$/.test(cleaned) && parseInt(cleaned, 10) > 100) {
    return parseInt(cleaned, 10) / 100;
  }
  
  // Brazilian format: 1.234,56 → remove thousand separator, replace decimal
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export const useImport = (): UseImportReturn => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const executeImport = useCallback(async (
    type: ImportType,
    rows: ParsedRow[],
    mappings: ColumnMapping[],
    fileName: string
  ): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress(0);

    const errors: ImportError[] = [];
    let successCount = 0;
    let batchId: string | null = null;

    try {
      // Create import batch
      const { data: batch, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          tipo: type,
          arquivo_nome: fileName,
          total_registros: rows.length,
        })
        .select()
        .single();

      if (batchError) throw batchError;
      batchId = batch.id;

      // Create mapping lookup
      const fieldMap: Record<string, string> = {};
      mappings.forEach((m) => {
        if (m.sourceColumn) {
          fieldMap[m.targetField] = m.sourceColumn;
        }
      });

      // Process rows in batches of 50
      const batchSize = 50;
      const totalBatches = Math.ceil(rows.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const batchRows = rows.slice(i * batchSize, (i + 1) * batchSize);
        
        for (let j = 0; j < batchRows.length; j++) {
          const row = batchRows[j];
          const rowIndex = i * batchSize + j + 2; // +2 for header and 1-indexed

          try {
            // Extract mapped values
            const getValue = (field: string): string | null => {
              const sourceCol = fieldMap[field];
              return sourceCol ? (row[sourceCol] as string) || null : null;
            };

            // Para tipo 'sales', precisa criar/atualizar customer
            // Para tipo 'operator', apenas faz match com sales_base existente
            let customer: { id: string } | null = null;

            if (type === 'sales') {
              const cpfCnpj = formatCpfCnpj(getValue('cpf_cnpj'));
              const nome = getValue('nome');

              if (!cpfCnpj) {
                errors.push({ row: rowIndex, field: 'cpf_cnpj', message: 'CPF/CNPJ obrigatório' });
                continue;
              }

              if (!nome) {
                errors.push({ row: rowIndex, field: 'nome', message: 'Nome obrigatório' });
                continue;
              }

              // Upsert customer
              const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .upsert({
                  cpf_cnpj: cpfCnpj,
                  nome,
                  email: getValue('email'),
                  telefone: getValue('telefone'),
                  telefone2: getValue('telefone2'),
                  endereco: getValue('endereco'),
                  cidade: getValue('cidade'),
                  uf: getValue('uf'),
                  cep: getValue('cep'),
                }, { onConflict: 'cpf_cnpj' })
                .select()
                .single();

              if (customerError) {
                errors.push({ row: rowIndex, message: customerError.message });
                continue;
              }
              
              customer = customerData;
            }

            // Insert type-specific record
            if (type === 'sales') {
              const os = getValue('os');
              if (!os) {
                errors.push({ row: rowIndex, field: 'os', message: 'OS obrigatória' });
                continue;
              }

              const { error: salesError } = await supabase
                .from('sales_base')
                .insert({
                  customer_id: customer.id,
                  os: os.replace(/\D/g, ''), // Normaliza para apenas números
                  produto: getValue('produto'),
                  plano: getValue('plano'),
                  valor_plano: parseCurrency(getValue('valor_plano')),
                  data_venda: parseDate(getValue('data_venda')),
                  vendedor: getValue('vendedor'),
                  import_batch_id: batchId,
                  raw_data: row,
                });

              if (salesError) {
                errors.push({ row: rowIndex, message: salesError.message });
                continue;
              }
              
              successCount++;
            } else {
              // Tipo 'operator' - faz match pelo id_contrato com sales_base.os
              const idContratoRaw = getValue('id_contrato');
              if (!idContratoRaw) {
                errors.push({ row: rowIndex, field: 'id_contrato', message: 'ID Contrato obrigatório' });
                continue;
              }

              // Normaliza para apenas números (match com OS)
              let idContrato = idContratoRaw.replace(/\D/g, '');
              
              // Se parece notação científica, converte
              if (/^[\d.]+[eE][+-]?\d+$/.test(idContratoRaw.trim())) {
                const num = parseFloat(idContratoRaw);
                if (!isNaN(num) && isFinite(num)) {
                  idContrato = Math.round(num).toString();
                }
              }

              // Log das primeiras linhas para debug
              if (rowIndex <= 7) {
                console.log(`[Operadora] Linha ${rowIndex}: CONTRATO raw="${idContratoRaw}" → normalizado="${idContrato}"`);
              }

              // Estratégia 1: Match exato
              let salesRecord: { id: string; customer_id: string; os: string } | null = null;
              
              const { data: exactMatch, error: exactError } = await supabase
                .from('sales_base')
                .select('id, customer_id, os')
                .eq('os', idContrato)
                .maybeSingle();

              if (exactError) {
                errors.push({ row: rowIndex, message: exactError.message });
                continue;
              }

              if (exactMatch) {
                salesRecord = exactMatch;
              } else {
                // Estratégia 2: Match por sufixo (últimos 7 dígitos)
                const suffix = idContrato.slice(-7);
                const { data: suffixMatches, error: suffixError } = await supabase
                  .from('sales_base')
                  .select('id, customer_id, os')
                  .like('os', `%${suffix}`);

                if (suffixError) {
                  errors.push({ row: rowIndex, message: suffixError.message });
                  continue;
                }

                if (suffixMatches && suffixMatches.length === 1) {
                  salesRecord = suffixMatches[0];
                  console.log(`[Operadora] Match por sufixo: CONTRATO ${idContrato} → OS ${salesRecord.os}`);
                } else if (suffixMatches && suffixMatches.length > 1) {
                  // Estratégia 3: Match por sufixo maior (últimos 8 dígitos)
                  const longerSuffix = idContrato.slice(-8);
                  const filtered = suffixMatches.filter(s => s.os.endsWith(longerSuffix));
                  if (filtered.length === 1) {
                    salesRecord = filtered[0];
                    console.log(`[Operadora] Match por sufixo longo: CONTRATO ${idContrato} → OS ${salesRecord.os}`);
                  }
                }
              }

              if (!salesRecord) {
                // Log diagnóstico para primeiros erros
                if (errors.length < 10) {
                  // Busca exemplos de OS existentes para diagnóstico
                  const { data: sampleOS } = await supabase
                    .from('sales_base')
                    .select('os')
                    .not('os', 'is', null)
                    .limit(3);
                  
                  console.warn(`[Operadora] Linha ${rowIndex}: Não encontrou match para CONTRATO="${idContrato}" (raw="${idContratoRaw}"). Exemplos de OS na base:`, sampleOS?.map(s => s.os));
                }
                
                errors.push({ 
                  row: rowIndex, 
                  field: 'id_contrato', 
                  message: `Contrato ${idContrato} não encontrado na base de vendas` 
                });
                continue;
              }

              // Usa o customer_id encontrado na sales_base
              const { error: operatorError } = await supabase
                .from('operator_contracts')
                .upsert({
                  customer_id: salesRecord.customer_id,
                  sales_base_id: salesRecord.id,
                  id_contrato: idContrato,
                  numero_fatura: getValue('numero_fatura'),
                  status_contrato: getValue('status_contrato'),
                  data_cadastro: parseDate(getValue('data_cadastro')),
                  mes_safra_cadastro: getValue('mes_safra_cadastro'),
                  mes_safra_vencimento: getValue('mes_safra_vencimento'),
                  data_vencimento: parseDate(getValue('data_vencimento')),
                  data_pagamento: parseDate(getValue('data_pagamento')),
                  valor_fatura: parseCurrency(getValue('valor_fatura')),
                  import_batch_id: batchId,
                  raw_data: row,
                }, { onConflict: 'id_contrato' });

              if (operatorError) {
                errors.push({ row: rowIndex, message: operatorError.message });
                continue;
              }
              
              successCount++;
            }
          } catch (err) {
            errors.push({
              row: rowIndex,
              message: err instanceof Error ? err.message : 'Erro desconhecido',
            });
          }
        }

        setProgress(Math.round(((i + 1) / totalBatches) * 100));
      }

      // Update batch with results
      await supabase
        .from('import_batches')
        .update({
          registros_sucesso: successCount,
          registros_erro: errors.length,
        })
        .eq('id', batchId);

      return {
        success: errors.length === 0,
        totalProcessed: rows.length,
        successCount,
        errorCount: errors.length,
        errors: errors.slice(0, 50), // Limit errors shown
        batchId,
      };
    } catch (err) {
      return {
        success: false,
        totalProcessed: 0,
        successCount: 0,
        errorCount: rows.length,
        errors: [{
          row: 0,
          message: err instanceof Error ? err.message : 'Erro ao importar',
        }],
        batchId,
      };
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  }, []);

  return {
    isImporting,
    progress,
    executeImport,
  };
};
