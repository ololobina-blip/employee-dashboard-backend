import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'

async function main(): Promise<void> {
  const host = process.env.DB_HOST
  const port = Number.parseInt(process.env.DB_PORT || '3306', 10)
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD

  if (!host || !user || !password) {
    throw new Error('Заполните DB_HOST, DB_USER, DB_PASSWORD в backend/.env')
  }

  const dbName = process.env.DB_NAME || 'employee_dashboard'
  const initFile = dbName === 'railway' ? 'init-railway.sql' : 'init.sql'
  const initPath = path.join(__dirname, '..', initFile)
  const sql = fs.readFileSync(initPath, 'utf8')

  console.log(`[DB:INIT] Подключение к ${host}:${port}...`)

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  })

  try {
    await connection.query(sql)
    console.log(`[DB:INIT] ${initFile} выполнен (БД: ${dbName})`)
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error('[DB:INIT] Ошибка:', error)
  process.exit(1)
})
