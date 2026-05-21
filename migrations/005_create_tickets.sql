-- Tickets table for storing ticket data from Google Sheets
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_email VARCHAR(255) NOT NULL,
  ticket_id VARCHAR(255) UNIQUE NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(500),
  status ENUM('resolved', 'pending', 'closed') DEFAULT 'pending',
  category VARCHAR(255),
  ai_score DECIMAL(5,2),
  ai_comment TEXT,
  errors TEXT,
  response_time DECIMAL(5,2),
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_email) REFERENCES employees(email) ON DELETE CASCADE,
  INDEX idx_employee_email (employee_email),
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_date (date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
