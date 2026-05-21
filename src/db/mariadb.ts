import mysql, { Pool, PoolOptions } from 'mysql2/promise'
import config from '@config'
import logger from '@utils/logger'

let pool: Pool | null = null

export interface DatabaseConfig extends PoolOptions {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'employee_dashboard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }
}

export async function initMariaDB(): Promise<void> {
  try {
    const dbConfig = getDatabaseConfig()
    pool = mysql.createPool(dbConfig)

    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()

    console.log('[DB] Connected to MariaDB successfully')
    logger.info('Connected to MariaDB')
  } catch (error) {
    console.error('[DB] Failed to connect to MariaDB:', error)
    logger.error(`Failed to connect to MariaDB: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    try {
      await pool.end()
      console.log('[DB] MariaDB connection pool closed')
      logger.info('MariaDB connection pool closed')
    } catch (error) {
      console.error('[DB] Error closing MariaDB connection:', error)
      logger.error(`Error closing MariaDB connection: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initMariaDB() first.')
  }
  return pool
}

export async function executeQuery<T = any>(query: string, values?: any[]): Promise<T[]> {
  const connection = await getPool().getConnection()
  try {
    const [result] = await connection.execute(query, values)
    return result as T[]
  } finally {
    connection.release()
  }
}

export default {
  initMariaDB,
  closeDatabase,
  getPool,
  executeQuery,
}
