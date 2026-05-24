ALTER TABLE tickets
  ADD COLUMN source_sheet_name VARCHAR(255) NULL,
  ADD COLUMN source_row INT NULL;