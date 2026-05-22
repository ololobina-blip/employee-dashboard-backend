-- Колонки Q–W: пересмотр апелляций (original / revised / effective)

USE railway;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS source_type ENUM('chat', 'calls') NOT NULL DEFAULT 'chat' AFTER employee_name,
  ADD COLUMN IF NOT EXISTS ticket_datetime_raw VARCHAR(100) NULL AFTER date,
  ADD COLUMN IF NOT EXISTS original_etiquette_comment TEXT NULL AFTER participation_comment,
  ADD COLUMN IF NOT EXISTS original_solution_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS original_speed_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS original_availability_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS original_participation_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS original_total_score DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS revised_etiquette_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS revised_solution_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS revised_speed_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS revised_availability_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS revised_participation_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS revised_total_score DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS has_approved_appeal_revision TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE appeals
  ADD COLUMN IF NOT EXISTS review_comment TEXT NULL AFTER comment,
  ADD COLUMN IF NOT EXISTS new_etiquette_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS new_solution_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS new_speed_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS new_availability_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS new_participation_comment TEXT NULL,
  ADD COLUMN IF NOT EXISTS new_total_score DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS source_type ENUM('chat', 'calls') NULL,
  ADD COLUMN IF NOT EXISTS source_sheet_name VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS source_row INT NULL;
