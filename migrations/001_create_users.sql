-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  employee_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample admin user (password: admin123)
-- Password hash: $2a$10$K8H1.YPzsPKXw3JiM3/FO.4t7DRxWPHHZ/EbjYH/5qQxW1Rf0m0Zy
INSERT IGNORE INTO users (email, password_hash, role, employee_name) VALUES
('admin@example.com', '$2a$10$K8H1.YPzsPKXw3JiM3/FO.4t7DRxWPHHZ/EbjYH/5qQxW1Rf0m0Zy', 'admin', 'Administrator');
