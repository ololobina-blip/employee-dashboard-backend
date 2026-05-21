import { execSync } from 'child_process'
import { readdir } from 'fs/promises'
import path from 'path'
import { initDatabase, execute, closeDatabase } from './src/db/index'

async function runMigrations() {
  try {
    console.log('[MIGRATION] Starting database migrations...')

    // Connect to DB
    await initDatabase()

    // Get all .sql files from migrations folder
    const migrationsDir = path.join(process.cwd(), 'migrations')
    const files = await readdir(migrationsDir)
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort()

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file)
      const sql = require('fs').readFileSync(filePath, 'utf-8')

      console.log(`[MIGRATION] Running ${file}...`)

      // Split by ; to handle multiple statements
      const statements = sql.split(';').filter((s) => s.trim())
      for (const statement of statements) {
        if (statement.trim()) {
          await execute(statement)
        }
      }

      console.log(`[MIGRATION] ✅ ${file} completed`)
    }

    await closeDatabase()
    console.log('[MIGRATION] ✅ All migrations completed successfully!')
  } catch (error) {
    console.error('[MIGRATION] ❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()
