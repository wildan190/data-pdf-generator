// Client-side type definitions

// Basic entity types
export interface Division {
  divisionId: number
  divisionName: string
  createdAt: Date
}

export interface MaterialType {
  categoryId: number
  categoryName: string
  description?: string
  createdAt: Date
}

export interface InventoryAsset {
  assetId: number
  materialName: string
  categoryId?: number
  currentQuantity: number
  unitMeasure: string
  lastUpdatedAt: Date
}

export interface MaterialTransaction {
  transactionId: number
  assetId: number
  divisionId: number
  quantity: number
  transactionType: 'masuk' | 'keluar'
  priorityStatus: 'prioritas' | 'urgen' | 'trivial'
  notes?: string
  createdAt: Date
}

// Extended types with relations
export interface DivisionWithStats extends Division {
  transactionCount: number
}

export interface MaterialTypeWithStats extends MaterialType {
  assetCount: number
  totalStockQuantity: number
}

export interface InventoryAssetWithCategory extends InventoryAsset {
  category?: MaterialType
}

export interface InventoryAssetWithStats extends InventoryAssetWithCategory {
  transactionCount: number
}

export interface MaterialTransactionWithRelations extends MaterialTransaction {
  asset: InventoryAssetWithCategory
  division: Division
}

// Form data types
export interface CreateDivisionForm {
  divisionName: string
}

export interface CreateMaterialTypeForm {
  categoryName: string
  description?: string
}

export interface CreateInventoryAssetForm {
  materialName: string
  categoryId?: number
  unitMeasure?: string
  initialQuantity?: number
}

export interface CreateMaterialTransactionForm {
  assetId: number
  divisionId: number
  quantity: number
  transactionType: 'masuk' | 'keluar'
  priorityStatus: 'prioritas' | 'urgen' | 'trivial'
  notes?: string
}

// Filter types
export interface MaterialTransactionFilters {
  transactionType?: 'masuk' | 'keluar'
  priorityStatus?: 'prioritas' | 'urgen' | 'trivial'
  divisionId?: number
  assetId?: number
  dateFrom?: Date
  dateTo?: Date
}

export interface InventoryAssetFilters {
  categoryId?: number
  lowStock?: boolean
  zeroStock?: boolean
  search?: string
}

// Report types
export interface ReportAlatMasuk {
  transactionId: number
  jenisMaterial: string
  kuantitas: number
  divisi: string
  status: string
  tanggalMasuk: Date
  catatan?: string
}

export interface ReportAlatKeluar {
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

// Dashboard types
export interface DashboardStats {
  totalAssets: number
  totalTransactions: number
  totalIncoming: number
  totalOutgoing: number
  lowStockAlerts: number
  urgentTransactions: number
  recentActivityCount: number
}

export interface StockSummary {
  totalAssets: number
  totalStockValue: number
  lowStockCount: number
  zeroStockCount: number
}

// UI State types
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

// Form validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface FormErrors {
  [field: string]: string | null
}

// Export types
export type ExportFormat = 'pdf' | 'excel' | 'word'

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  title?: string
  subtitle?: string
  includeHeaders?: boolean
  includeTimestamp?: boolean
  filters?: MaterialTransactionFilters
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface ExportData {
  headers: string[]
  rows: Array<Array<string | number>>
  metadata: {
    title: string
    generatedAt: Date
    totalRecords: number
    filters?: string
  }
}

export interface ExportResponse {
  success: boolean
  filename?: string
  contentType?: string
  error?: string
  buffer?: ArrayBuffer
}

export interface MultiReportExportRequest {
  reports: Array<{
    type: 'incoming' | 'outgoing' | 'investment'
    title?: string
  }>
  options: ExportOptions
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

// Theme types
export interface Theme {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
}

// Constants
export const TRANSACTION_TYPES = [
  { value: 'masuk', label: 'Masuk (Incoming)' },
  { value: 'keluar', label: 'Keluar (Outgoing)' }
] as const

export const PRIORITY_STATUSES = [
  { value: 'prioritas', label: 'Prioritas (High Priority)', color: 'red' },
  { value: 'urgen', label: 'Urgen (Urgent)', color: 'orange' },
  { value: 'trivial', label: 'Trivial (Low Priority)', color: 'green' }
] as const

export const UNIT_MEASURES = [
  'pcs', 'unit', 'batang', 'sak', 'kg', 'gram', 'liter', 'meter', 
  'cm', 'inch', 'box', 'carton', 'roll', 'sheet', 'set'
] as const

export const PAGE_SIZES = [10, 25, 50, 100] as const