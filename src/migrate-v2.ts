import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { createConnection } from './db'

async function main(): Promise<void> {
  const migrationPath = path.join(__dirname, '..', 'migrations', '002_appeal_revisions.sql')
  let sql = fs.readFileSync(migrationPath, 'utf8')

  // MariaDB на Railway может не поддержать IF NOT EXISTS в ALTER — выполняем построчно
  sql = sql.replace(/ADD COLUMN IF NOT EXISTS/g, 'ADD COLUMN')

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--') && s !== 'USE railway')

  const connection = await createConnection()
  console.log('[DB:MIGRATE] Applying 002_appeal_revisions...')

  try {
    for (const statement of statements) {
      try {
        await connection.query(statement)
        console.log(`[DB:MIGRATE] OK: ${statement.slice(0, 60)}...`)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (message.includes('Duplicate column')) {
          console.log(`[DB:MIGRATE] Skip (exists): ${statement.slice(0, 50)}...`)
          continue
        }
        throw error
      }
    }
    console.log('[DB:MIGRATE] Migration completed')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error('[DB:MIGRATE] Failed:', error)
  process.exit(1)
})
