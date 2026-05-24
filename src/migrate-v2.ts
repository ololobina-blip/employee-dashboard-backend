import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { createConnection } from './db'

async function applyMigration(connection: Awaited<ReturnType<typeof createConnection>>, fileName: string) {
  const migrationPath = path.join(__dirname, '..', 'migrations', fileName)
  let sql = fs.readFileSync(migrationPath, 'utf8')

  sql = sql.replace(/ADD COLUMN IF NOT EXISTS/g, 'ADD COLUMN')

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--') && s !== 'USE railway')

  console.log(`[DB:MIGRATE] Applying ${fileName}...`)

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
}

async function main(): Promise<void> {
  const connection = await createConnection()

  try {
    await applyMigration(connection, '002_appeal_revisions.sql')
    await applyMigration(connection, '003_ticket_source_coordinates.sql')
    console.log('[DB:MIGRATE] All migrations completed')
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error('[DB:MIGRATE] Failed:', error)
  process.exit(1)
})
