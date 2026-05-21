import { getPool } from '../mariadb'
import logger from '@utils/logger'

export interface Employee {
  email: string
  name: string
  role?: string
  department?: string
  created_at?: Date
  updated_at?: Date
}

export class EmployeeRepository {
  async findByEmail(email: string): Promise<Employee | null> {
    try {
      const query = 'SELECT * FROM employees WHERE email = ?'
      const [rows] = await getPool().execute(query, [email])
      const result = rows as any[]
      return result.length > 0 ? result[0] : null
    } catch (error) {
      logger.error(`Error finding employee by email: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findAll(): Promise<Employee[]> {
    try {
      const query = 'SELECT * FROM employees ORDER BY name ASC'
      const [rows] = await getPool().execute(query)
      return rows as Employee[]
    } catch (error) {
      logger.error(`Error finding all employees: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async findByDepartment(department: string): Promise<Employee[]> {
    try {
      const query = 'SELECT * FROM employees WHERE department = ? ORDER BY name ASC'
      const [rows] = await getPool().execute(query, [department])
      return rows as Employee[]
    } catch (error) {
      logger.error(`Error finding employees by department: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async create(employee: Employee): Promise<void> {
    try {
      const query = 'INSERT INTO employees (email, name, role, department) VALUES (?, ?, ?, ?)'
      await getPool().execute(query, [employee.email, employee.name, employee.role, employee.department])
      logger.info(`Employee created: ${employee.email}`)
    } catch (error) {
      logger.error(`Error creating employee: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async update(email: string, employee: Partial<Employee>): Promise<void> {
    try {
      const fields: string[] = []
      const values: any[] = []

      if (employee.name !== undefined) {
        fields.push('name = ?')
        values.push(employee.name)
      }
      if (employee.role !== undefined) {
        fields.push('role = ?')
        values.push(employee.role)
      }
      if (employee.department !== undefined) {
        fields.push('department = ?')
        values.push(employee.department)
      }

      if (fields.length === 0) return

      values.push(email)
      const query = `UPDATE employees SET ${fields.join(', ')} WHERE email = ?`
      await getPool().execute(query, values)
      logger.info(`Employee updated: ${email}`)
    } catch (error) {
      logger.error(`Error updating employee: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async deleteByEmail(email: string): Promise<void> {
    try {
      const query = 'DELETE FROM employees WHERE email = ?'
      await getPool().execute(query, [email])
      logger.info(`Employee deleted: ${email}`)
    } catch (error) {
      logger.error(`Error deleting employee: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM employees'
      const [rows] = await getPool().execute(query)
      const result = rows as any[]
      return result[0]?.count || 0
    } catch (error) {
      logger.error(`Error counting employees: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  async truncate(): Promise<void> {
    try {
      const query = 'TRUNCATE TABLE employees'
      await getPool().execute(query)
      logger.info('Employees table truncated')
    } catch (error) {
      logger.error(`Error truncating employees table: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
}

export default new EmployeeRepository()
