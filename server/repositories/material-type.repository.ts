import { MaterialType, Prisma } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { MaterialTypeWithAssets, PaginationQuery, NotFoundError } from '../types'

// Material Type repository interface
export interface IMaterialTypeRepository {
  findById(id: number): Promise<MaterialType | null>
  findByIdWithAssets(id: number): Promise<MaterialTypeWithAssets | null>
  findAll(pagination?: PaginationQuery): Promise<MaterialType[]>
  findByName(name: string): Promise<MaterialType | null>
  create(data: Prisma.MaterialTypeCreateInput): Promise<MaterialType>
  update(id: number, data: Prisma.MaterialTypeUpdateInput): Promise<MaterialType>
  delete(id: number): Promise<void>
  count(): Promise<number>
}

// Material Type repository implementation
export class MaterialTypeRepository 
  extends BaseRepository<MaterialType, Prisma.MaterialTypeCreateInput, Prisma.MaterialTypeUpdateInput> 
  implements IMaterialTypeRepository {

  async findById(id: number): Promise<MaterialType | null> {
    return this.prisma.materialType.findUnique({
      where: { categoryId: Number(id) }
    })
  }

  async findByIdWithAssets(id: number): Promise<MaterialTypeWithAssets | null> {
    return this.prisma.materialType.findUnique({
      where: { categoryId: Number(id) },
      include: {
        assets: {
          orderBy: {
            materialName: 'asc'
          }
        }
      }
    })
  }

  async findAll(pagination?: PaginationQuery): Promise<MaterialType[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.materialType.findMany({
      skip,
      take,
      orderBy: {
        categoryName: 'asc'
      }
    })
  }

  async findByName(name: string): Promise<MaterialType | null> {
    return this.prisma.materialType.findUnique({
      where: { categoryName: name }
    })
  }

  async create(data: Prisma.MaterialTypeCreateInput): Promise<MaterialType> {
    // Check if category name already exists
    const existing = await this.findByName(data.categoryName)
    if (existing) {
      throw new Error(`Material type with name '${data.categoryName}' already exists`)
    }

    return this.prisma.materialType.create({
      data
    })
  }

  async update(id: number, data: Prisma.MaterialTypeUpdateInput): Promise<MaterialType> {
    // Check if material type exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('MaterialType', id)
    }

    // Check for name conflicts if name is being updated
    if (data.categoryName && typeof data.categoryName === 'string') {
      const nameConflict = await this.findByName(data.categoryName)
      if (nameConflict && nameConflict.categoryId !== id) {
        throw new Error(`Material type with name '${data.categoryName}' already exists`)
      }
    }

    return this.prisma.materialType.update({
      where: { categoryId: id },
      data
    })
  }

  async delete(id: number): Promise<void> {
    // Check if material type exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('MaterialType', id)
    }

    // Check if material type has associated assets
    const assetCount = await this.prisma.inventoryAsset.count({
      where: { categoryId: id }
    })

    if (assetCount > 0) {
      throw new Error(`Cannot delete material type '${existing.categoryName}' because it has ${assetCount} associated assets`)
    }

    await this.prisma.materialType.delete({
      where: { categoryId: id }
    })
  }

  async count(): Promise<number> {
    return this.prisma.materialType.count()
  }

  // Additional methods specific to MaterialType
  async findTypesWithAssetStats(): Promise<Array<MaterialType & { assetCount: number; totalStockQuantity: number }>> {
    const types = await this.prisma.materialType.findMany({
      include: {
        assets: {
          select: {
            currentQuantity: true
          }
        },
        _count: {
          select: {
            assets: true
          }
        }
      },
      orderBy: {
        categoryName: 'asc'
      }
    })

    return types.map(type => ({
      categoryId: type.categoryId,
      categoryName: type.categoryName,
      description: type.description,
      createdAt: type.createdAt,
      assetCount: type._count.assets,
      totalStockQuantity: type.assets.reduce((sum, asset) => sum + asset.currentQuantity, 0)
    }))
  }

  async searchByName(query: string): Promise<MaterialType[]> {
    return this.prisma.materialType.findMany({
      where: {
        OR: [
          {
            categoryName: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        categoryName: 'asc'
      }
    })
  }

  async findMostUsedTypes(limit: number = 10): Promise<Array<MaterialType & { usageCount: number }>> {
    const typesWithUsage = await this.prisma.materialType.findMany({
      include: {
        assets: {
          include: {
            _count: {
              select: {
                transactions: true
              }
            }
          }
        }
      }
    })

    return typesWithUsage
      .map(type => ({
        categoryId: type.categoryId,
        categoryName: type.categoryName,
        description: type.description,
        createdAt: type.createdAt,
        usageCount: type.assets.reduce((sum, asset) => sum + asset._count.transactions, 0)
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }
}