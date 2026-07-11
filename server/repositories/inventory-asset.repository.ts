import { InventoryAsset, Prisma } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { 
  InventoryAssetWithCategory, 
  InventoryAssetWithRelations, 
  PaginationQuery, 
  NotFoundError,
  CreateInventoryAssetData,
  UpdateInventoryAssetData
} from '../types'

// Inventory Asset repository interface
export interface IInventoryAssetRepository {
  findById(id: number): Promise<InventoryAsset | null>
  findByIdWithCategory(id: number): Promise<InventoryAssetWithCategory | null>
  findByIdWithRelations(id: number): Promise<InventoryAssetWithRelations | null>
  findAll(pagination?: PaginationQuery): Promise<InventoryAsset[]>
  findAllWithCategory(pagination?: PaginationQuery): Promise<InventoryAssetWithCategory[]>
  findByName(name: string): Promise<InventoryAsset | null>
  findByCategoryId(categoryId: number, pagination?: PaginationQuery): Promise<InventoryAsset[]>
  create(data: CreateInventoryAssetData): Promise<InventoryAsset>
  update(id: number, data: UpdateInventoryAssetData): Promise<InventoryAsset>
  updateQuantity(id: number, quantityChange: number): Promise<InventoryAsset>
  delete(id: number): Promise<void>
  count(): Promise<number>
}

// Inventory Asset repository implementation
export class InventoryAssetRepository 
  extends BaseRepository<InventoryAsset, CreateInventoryAssetData, UpdateInventoryAssetData> 
  implements IInventoryAssetRepository {

  async findById(id: number): Promise<InventoryAsset | null> {
    return this.prisma.inventoryAsset.findUnique({
      where: { assetId: id }
    })
  }

  async findByIdWithCategory(id: number): Promise<InventoryAssetWithCategory | null> {
    return this.prisma.inventoryAsset.findUnique({
      where: { assetId: id },
      include: {
        category: true
      }
    })
  }

  async findByIdWithRelations(id: number): Promise<InventoryAssetWithRelations | null> {
    return this.prisma.inventoryAsset.findUnique({
      where: { assetId: id },
      include: {
        category: true,
        transactions: {
          include: {
            division: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
  }

  async findAll(pagination?: PaginationQuery): Promise<InventoryAsset[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.inventoryAsset.findMany({
      skip,
      take,
      orderBy: {
        materialName: 'asc'
      }
    })
  }

  async findAllWithCategory(pagination?: PaginationQuery): Promise<InventoryAssetWithCategory[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.inventoryAsset.findMany({
      skip,
      take,
      include: {
        category: true
      },
      orderBy: {
        materialName: 'asc'
      }
    })
  }

  async findByName(name: string): Promise<InventoryAsset | null> {
    return this.prisma.inventoryAsset.findUnique({
      where: { materialName: name }
    })
  }

  async findByCategoryId(categoryId: number, pagination?: PaginationQuery): Promise<InventoryAsset[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.inventoryAsset.findMany({
      where: { categoryId },
      skip,
      take,
      orderBy: {
        materialName: 'asc'
      }
    })
  }

  async create(data: CreateInventoryAssetData): Promise<InventoryAsset> {
    // Check if material name already exists
    const existing = await this.findByName(data.materialName)
    if (existing) {
      throw new Error(`Inventory asset with name '${data.materialName}' already exists`)
    }

    // Validate category exists if provided
    if (data.categoryId) {
      const categoryId = typeof data.categoryId === 'string' ? Number(data.categoryId) : data.categoryId
      const category = await this.prisma.materialType.findUnique({
        where: { categoryId: categoryId }
      })
      if (!category) {
        throw new NotFoundError('MaterialType', categoryId)
      }
    }

    // Convert categoryId to number if it's a string
    const categoryId = data.categoryId 
      ? (typeof data.categoryId === 'string' ? Number(data.categoryId) : data.categoryId)
      : null

    return this.prisma.inventoryAsset.create({
      data: {
        materialName: data.materialName,
        categoryId: categoryId,
        unitMeasure: data.unitMeasure || 'pcs',
        currentQuantity: data.initialQuantity || 0
      }
    })
  }

  async update(id: number, data: UpdateInventoryAssetData): Promise<InventoryAsset> {
    // Check if asset exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('InventoryAsset', id)
    }

    // Check for name conflicts if name is being updated
    if (data.materialName) {
      const nameConflict = await this.findByName(data.materialName)
      if (nameConflict && nameConflict.assetId !== id) {
        throw new Error(`Inventory asset with name '${data.materialName}' already exists`)
      }
    }

    // Validate category exists if being updated
    if (data.categoryId) {
      const categoryId = typeof data.categoryId === 'string' ? Number(data.categoryId) : data.categoryId
      const category = await this.prisma.materialType.findUnique({
        where: { categoryId: categoryId }
      })
      if (!category) {
        throw new NotFoundError('MaterialType', categoryId)
      }
    }

    // Convert categoryId to number if it's a string
    const categoryId = data.categoryId 
      ? (typeof data.categoryId === 'string' ? Number(data.categoryId) : data.categoryId)
      : undefined

    return this.prisma.inventoryAsset.update({
      where: { assetId: id },
      data: {
        materialName: data.materialName,
        categoryId: categoryId,
        unitMeasure: data.unitMeasure
      }
    })
  }

  async updateQuantity(id: number, quantityChange: number): Promise<InventoryAsset> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('InventoryAsset', id)
    }

    const newQuantity = existing.currentQuantity + quantityChange
    if (newQuantity < 0) {
      throw new Error(`Insufficient stock. Available: ${existing.currentQuantity}, Requested change: ${quantityChange}`)
    }

    return this.prisma.inventoryAsset.update({
      where: { assetId: id },
      data: {
        currentQuantity: newQuantity,
        lastUpdatedAt: new Date()
      }
    })
  }

  async delete(id: number): Promise<void> {
    // Check if asset exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('InventoryAsset', id)
    }

    // Check if asset has associated transactions
    const transactionCount = await this.prisma.materialTransaction.count({
      where: { assetId: id }
    })

    if (transactionCount > 0) {
      throw new Error(`Cannot delete inventory asset '${existing.materialName}' because it has ${transactionCount} associated transactions`)
    }

    await this.prisma.inventoryAsset.delete({
      where: { assetId: id }
    })
  }

  async count(): Promise<number> {
    return this.prisma.inventoryAsset.count()
  }

  // Additional methods specific to InventoryAsset
  async findLowStockAssets(threshold: number = 10): Promise<InventoryAssetWithCategory[]> {
    return this.prisma.inventoryAsset.findMany({
      where: {
        currentQuantity: {
          lte: threshold
        }
      },
      include: {
        category: true
      },
      orderBy: {
        currentQuantity: 'asc'
      }
    })
  }

  async findZeroStockAssets(): Promise<InventoryAssetWithCategory[]> {
    return this.prisma.inventoryAsset.findMany({
      where: {
        currentQuantity: 0
      },
      include: {
        category: true
      },
      orderBy: {
        materialName: 'asc'
      }
    })
  }

  async searchByName(query: string): Promise<InventoryAssetWithCategory[]> {
    return this.prisma.inventoryAsset.findMany({
      where: {
        materialName: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        category: true
      },
      orderBy: {
        materialName: 'asc'
      }
    })
  }

  async findMostActiveAssets(limit: number = 10): Promise<Array<InventoryAssetWithCategory & { transactionCount: number }>> {
    const assets = await this.prisma.inventoryAsset.findMany({
      include: {
        category: true,
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        transactions: {
          _count: 'desc'
        }
      },
      take: limit
    })

    return assets.map(asset => ({
      assetId: asset.assetId,
      materialName: asset.materialName,
      categoryId: asset.categoryId,
      currentQuantity: asset.currentQuantity,
      unitMeasure: asset.unitMeasure,
      lastUpdatedAt: asset.lastUpdatedAt,
      category: asset.category,
      transactionCount: asset._count.transactions
    }))
  }

  async getAllWithStats(): Promise<Array<InventoryAssetWithCategory & { transactionCount: number }>> {
    const assets = await this.prisma.inventoryAsset.findMany({
      include: {
        category: true,
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        materialName: 'asc'
      }
    })

    return assets.map(asset => ({
      assetId: asset.assetId,
      materialName: asset.materialName,
      categoryId: asset.categoryId,
      currentQuantity: asset.currentQuantity,
      unitMeasure: asset.unitMeasure,
      lastUpdatedAt: asset.lastUpdatedAt,
      category: asset.category,
      transactionCount: asset._count.transactions
    }))
  }

  async getStockSummary(): Promise<{
    totalAssets: number
    totalStockValue: number
    lowStockCount: number
    zeroStockCount: number
  }> {
    const [total, lowStock, zeroStock] = await Promise.all([
      this.count(),
      this.prisma.inventoryAsset.count({
        where: { currentQuantity: { lte: 10 } }
      }),
      this.prisma.inventoryAsset.count({
        where: { currentQuantity: 0 }
      })
    ])

    const totalStockQuantity = await this.prisma.inventoryAsset.aggregate({
      _sum: {
        currentQuantity: true
      }
    })

    return {
      totalAssets: total,
      totalStockValue: totalStockQuantity._sum.currentQuantity || 0,
      lowStockCount: lowStock,
      zeroStockCount: zeroStock
    }
  }
}