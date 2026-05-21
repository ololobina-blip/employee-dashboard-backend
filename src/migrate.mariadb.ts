import { readdir } from 'fs/promises'
import fs from 'fs'
import path from 'path'
import { initMariaDB, closeDatabase, getPool } from './src/db/mariadb'

async function runMigrations() {
  try {
    console.log('[MIGRATION] Starting MariaDB migrations...')

    // Connect to DB
    await initMariaDB()

    // Get all .sql files from migrations folder
    const migrationsDir = path.join(process.cwd(), 'migrations')
    const files = await readdir(migrationsDir)
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort()

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf-8')

      console.log(`[MIGRATION] Running ${file}...`)

      // Split by ; to handle multiple statements
      const statements = sql.split(';').filter((s) => s.trim())
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await getPool().execute(statement)
          } catch (error) {
            // Ignore "table already exists" errors
            if (error instanceof Error && error.message.includes('already exists')) {
              console.log(`[MIGRATION] ⚠️  Table already exists in ${file}`)
            } else {
              throw error
            }
          }
        }
      }

      console.log(`[MIGRATION] ✅ ${file} completed`)
    }

    await closeDatabase()
    console.log('[MIGRATION] ✅ All MariaDB migrations completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('[MIGRATION] ❌ Migration failed:', error)
    await closeDatabase().catch(() => {})
    process.exit(1)
  }
}

runMigrations()
