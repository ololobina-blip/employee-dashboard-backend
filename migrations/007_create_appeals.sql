CREATE TABLE IF NOT EXISTS appeals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_email VARCHAR(255) NOT NULL,
  appeal_id VARCHAR(255) UNIQUE NOT NULL,
  date DATE NOT NULL,
  reason VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected', 'closed') DEFAULT 'pending',
  resolution_date DATE,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_employee_email (employee_email),
  INDEX idx_status (status),
  INDEX idx_date (date),
  FOREIGN KEY (employee_email) REFERENCES employees(email) ON DELETE CASCADE
);
