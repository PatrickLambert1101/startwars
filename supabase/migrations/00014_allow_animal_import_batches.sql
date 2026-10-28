-- Allow the existing import-history table to track animal/cow spreadsheet imports.
ALTER TABLE data_import_batches
  DROP CONSTRAINT IF EXISTS data_import_batches_import_type_check;

ALTER TABLE data_import_batches
  ADD CONSTRAINT data_import_batches_import_type_check
  CHECK (import_type IN ('animals', 'treatments', 'grazing'));
