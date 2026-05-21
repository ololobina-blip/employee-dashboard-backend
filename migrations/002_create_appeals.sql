-- Appeals table for logging disputes between employees and management
CREATE TABLE IF NOT EXISTS appeals (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  employee_name VARCHAR(255) NOT NULL,
  ticket_link VARCHAR(500) NOT NULL,
  date VARCHAR(10) NOT NULL COMMENT 'Date in format DD.MM.YYYY',
  month_year VARCHAR(50) NOT NULL COMMENT 'Month year in Russian format',
  comment TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_name (employee_name),
  INDEX idx_status (status),
  INDEX idx_submitted_at (submitted_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
