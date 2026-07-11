import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

// Global is used here to maintain a cached connection across hot reloads in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

const pool = new Pool({ 
  connectionString,
  ssl: connectionString?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
})
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Database connection helper
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Database disconnection helper
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('🔌 Database disconnected')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}

// Health check helper
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { healthy: true, message: 'Database is healthy' }
  } catch (error) {
    return { 
      healthy: false, 
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Transaction helper
export async function withTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => fn(tx as PrismaClient))
}