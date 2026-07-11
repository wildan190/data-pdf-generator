import { MaterialTransaction, Prisma, TransactionType, PriorityStatus } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { 
  MaterialTransactionWithRelations, 
  PaginationQuery, 
  NotFoundError,
  CreateMaterialTransactionData,
  MaterialTransactionFilters,
  InsufficientStockError
} from '../types'

// Material Transaction repository interface
export interface IMaterialTransactionRepository {
  findById(id: number): Promise<MaterialTransaction | null>
  findByIdWithRelations(id: number): Promise<MaterialTransactionWithRelations | null>
  findAll(pagination?: PaginationQuery): Promise<MaterialTransaction[]>
  findAllWithRelations(
    filters?: MaterialTransactionFilters, 
    pagination?: PaginationQuery
  ): Promise<MaterialTransactionWithRelations[]>
  findByAssetId(assetId: number, pagination?: PaginationQuery): Promise<MaterialTransactionWithRelations[]>
  findByDivisionId(divisionId: number, pagination?: PaginationQuery): Promise<MaterialTransactionWithRelations[]>
  findByTransactionType(type: TransactionType, pagination?: PaginationQuery): Promise<MaterialTransactionWithRelations[]>
  create(data: CreateMaterialTransactionData): Promise<MaterialTransaction>
  update(id: number, data: Partial<CreateMaterialTransactionData>): Promise<MaterialTransaction>
  delete(id: number): Promise<void>
  count(): Promise<number>
}

// Material Transaction repository implementation
export class MaterialTransactionRepository 
  extends BaseRepository<MaterialTransaction, CreateMaterialTransactionData, Partial<CreateMaterialTransactionData>> 
  implements IMaterialTransactionRepository {

  async findById(id: number): Promise<MaterialTransaction | null> {
    return this.prisma.materialTransaction.findUnique({
      where: { transactionId: id }
    })
  }

  async findByIdWithRelations(id: number): Promise<MaterialTransactionWithRelations | null> {
    return this.prisma.materialTransaction.findUnique({
      where: { transactionId: id },
      include: {
        asset: {
          include: {
            category: true
          }
        },
        division: true
      }
    })
  }

  async findAll(pagination?: PaginationQuery): Promise<MaterialTransaction[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.materialTransaction.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async findAllWithRelations(
    filters?: MaterialTransactionFilters, 
    pagination?: PaginationQuery
  ): Promise<MaterialTransactionWithRelations[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    // Build where clause based on filters
    const where: Prisma.MaterialTransactionWhereInput = {}
    
    if (filters) {
      if (filters.transactionType) {
        where.transactionType = filters.transactionType
      }
      if (filters.priorityStatus) {
        where.priorityStatus = filters.priorityStatus
      }
      if (filters.divisionId) {
        where.divisionId = filters.divisionId
      }
      if (filters.assetId) {
        where.assetId = filters.assetId
      }
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo
        }
      }
    }

    return this.prisma.materialTransaction.findMany({
      where,
      skip,
      take,
      include: {
        asset: {
          include: {
            category: true
          }
        },
        division: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async findByAssetId(assetId: number, pagination?: PaginationQuery): Promise<MaterialTransactionWithRelations[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.materialTransaction.findMany({
      where: { assetId },
      skip,
      take,
      include: {
        asset: {
          include: {
            category: true
          }
        },
        division: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async findByDivisionId(divisionId: number, pagination?: PaginationQuery): Promise<MaterialTransactionWithRelations[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.materialTransaction.findMany({
      where: { divisionId },
      skip,
      take,
      include: {
        asset: {
          include: {
            category: true
          }
        },
        division: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async findByTransactionType(type: TransactionType, pagination?: PaginationQuery): Promise<MaterialTransactionWithRelations[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.materialTransaction.findMany({
      where: { transactionType: type },
      skip,
      take,
      include: {
        asset: {
          include: {
            category: true
          }
        },
        division: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async create(data: CreateMaterialTransactionData): Promise<MaterialTransaction> {
    // Validate asset exists
    const asset = await this.prisma.inventoryAsset.findUnique({
      where: { assetId: data.assetId }
    })
    if (!asset) {
      throw new NotFoundError('InventoryAsset', data.assetId)
    }

    // Validate division exists
    const division = await this.prisma.division.findUnique({
      where: { divisionId: data.divisionId }
    })
    if (!division) {
      throw new NotFoundError('Division', data.divisionId)
    }

    // For outgoing transactions, check stock availability
    if (data.transactionType === 'keluar') {
      if (asset.currentQuantity < data.quantity) {
        throw new InsufficientStockError(asset.materialName, asset.currentQuantity, data.quantity)
      }
    }

    // Create transaction within a database transaction to ensure data consistency
    return this.withTransaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.materialTransaction.create({
        data: {
          assetId: data.assetId,
          divisionId: data.divisionId,
          quantity: data.quantity,
          transactionType: data.transactionType,
          priorityStatus: data.priorityStatus,
          notes: data.notes
        }
      })

      // Update inventory asset quantity
      const quantityChange = data.transactionType === 'masuk' ? data.quantity : -data.quantity
      await tx.inventoryAsset.update({
        where: { assetId: data.assetId },
        data: {
          currentQuantity: {
            increment: quantityChange
          },
          lastUpdatedAt: new Date()
        }
      })

      return transaction
    })
  }

  async update(id: number, data: Partial<CreateMaterialTransactionData>): Promise<MaterialTransaction> {
    // Check if transaction exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('MaterialTransaction', id)
    }

    // For now, we'll only allow updating notes and priority status
    // Changing quantity or transaction type would require complex inventory adjustments
    const allowedUpdates: Prisma.MaterialTransactionUpdateInput = {}
    
    if (data.notes !== undefined) {
      allowedUpdates.notes = data.notes
    }
    if (data.priorityStatus) {
      allowedUpdates.priorityStatus = data.priorityStatus
    }

    return this.prisma.materialTransaction.update({
      where: { transactionId: id },
      data: allowedUpdates
    })
  }

  async delete(id: number): Promise<void> {
    // Check if transaction exists
    const existing = await this.findByIdWithRelations(id)
    if (!existing) {
      throw new NotFoundError('MaterialTransaction', id)
    }

    // Delete transaction within a database transaction to ensure data consistency
    await this.withTransaction(async (tx) => {
      // Reverse the inventory change
      const quantityChange = existing.transactionType === 'masuk' ? -existing.quantity : existing.quantity
      
      // Check if reversing the transaction would result in negative stock
      if (existing.transactionType === 'masuk') {
        const currentAsset = await tx.inventoryAsset.findUnique({
          where: { assetId: existing.assetId }
        })
        if (currentAsset && currentAsset.currentQuantity < existing.quantity) {
          throw new Error(`Cannot delete transaction: would result in negative stock for ${existing.asset.materialName}`)
        }
      }

      // Update inventory asset quantity
      await tx.inventoryAsset.update({
        where: { assetId: existing.assetId },
        data: {
          currentQuantity: {
            increment: quantityChange
          },
          lastUpdatedAt: new Date()
        }
      })

      // Delete the transaction record
      await tx.materialTransaction.delete({
        where: { transactionId: id }
      })
    })
  }

  async count(): Promise<number> {
    return this.prisma.materialTransaction.count()
  }

  // Additional methods specific to MaterialTransaction
  async getTransactionSummary(filters?: MaterialTransactionFilters): Promise<{
    totalTransactions: number
    totalIncoming: number
    totalOutgoing: number
    pendingCount: number
    urgentCount: number
  }> {
    const where: Prisma.MaterialTransactionWhereInput = this.buildWhereClause(filters)

    const [total, incoming, outgoing, urgent] = await Promise.all([
      this.prisma.materialTransaction.count({ where }),
      this.prisma.materialTransaction.count({ 
        where: { ...where, transactionType: 'masuk' } 
      }),
      this.prisma.materialTransaction.count({ 
        where: { ...where, transactionType: 'keluar' } 
      }),
      this.prisma.materialTransaction.count({ 
        where: { ...where, priorityStatus: 'urgen' } 
      })
    ])

    return {
      totalTransactions: total,
      totalIncoming: incoming,
      totalOutgoing: outgoing,
      pendingCount: 0, // We don't have pending status, but keeping for future use
      urgentCount: urgent
    }
  }

  async findRecentTransactions(limit: number = 10): Promise<MaterialTransactionWithRelations[]> {
    return this.prisma.materialTransaction.findMany({
      include: {
        asset: {
          include: {
            category: true
          }
        },
        division: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }

  async findTransactionsByDateRange(
    dateFrom: Date, 
    dateTo: Date,
    pagination?: PaginationQuery
  ): Promise<MaterialTransactionWithRelations[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.materialTransaction.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo
        }
      },
      skip,
      take,
      include: {
        asset: {
          include: {
            category: true
          }
        },
        division: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  private buildWhereClause(filters?: MaterialTransactionFilters): Prisma.MaterialTransactionWhereInput {
    const where: Prisma.MaterialTransactionWhereInput = {}
    
    if (filters) {
      if (filters.transactionType) where.transactionType = filters.transactionType
      if (filters.priorityStatus) where.priorityStatus = filters.priorityStatus
      if (filters.divisionId) where.divisionId = filters.divisionId
      if (filters.assetId) where.assetId = filters.assetId
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
        if (filters.dateTo) where.createdAt.lte = filters.dateTo
      }
    }
    
    return where
  }
}