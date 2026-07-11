import { MaterialTransaction, TransactionType, PriorityStatus } from '@prisma/client'
import { BaseService } from './base.service'
import { 
  getMaterialTransactionRepository, 
  getInventoryAssetRepository,
  getDivisionRepository 
} from '../repositories'
import { 
  ApiResponse, 
  PaginationQuery, 
  MaterialTransactionWithRelations,
  CreateMaterialTransactionData,
  MaterialTransactionFilters,
  ValidationError,
  InsufficientStockError 
} from '../types'

// Material Transaction service interface
export interface IMaterialTransactionService {
  getById(id: number): Promise<ApiResponse<MaterialTransaction>>
  getByIdWithRelations(id: number): Promise<ApiResponse<MaterialTransactionWithRelations>>
  getAll(pagination?: PaginationQuery): Promise<ApiResponse<MaterialTransaction[]>>
  getAllWithRelations(
    filters?: MaterialTransactionFilters, 
    pagination?: PaginationQuery
  ): Promise<ApiResponse<MaterialTransactionWithRelations[]>>
  getByAssetId(assetId: number, pagination?: PaginationQuery): Promise<ApiResponse<MaterialTransactionWithRelations[]>>
  getByDivisionId(divisionId: number, pagination?: PaginationQuery): Promise<ApiResponse<MaterialTransactionWithRelations[]>>
  getByTransactionType(type: TransactionType, pagination?: PaginationQuery): Promise<ApiResponse<MaterialTransactionWithRelations[]>>
  create(data: CreateMaterialTransactionServiceData): Promise<ApiResponse<MaterialTransaction>>
  update(id: number, data: UpdateMaterialTransactionServiceData): Promise<ApiResponse<MaterialTransaction>>
  delete(id: number): Promise<ApiResponse<void>>
  getTransactionSummary(filters?: MaterialTransactionFilters): Promise<ApiResponse<{
    totalTransactions: number
    totalIncoming: number
    totalOutgoing: number
    pendingCount: number
    urgentCount: number
  }>>
  getRecentTransactions(limit?: number): Promise<ApiResponse<MaterialTransactionWithRelations[]>>
  getTransactionsByDateRange(
    dateFrom: Date, 
    dateTo: Date,
    pagination?: PaginationQuery
  ): Promise<ApiResponse<MaterialTransactionWithRelations[]>>
}

// DTOs for Material Transaction service
export interface CreateMaterialTransactionServiceData {
  assetId: number
  divisionId: number
  quantity: number
  transactionType: TransactionType
  priorityStatus: PriorityStatus
  notes?: string
}

export interface UpdateMaterialTransactionServiceData {
  notes?: string
  priorityStatus?: PriorityStatus
}

// Material Transaction service implementation
export class MaterialTransactionService 
  extends BaseService<MaterialTransaction, CreateMaterialTransactionServiceData, UpdateMaterialTransactionServiceData> 
  implements IMaterialTransactionService {

  private materialTransactionRepository = getMaterialTransactionRepository()
  private inventoryAssetRepository = getInventoryAssetRepository()
  private divisionRepository = getDivisionRepository()

  async getById(id: number): Promise<ApiResponse<MaterialTransaction>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const transaction = await this.materialTransactionRepository.findById(id)
      if (!transaction) {
        throw new Error(`Material transaction with id ${id} not found`)
      }
      
      return transaction
    })
  }

  async getByIdWithRelations(id: number): Promise<ApiResponse<MaterialTransactionWithRelations>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const transaction = await this.materialTransactionRepository.findByIdWithRelations(id)
      if (!transaction) {
        throw new Error(`Material transaction with id ${id} not found`)
      }
      
      return transaction
    })
  }

  async getAll(pagination?: PaginationQuery): Promise<ApiResponse<MaterialTransaction[]>> {
    return this.handlePaginatedOperation(
      () => this.materialTransactionRepository.findAll(pagination),
      () => this.materialTransactionRepository.count(),
      pagination
    )
  }

  async getAllWithRelations(
    filters?: MaterialTransactionFilters, 
    pagination?: PaginationQuery
  ): Promise<ApiResponse<MaterialTransactionWithRelations[]>> {
    return this.handleOperation(async () => {
      this.validateFilters(filters)
      return this.materialTransactionRepository.findAllWithRelations(filters, pagination)
    })
  }

  async getByAssetId(assetId: number, pagination?: PaginationQuery): Promise<ApiResponse<MaterialTransactionWithRelations[]>> {
    return this.handleOperation(async () => {
      this.validateId(assetId)
      
      // Verify asset exists
      const asset = await this.inventoryAssetRepository.findById(assetId)
      if (!asset) {
        throw new Error(`Inventory asset with id ${assetId} not found`)
      }

      return this.materialTransactionRepository.findByAssetId(assetId, pagination)
    })
  }

  async getByDivisionId(divisionId: number, pagination?: PaginationQuery): Promise<ApiResponse<MaterialTransactionWithRelations[]>> {
    return this.handleOperation(async () => {
      this.validateId(divisionId)
      
      // Verify division exists
      const division = await this.divisionRepository.findById(divisionId)
      if (!division) {
        throw new Error(`Division with id ${divisionId} not found`)
      }

      return this.materialTransactionRepository.findByDivisionId(divisionId, pagination)
    })
  }

  async getByTransactionType(type: TransactionType, pagination?: PaginationQuery): Promise<ApiResponse<MaterialTransactionWithRelations[]>> {
    return this.handleOperation(async () => {
      this.validateEnum(type, 'transactionType', ['masuk', 'keluar'])
      
      return this.materialTransactionRepository.findByTransactionType(type, pagination)
    })
  }

  async create(data: CreateMaterialTransactionServiceData): Promise<ApiResponse<MaterialTransaction>> {
    return this.handleOperation(async () => {
      // Normalize / convert string IDs and numbers to actual numbers
      const normalizedData = {
        ...data,
        assetId: typeof data.assetId === 'string' ? Number(data.assetId) : data.assetId,
        divisionId: typeof data.divisionId === 'string' ? Number(data.divisionId) : data.divisionId,
        quantity: typeof data.quantity === 'string' ? Number(data.quantity) : data.quantity
      }

      // Validate input data
      await this.validateCreateData(normalizedData)

      // Sanitize and prepare data
      const createData: CreateMaterialTransactionData = {
        assetId: normalizedData.assetId,
        divisionId: normalizedData.divisionId,
        quantity: normalizedData.quantity,
        transactionType: normalizedData.transactionType,
        priorityStatus: normalizedData.priorityStatus,
        notes: normalizedData.notes ? this.sanitizeString(normalizedData.notes) : undefined
      }

      // Business rule: For outgoing transactions, check stock availability (handled by repository)
      try {
        const transaction = await this.materialTransactionRepository.create(createData)
        return transaction
      } catch (error) {
        if (error instanceof InsufficientStockError) {
          throw new ValidationError(error.message, 'quantity')
        }
        throw error
      }
    })
  }

  async update(id: number, data: UpdateMaterialTransactionServiceData): Promise<ApiResponse<MaterialTransaction>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      this.validateUpdateData(data)

      // Prepare update data
      const updateData: Partial<CreateMaterialTransactionData> = {}
      
      if (data.notes !== undefined) {
        updateData.notes = data.notes ? this.sanitizeString(data.notes) : undefined
      }
      
      if (data.priorityStatus !== undefined) {
        updateData.priorityStatus = data.priorityStatus
      }

      const transaction = await this.materialTransactionRepository.update(id, updateData)
      
      return transaction
    })
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      // Business rule: Deleting transaction reverses inventory changes (handled by repository)
      await this.materialTransactionRepository.delete(id)
      
      return undefined
    })
  }

  async getTransactionSummary(filters?: MaterialTransactionFilters): Promise<ApiResponse<{
    totalTransactions: number
    totalIncoming: number
    totalOutgoing: number
    pendingCount: number
    urgentCount: number
  }>> {
    return this.handleOperation(async () => {
      this.validateFilters(filters)
      return this.materialTransactionRepository.getTransactionSummary(filters)
    })
  }

  async getRecentTransactions(limit: number = 10): Promise<ApiResponse<MaterialTransactionWithRelations[]>> {
    return this.handleOperation(async () => {
      this.validateNumber(limit, 'limit', 1, 100)
      return this.materialTransactionRepository.findRecentTransactions(limit)
    })
  }

  async getTransactionsByDateRange(
    dateFrom: Date, 
    dateTo: Date,
    pagination?: PaginationQuery
  ): Promise<ApiResponse<MaterialTransactionWithRelations[]>> {
    return this.handleOperation(async () => {
      this.validateDateRange(dateFrom, dateTo)
      return this.materialTransactionRepository.findTransactionsByDateRange(dateFrom, dateTo, pagination)
    })
  }

  // Private validation methods
  private async validateCreateData(data: CreateMaterialTransactionServiceData): Promise<void> {
    if (!data) {
      throw new ValidationError('Material transaction data is required')
    }

    this.validateId(data.assetId)
    this.validateId(data.divisionId)
    this.validateNumber(data.quantity, 'quantity', 1, 1000000)
    this.validateEnum(data.transactionType, 'transactionType', ['masuk', 'keluar'])
    this.validateEnum(data.priorityStatus, 'priorityStatus', ['prioritas', 'urgen', 'trivial'])

    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== 'string') {
        throw new ValidationError('Notes must be a string', 'notes')
      }
      if (data.notes.length > 1000) {
        throw new ValidationError('Notes must be at most 1000 characters long', 'notes')
      }
    }

    // Verify asset exists
    const asset = await this.inventoryAssetRepository.findById(data.assetId)
    if (!asset) {
      throw new ValidationError(`Inventory asset with id ${data.assetId} not found`, 'assetId')
    }

    // Verify division exists
    const division = await this.divisionRepository.findById(data.divisionId)
    if (!division) {
      throw new ValidationError(`Division with id ${data.divisionId} not found`, 'divisionId')
    }

    // Business rule: For outgoing transactions, check if sufficient stock is available
    if (data.transactionType === 'keluar' && asset.currentQuantity < data.quantity) {
      throw new ValidationError(
        `Insufficient stock for ${asset.materialName}. Available: ${asset.currentQuantity}, Requested: ${data.quantity}`,
        'quantity'
      )
    }
  }

  private validateUpdateData(data: UpdateMaterialTransactionServiceData): void {
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided for update')
    }

    if (data.priorityStatus !== undefined) {
      this.validateEnum(data.priorityStatus, 'priorityStatus', ['prioritas', 'urgen', 'trivial'])
    }

    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== 'string') {
        throw new ValidationError('Notes must be a string', 'notes')
      }
      if (data.notes.length > 1000) {
        throw new ValidationError('Notes must be at most 1000 characters long', 'notes')
      }
    }
  }

  private validateFilters(filters?: MaterialTransactionFilters): void {
    if (!filters) return

    if (filters.transactionType) {
      this.validateEnum(filters.transactionType, 'transactionType', ['masuk', 'keluar'])
    }

    if (filters.priorityStatus) {
      this.validateEnum(filters.priorityStatus, 'priorityStatus', ['prioritas', 'urgen', 'trivial'])
    }

    if (filters.divisionId) {
      this.validateId(filters.divisionId)
    }

    if (filters.assetId) {
      this.validateId(filters.assetId)
    }

    if (filters.dateFrom && filters.dateTo) {
      this.validateDateRange(filters.dateFrom, filters.dateTo)
    }
  }

  private validateDateRange(dateFrom: Date, dateTo: Date): void {
    if (!(dateFrom instanceof Date) || isNaN(dateFrom.getTime())) {
      throw new ValidationError('Invalid start date', 'dateFrom')
    }

    if (!(dateTo instanceof Date) || isNaN(dateTo.getTime())) {
      throw new ValidationError('Invalid end date', 'dateTo')
    }

    if (dateFrom >= dateTo) {
      throw new ValidationError('Start date must be before end date', 'dateFrom')
    }

    // Business rule: Date range should not exceed 1 year
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000
    if (dateTo.getTime() - dateFrom.getTime() > oneYearInMs) {
      throw new ValidationError('Date range cannot exceed 1 year', 'dateTo')
    }
  }

  // Business logic methods
  async canDeleteTransaction(id: number): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      this.validateId(id)
      
      const transaction = await this.materialTransactionRepository.findByIdWithRelations(id)
      if (!transaction) {
        return { canDelete: false, reason: 'Transaction not found' }
      }

      // Check if deleting this transaction would result in negative stock
      if (transaction.transactionType === 'masuk') {
        const asset = transaction.asset
        if (asset.currentQuantity < transaction.quantity) {
          return { 
            canDelete: false, 
            reason: `Cannot delete: would result in negative stock for ${asset.materialName}` 
          }
        }
      }

      return { canDelete: true }
    } catch (error) {
      return { 
        canDelete: false, 
        reason: error instanceof Error ? error.message : 'Validation error' 
      }
    }
  }

  async getTransactionImpact(id: number): Promise<ApiResponse<{
    transaction: MaterialTransactionWithRelations
    currentAssetStock: number
    impactOnStock: number
    projectedStock: number
    stockStatus: 'increase' | 'decrease'
    warnings: string[]
  }>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const transaction = await this.materialTransactionRepository.findByIdWithRelations(id)
      if (!transaction) {
        throw new Error(`Transaction with id ${id} not found`)
      }

      const currentAssetStock = transaction.asset.currentQuantity
      const impact = transaction.transactionType === 'masuk' ? transaction.quantity : -transaction.quantity
      const projectedStock = currentAssetStock - impact // If we were to reverse this transaction
      
      const warnings: string[] = []
      
      if (projectedStock < 0) {
        warnings.push('Reversing this transaction would result in negative stock')
      }
      
      if (projectedStock <= 10 && transaction.transactionType === 'masuk') {
        warnings.push('Reversing this transaction would result in low stock')
      }
      
      if (transaction.priorityStatus === 'urgen') {
        warnings.push('This is an urgent transaction - consider impact before changes')
      }

      return {
        transaction,
        currentAssetStock,
        impactOnStock: impact,
        projectedStock,
        stockStatus: transaction.transactionType === 'masuk' ? 'increase' : 'decrease',
        warnings
      }
    })
  }

  async validateStockAvailability(assetId: number, quantity: number): Promise<ApiResponse<{
    available: boolean
    currentStock: number
    requestedQuantity: number
    shortfall?: number
    assetName: string
  }>> {
    return this.handleOperation(async () => {
      this.validateId(assetId)
      this.validateNumber(quantity, 'quantity', 1)
      
      const asset = await this.inventoryAssetRepository.findById(assetId)
      if (!asset) {
        throw new Error(`Asset with id ${assetId} not found`)
      }

      const available = asset.currentQuantity >= quantity
      const shortfall = available ? undefined : quantity - asset.currentQuantity

      return {
        available,
        currentStock: asset.currentQuantity,
        requestedQuantity: quantity,
        shortfall,
        assetName: asset.materialName
      }
    })
  }

  async getDailyTransactionStats(date: Date): Promise<ApiResponse<{
    date: Date
    totalTransactions: number
    incomingCount: number
    outgoingCount: number
    incomingQuantity: number
    outgoingQuantity: number
    urgentTransactions: number
    affectedAssets: number
    topDivisions: Array<{
      divisionName: string
      transactionCount: number
    }>
  }>> {
    return this.handleOperation(async () => {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new ValidationError('Invalid date', 'date')
      }

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const filters: MaterialTransactionFilters = {
        dateFrom: startOfDay,
        dateTo: endOfDay
      }

      const [summary, transactions] = await Promise.all([
        this.materialTransactionRepository.getTransactionSummary(filters),
        this.materialTransactionRepository.findAllWithRelations(filters)
      ])

      // Calculate additional stats
      const incomingTransactions = transactions.filter(t => t.transactionType === 'masuk')
      const outgoingTransactions = transactions.filter(t => t.transactionType === 'keluar')
      
      const incomingQuantity = incomingTransactions.reduce((sum, t) => sum + t.quantity, 0)
      const outgoingQuantity = outgoingTransactions.reduce((sum, t) => sum + t.quantity, 0)
      
      const affectedAssets = new Set(transactions.map(t => t.assetId)).size
      
      // Top divisions by transaction count
      const divisionStats = new Map<string, number>()
      transactions.forEach(t => {
        const divisionName = t.division.divisionName
        divisionStats.set(divisionName, (divisionStats.get(divisionName) || 0) + 1)
      })
      
      const topDivisions = Array.from(divisionStats.entries())
        .map(([divisionName, count]) => ({ divisionName, transactionCount: count }))
        .sort((a, b) => b.transactionCount - a.transactionCount)
        .slice(0, 5)

      return {
        date,
        totalTransactions: summary.totalTransactions,
        incomingCount: summary.totalIncoming,
        outgoingCount: summary.totalOutgoing,
        incomingQuantity,
        outgoingQuantity,
        urgentTransactions: summary.urgentCount,
        affectedAssets,
        topDivisions
      }
    })
  }
}