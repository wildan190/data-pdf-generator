import { MaterialType, Prisma } from '@prisma/client'
import { BaseService } from './base.service'
import { getMaterialTypeRepository } from '../repositories'
import { 
  ApiResponse, 
  PaginationQuery, 
  MaterialTypeWithAssets,
  ValidationError 
} from '../types'

// Material Type service interface
export interface IMaterialTypeService {
  getById(id: number): Promise<ApiResponse<MaterialType>>
  getByIdWithAssets(id: number): Promise<ApiResponse<MaterialTypeWithAssets>>
  getAll(pagination?: PaginationQuery): Promise<ApiResponse<MaterialType[]>>
  getByName(name: string): Promise<ApiResponse<MaterialType | null>>
  create(data: CreateMaterialTypeData): Promise<ApiResponse<MaterialType>>
  update(id: number, data: UpdateMaterialTypeData): Promise<ApiResponse<MaterialType>>
  delete(id: number): Promise<ApiResponse<void>>
  getTypesWithStats(): Promise<ApiResponse<Array<MaterialType & { assetCount: number; totalStockQuantity: number }>>>
  searchByName(query: string): Promise<ApiResponse<MaterialType[]>>
  getMostUsedTypes(limit?: number): Promise<ApiResponse<Array<MaterialType & { usageCount: number }>>>
}

// DTOs for Material Type service
export interface CreateMaterialTypeData {
  categoryName: string
  description?: string
}

export interface UpdateMaterialTypeData {
  categoryName?: string
  description?: string
}

// Material Type service implementation
export class MaterialTypeService 
  extends BaseService<MaterialType, CreateMaterialTypeData, UpdateMaterialTypeData> 
  implements IMaterialTypeService {

  private materialTypeRepository = getMaterialTypeRepository()

  async getById(id: number): Promise<ApiResponse<MaterialType>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const materialType = await this.materialTypeRepository.findById(id)
      if (!materialType) {
        throw new Error(`Material type with id ${id} not found`)
      }
      
      return materialType
    })
  }

  async getByIdWithAssets(id: number): Promise<ApiResponse<MaterialTypeWithAssets>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const materialType = await this.materialTypeRepository.findByIdWithAssets(id)
      if (!materialType) {
        throw new Error(`Material type with id ${id} not found`)
      }
      
      return materialType
    })
  }

  async getAll(pagination?: PaginationQuery): Promise<ApiResponse<MaterialType[]>> {
    return this.handlePaginatedOperation(
      () => this.materialTypeRepository.findAll(pagination),
      () => this.materialTypeRepository.count(),
      pagination
    )
  }

  async getByName(name: string): Promise<ApiResponse<MaterialType | null>> {
    return this.handleOperation(async () => {
      this.validateString(name, 'categoryName')
      return this.materialTypeRepository.findByName(name)
    })
  }

  async create(data: CreateMaterialTypeData): Promise<ApiResponse<MaterialType>> {
    return this.handleOperation(async () => {
      // Validate input data
      this.validateCreateData(data)

      // Sanitize input
      const sanitizedData: Prisma.MaterialTypeCreateInput = {
        categoryName: this.sanitizeString(data.categoryName),
        description: data.description ? this.sanitizeString(data.description) : null
      }

      // Business rule: Category names must be unique (handled by repository)
      const materialType = await this.materialTypeRepository.create(sanitizedData)
      
      return materialType
    })
  }

  async update(id: number, data: UpdateMaterialTypeData): Promise<ApiResponse<MaterialType>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      this.validateUpdateData(data)

      // Prepare update data
      const updateData: Prisma.MaterialTypeUpdateInput = {}
      
      if (data.categoryName !== undefined) {
        updateData.categoryName = this.sanitizeString(data.categoryName)
      }
      
      if (data.description !== undefined) {
        updateData.description = data.description ? this.sanitizeString(data.description) : null
      }

      const materialType = await this.materialTypeRepository.update(id, updateData)
      
      return materialType
    })
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      // Business rule: Cannot delete material type with associated assets (handled by repository)
      await this.materialTypeRepository.delete(id)
      
      return undefined
    })
  }

  async getTypesWithStats(): Promise<ApiResponse<Array<MaterialType & { assetCount: number; totalStockQuantity: number }>>> {
    return this.handleOperation(async () => {
      return this.materialTypeRepository.findTypesWithAssetStats()
    })
  }

  async searchByName(query: string): Promise<ApiResponse<MaterialType[]>> {
    return this.handleOperation(async () => {
      this.validateString(query, 'query', 1, 100)
      return this.materialTypeRepository.searchByName(query)
    })
  }

  async getMostUsedTypes(limit: number = 10): Promise<ApiResponse<Array<MaterialType & { usageCount: number }>>> {
    return this.handleOperation(async () => {
      this.validateNumber(limit, 'limit', 1, 100)
      return this.materialTypeRepository.findMostUsedTypes(limit)
    })
  }

  // Private validation methods
  private validateCreateData(data: CreateMaterialTypeData): void {
    if (!data) {
      throw new ValidationError('Material type data is required')
    }

    this.validateString(data.categoryName, 'categoryName', 2, 100)

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string') {
        throw new ValidationError('Description must be a string', 'description')
      }
      if (data.description.length > 500) {
        throw new ValidationError('Description must be at most 500 characters long', 'description')
      }
    }

    // Business rule: Category name should not contain special characters except spaces and hyphens
    const namePattern = /^[a-zA-Z0-9\s\-&().]+$/
    if (!namePattern.test(data.categoryName)) {
      throw new ValidationError(
        'Category name can only contain letters, numbers, spaces, hyphens, ampersands, and parentheses',
        'categoryName'
      )
    }
  }

  private validateUpdateData(data: UpdateMaterialTypeData): void {
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided for update')
    }

    if (data.categoryName !== undefined) {
      this.validateString(data.categoryName, 'categoryName', 2, 100)
      
      const namePattern = /^[a-zA-Z0-9\s\-&().]+$/
      if (!namePattern.test(data.categoryName)) {
        throw new ValidationError(
          'Category name can only contain letters, numbers, spaces, hyphens, ampersands, and parentheses',
          'categoryName'
        )
      }
    }

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string') {
        throw new ValidationError('Description must be a string', 'description')
      }
      if (data.description.length > 500) {
        throw new ValidationError('Description must be at most 500 characters long', 'description')
      }
    }
  }

  // Business logic methods
  async canDeleteMaterialType(id: number): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      this.validateId(id)
      
      const materialType = await this.materialTypeRepository.findByIdWithAssets(id)
      if (!materialType) {
        return { canDelete: false, reason: 'Material type not found' }
      }

      if (materialType.assets.length > 0) {
        return { 
          canDelete: false, 
          reason: `Material type has ${materialType.assets.length} associated assets` 
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

  async getMaterialTypeReport(id: number): Promise<ApiResponse<{
    materialType: MaterialType
    assetCount: number
    totalStockValue: number
    lowStockAssets: number
    zeroStockAssets: number
    topAssetsByStock: Array<{
      materialName: string
      currentQuantity: number
      unitMeasure: string
    }>
  }>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const materialTypeWithAssets = await this.materialTypeRepository.findByIdWithAssets(id)
      if (!materialTypeWithAssets) {
        throw new Error(`Material type with id ${id} not found`)
      }

      const assets = materialTypeWithAssets.assets
      const totalStockValue = assets.reduce((sum, asset) => sum + asset.currentQuantity, 0)
      const lowStockAssets = assets.filter(asset => asset.currentQuantity <= 10).length
      const zeroStockAssets = assets.filter(asset => asset.currentQuantity === 0).length
      
      const topAssetsByStock = assets
        .sort((a, b) => b.currentQuantity - a.currentQuantity)
        .slice(0, 10)
        .map(asset => ({
          materialName: asset.materialName,
          currentQuantity: asset.currentQuantity,
          unitMeasure: asset.unitMeasure
        }))

      return {
        materialType: {
          categoryId: materialTypeWithAssets.categoryId,
          categoryName: materialTypeWithAssets.categoryName,
          description: materialTypeWithAssets.description,
          createdAt: materialTypeWithAssets.createdAt
        },
        assetCount: assets.length,
        totalStockValue,
        lowStockAssets,
        zeroStockAssets,
        topAssetsByStock
      }
    })
  }

  async validateCategoryName(name: string): Promise<ApiResponse<{ isValid: boolean; suggestions?: string[] }>> {
    return this.handleOperation(async () => {
      this.validateString(name, 'categoryName')

      // Check if name already exists
      const existing = await this.materialTypeRepository.findByName(name)
      if (existing) {
        return {
          isValid: false,
          suggestions: [`${name} (Modified)`, `${name} V2`, `New ${name}`]
        }
      }

      // Check for similar names and provide suggestions
      const similar = await this.materialTypeRepository.searchByName(name)
      if (similar.length > 0) {
        const suggestions = similar.map(mt => mt.categoryName).slice(0, 3)
        return {
          isValid: true,
          suggestions
        }
      }

      return { isValid: true }
    })
  }
}