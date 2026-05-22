-- Employee Performance Dashboard - DB Init

CREATE DATABASE IF NOT EXISTS employee_dashboard
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE employee_dashboard;

-- 1. Таблица EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(255),
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Таблица TICKETS
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  month_year VARCHAR(50) NOT NULL,
  etiquette_comment TEXT,
  solution_comment TEXT,
  speed_comment TEXT,
  availability_comment TEXT,
  participation_comment TEXT,
  total_score DECIMAL(5,2) NOT NULL,
  link VARCHAR(500),
  caller_number VARCHAR(20),
  execution_link VARCHAR(500),
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_name) REFERENCES employees(name) ON DELETE CASCADE,
  INDEX idx_employee_name (employee_name),
  INDEX idx_date (date),
  INDEX idx_month_year (month_year),
  INDEX idx_total_score (total_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Таблица APPEALS
CREATE TABLE IF NOT EXISTS appeals (
  id VARCHAR(36) PRIMARY KEY,
  ticket_link VARCHAR(500),
  caller_number VARCHAR(20),
  employee_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  month_year VARCHAR(50),
  comment TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  resolved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_name) REFERENCES employees(name) ON DELETE CASCADE,
  INDEX idx_employee_name (employee_name),
  INDEX idx_status (status),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Таблица CLIENT_RATINGS
CREATE TABLE IF NOT EXISTS client_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  comment TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  responsible VARCHAR(255) NOT NULL,
  region ENUM('УЗ', 'РФ', 'Все') DEFAULT 'Все',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_responsible (responsible),
  INDEX idx_date (date),
  INDEX idx_region (region),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Таблица ACCESS_ENTRIES
CREATE TABLE IF NOT EXISTS access_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('admin', 'employee') DEFAULT 'employee',
  status ENUM('active', 'invited') DEFAULT 'active',
  invited_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Таблица SYNC_LOGS
CREATE TABLE IF NOT EXISTS sync_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_type VARCHAR(100) NOT NULL,
  status ENUM('success', 'failed') DEFAULT 'success',
  rows_affected INT DEFAULT 0,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_type (sync_type),
  INDEX idx_status (status),
  INDEX idx_synced_at (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
