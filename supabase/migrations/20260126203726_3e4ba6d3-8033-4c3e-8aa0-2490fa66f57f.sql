-- Remove a foreign key antiga de collection_attempts que referencia 'invoices'
ALTER TABLE collection_attempts
DROP CONSTRAINT IF EXISTS collection_attempts_invoice_id_fkey;

-- Cria nova foreign key referenciando 'operator_contracts'
ALTER TABLE collection_attempts
ADD CONSTRAINT collection_attempts_invoice_id_fkey
FOREIGN KEY (invoice_id) REFERENCES operator_contracts(id) ON DELETE CASCADE;

-- Remove a foreign key antiga de payment_promises que referencia 'invoices'
ALTER TABLE payment_promises
DROP CONSTRAINT IF EXISTS payment_promises_invoice_id_fkey;

-- Cria nova foreign key referenciando 'operator_contracts'
ALTER TABLE payment_promises
ADD CONSTRAINT payment_promises_invoice_id_fkey
FOREIGN KEY (invoice_id) REFERENCES operator_contracts(id) ON DELETE CASCADE;