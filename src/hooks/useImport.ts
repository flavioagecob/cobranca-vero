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
  
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
};

// Helper to parse currency
const parseCurrency = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  let cleaned = value.toString().replace(/[R$\s]/g, '').trim();
  if (!cleaned) return null;
  
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Types for lookup caches
interface SalesRecord {
  id: string;
  customer_id: string | null;
  os: string;
}

interface ExistingContract {
  id: string;
  id_contrato: string;
  numero_fatura: string | null;
}

// Build sales lookup caches for O(1) lookups
const buildSalesLookupCache = (salesRecords: SalesRecord[]) => {
  const byExactOS = new Map<string, SalesRecord>();
  const bySuffix7 = new Map<string, SalesRecord[]>();
  const bySuffix8 = new Map<string, SalesRecord[]>();

  for (const record of salesRecords) {
    const os = record.os;
    
    // Exact match map
    byExactOS.set(os, record);
    
    // Suffix-7 map
    if (os.length >= 7) {
      const suffix7 = os.slice(-7);
      if (!bySuffix7.has(suffix7)) {
        bySuffix7.set(suffix7, []);
      }
      bySuffix7.get(suffix7)!.push(record);
    }
    
    // Suffix-8 map
    if (os.length >= 8) {
      const suffix8 = os.slice(-8);
      if (!bySuffix8.has(suffix8)) {
        bySuffix8.set(suffix8, []);
      }
      bySuffix8.get(suffix8)!.push(record);
    }
  }

  return { byExactOS, bySuffix7, bySuffix8 };
};

// Find sales record using cache with fallback strategies
const findSalesRecordFromCache = (
  idContrato: string,
  cache: ReturnType<typeof buildSalesLookupCache>
): SalesRecord | null => {
  // Strategy 1: Exact match
  const exactMatch = cache.byExactOS.get(idContrato);
  if (exactMatch) return exactMatch;

  // Strategy 2: Suffix-7 match
  if (idContrato.length >= 7) {
    const suffix7 = idContrato.slice(-7);
    const matches7 = cache.bySuffix7.get(suffix7);
    if (matches7?.length === 1) {
      return matches7[0];
    }
    
    // Strategy 3: If multiple suffix-7 matches, try suffix-8
    if (matches7 && matches7.length > 1 && idContrato.length >= 8) {
      const suffix8 = idContrato.slice(-8);
      const matches8 = cache.bySuffix8.get(suffix8);
      if (matches8?.length === 1) {
        return matches8[0];
      }
    }
  }

  return null;
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

      // Helper functions for value extraction
      const getValue = (row: ParsedRow, field: string): string | number | null => {
        const sourceCol = fieldMap[field];
        if (!sourceCol) return null;
        const val = row[sourceCol];
        if (val === null || val === undefined || val === '') return null;
        return val as string | number;
      };
      
      const getStringValue = (row: ParsedRow, field: string): string | null => {
        const val = getValue(row, field);
        if (val === null) return null;
        return String(val);
      };

      if (type === 'sales') {
        // ===== OPTIMIZED SALES IMPORT =====
        await importSalesOptimized(rows, fieldMap, batchId, errors, (count) => {
          successCount = count;
        }, setProgress);
      } else {
        // ===== OPTIMIZED OPERATOR IMPORT =====
        setProgress(5); // Loading caches...
        
        // STEP 1: Load all sales_base records into memory (usually < 1000 records)
        const { data: allSales, error: salesError } = await supabase
          .from('sales_base')
          .select('id, customer_id, os');

        if (salesError) throw salesError;
        
        const salesCache = buildSalesLookupCache(allSales || []);
        console.log(`[Import] Loaded ${allSales?.length || 0} sales records into cache`);

        setProgress(10); // Caches loaded

        // STEP 2: Load existing operator_contracts for upsert decisions
        const { data: existingContracts, error: contractsError } = await supabase
          .from('operator_contracts')
          .select('id, id_contrato, numero_fatura');

        if (contractsError) throw contractsError;

        const existingContractsMap = new Map<string, string>();
        for (const contract of existingContracts || []) {
          const key = `${contract.id_contrato}|${contract.numero_fatura || ''}`;
          existingContractsMap.set(key, contract.id);
        }
        console.log(`[Import] Loaded ${existingContracts?.length || 0} existing contracts into cache`);

        // STEP 3: Process rows and build upsert batches
        const BATCH_SIZE = 300;
        const toInsert: any[] = [];
        const toUpdate: { id: string; data: any }[] = [];
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowIndex = i + 2; // +2 for header and 1-indexed

          try {
            const idContratoRaw = getStringValue(row, 'id_contrato');
            if (!idContratoRaw) {
              errors.push({ row: rowIndex, field: 'id_contrato', message: 'ID Contrato obrigatório' });
              continue;
            }

            // Normalize id_contrato
            let idContrato = idContratoRaw.replace(/\D/g, '');
            if (/^[\d.]+[eE][+-]?\d+$/.test(idContratoRaw.trim())) {
              const num = parseFloat(idContratoRaw);
              if (!isNaN(num) && isFinite(num)) {
                idContrato = Math.round(num).toString();
              }
            }

            // Find sales record using cache (O(1) lookup)
            const salesRecord = findSalesRecordFromCache(idContrato, salesCache);
            
            if (!salesRecord) {
              errors.push({ 
                row: rowIndex, 
                field: 'id_contrato', 
                message: `Contrato ${idContrato} não encontrado na base de vendas` 
              });
              continue;
            }

            // Get and validate numero_fatura
            const numeroFaturaRaw = getValue(row, 'numero_fatura');
            let numeroFatura = (numeroFaturaRaw || '').toString().trim();
            if (!/^\d+$/.test(numeroFatura)) {
              numeroFatura = numeroFatura.replace(/\D/g, '') || '';
            }
            
            if (!numeroFatura) {
              errors.push({ 
                row: rowIndex, 
                field: 'numero_fatura', 
                message: 'Número da fatura obrigatório' 
              });
              continue;
            }

            // Build contract data
            const contractData = {
              customer_id: salesRecord.customer_id,
              sales_base_id: salesRecord.id,
              id_contrato: idContrato,
              numero_fatura: numeroFatura,
              status_contrato: getStringValue(row, 'status_contrato'),
              data_cadastro: parseDate(getStringValue(row, 'data_cadastro')),
              mes_safra_cadastro: getStringValue(row, 'mes_safra_cadastro'),
              mes_safra_vencimento: getStringValue(row, 'mes_safra_vencimento'),
              data_vencimento: parseDate(getStringValue(row, 'data_vencimento')),
              data_pagamento: parseDate(getStringValue(row, 'data_pagamento')),
              valor_fatura: parseCurrency(getValue(row, 'valor_fatura')),
              import_batch_id: batchId,
              raw_data: row,
            };

            // Check if exists using cache
            const existingKey = `${idContrato}|${numeroFatura}`;
            const existingId = existingContractsMap.get(existingKey);

            if (existingId) {
              toUpdate.push({ id: existingId, data: contractData });
            } else {
              toInsert.push(contractData);
              // Add to cache to handle duplicates within same import
              existingContractsMap.set(existingKey, 'pending');
            }
          } catch (err) {
            errors.push({
              row: rowIndex,
              message: err instanceof Error ? err.message : 'Erro desconhecido',
            });
          }
        }

        setProgress(30); // Records prepared

        // STEP 4: Execute bulk insert
        if (toInsert.length > 0) {
          const insertBatches = Math.ceil(toInsert.length / BATCH_SIZE);
          for (let i = 0; i < insertBatches; i++) {
            const batchData = toInsert.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            
            const { error: insertError } = await supabase
              .from('operator_contracts')
              .insert(batchData);

            if (insertError) {
              console.error(`[Import] Bulk insert error batch ${i + 1}:`, insertError.message);
              // Count as errors but continue
              errors.push({ row: 0, message: `Erro no batch ${i + 1}: ${insertError.message}` });
            } else {
              successCount += batchData.length;
            }

            const insertProgress = 30 + Math.round((i + 1) / insertBatches * 30);
            setProgress(insertProgress);
          }
        }

        console.log(`[Import] Inserted ${successCount} new contracts`);

        // STEP 5: Execute bulk updates (in smaller batches to avoid timeout)
        if (toUpdate.length > 0) {
          const UPDATE_BATCH_SIZE = 100;
          const updateBatches = Math.ceil(toUpdate.length / UPDATE_BATCH_SIZE);
          
          for (let i = 0; i < updateBatches; i++) {
            const batchUpdates = toUpdate.slice(i * UPDATE_BATCH_SIZE, (i + 1) * UPDATE_BATCH_SIZE);
            
            // Use Promise.all for parallel updates within batch
            const updatePromises = batchUpdates.map(({ id, data }) =>
              supabase
                .from('operator_contracts')
                .update(data)
                .eq('id', id)
            );

            const results = await Promise.all(updatePromises);
            
            let batchSuccessCount = 0;
            for (const result of results) {
              if (result.error) {
                errors.push({ row: 0, message: `Update error: ${result.error.message}` });
              } else {
                batchSuccessCount++;
              }
            }
            successCount += batchSuccessCount;

            const updateProgress = 60 + Math.round((i + 1) / updateBatches * 35);
            setProgress(updateProgress);
          }
        }

        console.log(`[Import] Updated ${toUpdate.length} existing contracts`);
        setProgress(95);
      }

      // Update batch with results
      await supabase
        .from('import_batches')
        .update({
          registros_sucesso: successCount,
          registros_erro: errors.length,
        })
        .eq('id', batchId);

      setProgress(100);

      return {
        success: errors.length === 0,
        totalProcessed: rows.length,
        successCount,
        errorCount: errors.length,
        errors: errors.slice(0, 50),
        batchId,
      };
    } catch (err) {
      console.error('[Import] Fatal error:', err);
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

// Optimized sales import with bulk operations
async function importSalesOptimized(
  rows: ParsedRow[],
  fieldMap: Record<string, string>,
  batchId: string,
  errors: ImportError[],
  setSuccessCount: (count: number) => void,
  setProgress: (progress: number) => void
) {
  const getValue = (row: ParsedRow, field: string): string | number | null => {
    const sourceCol = fieldMap[field];
    if (!sourceCol) return null;
    const val = row[sourceCol];
    if (val === null || val === undefined || val === '') return null;
    return val as string | number;
  };
  
  const getStringValue = (row: ParsedRow, field: string): string | null => {
    const val = getValue(row, field);
    if (val === null) return null;
    return String(val);
  };

  // STEP 1: Extract and validate all customer data
  const customersToUpsert: Map<string, any> = new Map();
  const validRows: { row: ParsedRow; rowIndex: number; cpfCnpj: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2;

    const cpfCnpj = formatCpfCnpj(getStringValue(row, 'cpf_cnpj'));
    const nome = getStringValue(row, 'nome');
    const os = getStringValue(row, 'os');

    if (!cpfCnpj) {
      errors.push({ row: rowIndex, field: 'cpf_cnpj', message: 'CPF/CNPJ obrigatório' });
      continue;
    }

    if (!nome) {
      errors.push({ row: rowIndex, field: 'nome', message: 'Nome obrigatório' });
      continue;
    }

    if (!os) {
      errors.push({ row: rowIndex, field: 'os', message: 'OS obrigatória' });
      continue;
    }

    // Store customer data (last occurrence wins for same CPF)
    customersToUpsert.set(cpfCnpj, {
      cpf_cnpj: cpfCnpj,
      nome,
      email: getStringValue(row, 'email'),
      telefone: getStringValue(row, 'telefone'),
      telefone2: getStringValue(row, 'telefone2'),
      endereco: getStringValue(row, 'endereco'),
      cidade: getStringValue(row, 'cidade'),
      uf: getStringValue(row, 'uf'),
      cep: getStringValue(row, 'cep'),
    });

    validRows.push({ row, rowIndex, cpfCnpj });
  }

  setProgress(20);

  // STEP 2: Bulk upsert customers
  const customersArray = Array.from(customersToUpsert.values());
  const CUSTOMER_BATCH_SIZE = 200;
  const customerBatches = Math.ceil(customersArray.length / CUSTOMER_BATCH_SIZE);

  for (let i = 0; i < customerBatches; i++) {
    const batchData = customersArray.slice(i * CUSTOMER_BATCH_SIZE, (i + 1) * CUSTOMER_BATCH_SIZE);
    
    const { error } = await supabase
      .from('customers')
      .upsert(batchData, { onConflict: 'cpf_cnpj' });

    if (error) {
      console.error(`[Import] Customer upsert error batch ${i + 1}:`, error.message);
    }
  }

  setProgress(40);

  // STEP 3: Fetch all customer IDs
  const cpfList = Array.from(customersToUpsert.keys());
  const { data: customers, error: fetchError } = await supabase
    .from('customers')
    .select('id, cpf_cnpj')
    .in('cpf_cnpj', cpfList);

  if (fetchError) {
    throw fetchError;
  }

  const customerIdMap = new Map<string, string>();
  for (const c of customers || []) {
    customerIdMap.set(c.cpf_cnpj, c.id);
  }

  setProgress(50);

  // STEP 4: Build sales records
  const salesToInsert: any[] = [];
  
  for (const { row, rowIndex, cpfCnpj } of validRows) {
    const customerId = customerIdMap.get(cpfCnpj);
    if (!customerId) {
      errors.push({ row: rowIndex, message: 'Cliente não encontrado após upsert' });
      continue;
    }

    const os = getStringValue(row, 'os');

    salesToInsert.push({
      customer_id: customerId,
      os: os!.replace(/\D/g, ''),
      produto: getStringValue(row, 'produto'),
      plano: getStringValue(row, 'plano'),
      valor_plano: parseCurrency(getValue(row, 'valor_plano')),
      data_venda: parseDate(getStringValue(row, 'data_venda')),
      vendedor: getStringValue(row, 'vendedor'),
      import_batch_id: batchId,
      raw_data: row,
    });
  }

  setProgress(60);

  // STEP 5: Bulk insert sales records
  const SALES_BATCH_SIZE = 200;
  const salesBatches = Math.ceil(salesToInsert.length / SALES_BATCH_SIZE);
  let successCount = 0;

  for (let i = 0; i < salesBatches; i++) {
    const batchData = salesToInsert.slice(i * SALES_BATCH_SIZE, (i + 1) * SALES_BATCH_SIZE);
    
    const { error } = await supabase
      .from('sales_base')
      .insert(batchData);

    if (error) {
      console.error(`[Import] Sales insert error batch ${i + 1}:`, error.message);
      errors.push({ row: 0, message: `Erro no batch ${i + 1}: ${error.message}` });
    } else {
      successCount += batchData.length;
    }

    const progress = 60 + Math.round((i + 1) / salesBatches * 35);
    setProgress(progress);
  }

  setSuccessCount(successCount);
  setProgress(95);
}
