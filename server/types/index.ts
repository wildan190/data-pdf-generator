import { Prisma } from '@prisma/client'

// Export Prisma generated types
export * from '@prisma/client'

// Custom type definitions for the application
export interface CreateMaterialTransactionData {
  assetId: number
  divisionId: number
  quantity: number
  transactionType: 'masuk' | 'keluar'
  priorityStatus: 'prioritas' | 'urgen' | 'trivial'
  notes?: string
}

export interface CreateInventoryAssetData {
  materialName: string
  categoryId?: number
  unitMeasure?: string
  initialQuantity?: number
}

export interface UpdateInventoryAssetData {
  materialName?: string
  categoryId?: number
  unitMeasure?: string
}

export interface MaterialTransactionFilters {
  transactionType?: 'masuk' | 'keluar'
  priorityStatus?: 'prioritas' | 'urgen' | 'trivial'
  divisionId?: number
  assetId?: number
  dateFrom?: Date
  dateTo?: Date
}

// Report types
export interface ReportAlartMasuk {
  transactionId: number
  jenisMaterial: string
  kuantitas: number
  divisi: string
  status: string
  tanggalMasuk: Date
  catatan?: string
}

export interface ReportAlartKeluar {
  transactionId: number
  jenisMaterial: string
  kuantitas: number
  divisi: string
  status: string
  tanggalKeluar: Date
  catatan?: string
}

export interface ReportInvestment {
  assetId: number
  categoryName?: string
  materialName: string
  totalAlatMasuk: number
  totalAlatKeluar: number
  netInvestmentStok: number
  pembaruanTerakhir: Date
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginationQuery {
  page?: number
  pageSize?: number
}

// Export types with relations
export type DivisionWithTransactions = Prisma.DivisionGetPayload<{
  include: { transactions: true }
}>

export type MaterialTypeWithAssets = Prisma.MaterialTypeGetPayload<{
  include: { assets: true }
}>

export type InventoryAssetWithCategory = Prisma.InventoryAssetGetPayload<{
  include: { category: true }
}>

export type InventoryAssetWithRelations = Prisma.InventoryAssetGetPayload<{
  include: { 
    category: true
    transactions: {
      include: {
        division: true
      }
    }
  }
}>

export type MaterialTransactionWithRelations = Prisma.MaterialTransactionGetPayload<{
  include: {
    asset: {
      include: {
        category: true
      }
    }
    division: true
  }
}>

// Error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class InsufficientStockError extends Error {
  constructor(materialName: string, available: number, requested: number) {
    super(`Insufficient stock for ${materialName}. Available: ${available}, Requested: ${requested}`)
    this.name = 'InsufficientStockError'
  }
}