import { InventoryAsset } from '@prisma/client'
import { BaseService } from './base.service'
import { getInventoryAssetRepository, getMaterialTypeRepository } from '../repositories'
import { 
  ApiResponse, 
  PaginationQuery, 
  InventoryAssetWithCategory,
  InventoryAssetWithRelations,
  CreateInventoryAssetData,
  UpdateInventoryAssetData,
  ValidationError 
} from '../types'

// Inventory Asset service interface
export interface IInventoryAssetService {
  getById(id: number): Promise<ApiResponse<InventoryAsset>>
  getByIdWithCategory(id: number): Promise<ApiResponse<InventoryAssetWithCategory>>
  getByIdWithRelations(id: number): Promise<ApiResponse<InventoryAssetWithRelations>>
  getAll(pagination?: PaginationQuery): Promise<ApiResponse<InventoryAsset[]>>
  getAllWithCategory(pagination?: PaginationQuery): Promise<ApiResponse<InventoryAssetWithCategory[]>>
  getByCategoryId(categoryId: number, pagination?: PaginationQuery): Promise<ApiResponse<InventoryAsset[]>>
  getByName(name: string): Promise<ApiResponse<InventoryAsset | null>>
  create(data: CreateInventoryAssetServiceData): Promise<ApiResponse<InventoryAsset>>
  update(id: number, data: UpdateInventoryAssetServiceData): Promise<ApiResponse<InventoryAsset>>
  delete(id: number): Promise<ApiResponse<void>>
  getLowStockAssets(threshold?: number): Promise<ApiResponse<InventoryAssetWithCategory[]>>
  getZeroStockAssets(): Promise<ApiResponse<InventoryAssetWithCategory[]>>
  searchByName(query: string): Promise<ApiResponse<InventoryAssetWithCategory[]>>
  getMostActiveAssets(limit?: number): Promise<ApiResponse<Array<InventoryAssetWithCategory & { transactionCount: number }>>>
  getStockSummary(): Promise<ApiResponse<{
    totalAssets: number
    totalStockValue: number
    lowStockCount: number
    zeroStockCount: number
  }>>
}

// DTOs for Inventory Asset service
export interface CreateInventoryAssetServiceData {
  materialName: string
  categoryId?: number
  unitMeasure?: string
  initialQuantity?: number
}

export interface UpdateInventoryAssetServiceData {
  materialName?: string
  categoryId?: number
  unitMeasure?: string
}

// Valid unit measures
const VALID_UNIT_MEASURES = [
  'pcs', 'unit', 'batang', 'sak', 'kg', 'gram', 'liter', 'meter', 
  'cm', 'inch', 'box', 'carton', 'roll', 'sheet', 'set'
]

// Inventory Asset service implementation
export class InventoryAssetService 
  extends BaseService<InventoryAsset, CreateInventoryAssetServiceData, UpdateInventoryAssetServiceData> 
  implements IInventoryAssetService {

  private inventoryAssetRepository = getInventoryAssetRepository()
  private materialTypeRepository = getMaterialTypeRepository()

  async getById(id: number): Promise<ApiResponse<InventoryAsset>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const asset = await this.inventoryAssetRepository.findById(id)
      if (!asset) {
        throw new Error(`Inventory asset with id ${id} not found`)
      }
      
      return asset
    })
  }

  async getByIdWithCategory(id: number): Promise<ApiResponse<InventoryAssetWithCategory>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const asset = await this.inventoryAssetRepository.findByIdWithCategory(id)
      if (!asset) {
        throw new Error(`Inventory asset with id ${id} not found`)
      }
      
      return asset
    })
  }

  async getByIdWithRelations(id: number): Promise<ApiResponse<InventoryAssetWithRelations>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const asset = await this.inventoryAssetRepository.findByIdWithRelations(id)
      if (!asset) {
        throw new Error(`Inventory asset with id ${id} not found`)
      }
      
      return asset
    })
  }

  async getAll(pagination?: PaginationQuery): Promise<ApiResponse<InventoryAsset[]>> {
    return this.handlePaginatedOperation(
      () => this.inventoryAssetRepository.findAll(pagination),
      () => this.inventoryAssetRepository.count(),
      pagination
    )
  }

  async getAllWithCategory(pagination?: PaginationQuery): Promise<ApiResponse<InventoryAssetWithCategory[]>> {
    return this.handlePaginatedOperation(
      () => this.inventoryAssetRepository.findAllWithCategory(pagination),
      () => this.inventoryAssetRepository.count(),
      pagination
    )
  }

  async getByCategoryId(categoryId: number, pagination?: PaginationQuery): Promise<ApiResponse<InventoryAsset[]>> {
    return this.handleOperation(async () => {
      this.validateId(categoryId)
      
      // Verify category exists
      const category = await this.materialTypeRepository.findById(categoryId)
      if (!category) {
        throw new Error(`Material type with id ${categoryId} not found`)
      }

      return this.inventoryAssetRepository.findByCategoryId(categoryId, pagination)
    })
  }

  async getByName(name: string): Promise<ApiResponse<InventoryAsset | null>> {
    return this.handleOperation(async () => {
      this.validateString(name, 'materialName')
      return this.inventoryAssetRepository.findByName(name)
    })
  }

  async create(data: CreateInventoryAssetServiceData): Promise<ApiResponse<InventoryAsset>> {
    return this.handleOperation(async () => {
      // Validate input data
      await this.validateCreateData(data)

      // Sanitize and prepare data
      const createData: CreateInventoryAssetData = {
        materialName: this.sanitizeString(data.materialName),
        categoryId: data.categoryId,
        unitMeasure: data.unitMeasure || 'pcs',
        initialQuantity: data.initialQuantity || 0
      }

      // Business rule: Material names must be unique (handled by repository)
      const asset = await this.inventoryAssetRepository.create(createData)
      
      return asset
    })
  }

  async update(id: number, data: UpdateInventoryAssetServiceData): Promise<ApiResponse<InventoryAsset>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      await this.validateUpdateData(data)

      // Prepare update data
      const updateData: UpdateInventoryAssetData = {}
      
      if (data.materialName !== undefined) {
        updateData.materialName = this.sanitizeString(data.materialName)
      }
      
      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId
      }
      
      if (data.unitMeasure !== undefined) {
        updateData.unitMeasure = data.unitMeasure
      }

      const asset = await this.inventoryAssetRepository.update(id, updateData)
      
      return asset
    })
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      // Business rule: Cannot delete asset with associated transactions (handled by repository)
      await this.inventoryAssetRepository.delete(id)
      
      return undefined
    })
  }

  async getLowStockAssets(threshold: number = 10): Promise<ApiResponse<InventoryAssetWithCategory[]>> {
    return this.handleOperation(async () => {
      this.validateNumber(threshold, 'threshold', 0, 1000)
      return this.inventoryAssetRepository.findLowStockAssets(threshold)
    })
  }

  async getZeroStockAssets(): Promise<ApiResponse<InventoryAssetWithCategory[]>> {
    return this.handleOperation(async () => {
      return this.inventoryAssetRepository.findZeroStockAssets()
    })
  }

  async searchByName(query: string): Promise<ApiResponse<InventoryAssetWithCategory[]>> {
    return this.handleOperation(async () => {
      this.validateString(query, 'query', 1, 100)
      return this.inventoryAssetRepository.searchByName(query)
    })
  }

  async getMostActiveAssets(limit: number = 10): Promise<ApiResponse<Array<InventoryAssetWithCategory & { transactionCount: number }>>> {
    return this.handleOperation(async () => {
      this.validateNumber(limit, 'limit', 1, 100)
      return this.inventoryAssetRepository.findMostActiveAssets(limit)
    })
  }

  async getStockSummary(): Promise<ApiResponse<{
    totalAssets: number
    totalStockValue: number
    lowStockCount: number
    zeroStockCount: number
  }>> {
    return this.handleOperation(async () => {
      return this.inventoryAssetRepository.getStockSummary()
    })
  }

  // Private validation methods
  private async validateCreateData(data: CreateInventoryAssetServiceData): Promise<void> {
    if (!data) {
      throw new ValidationError('Inventory asset data is required')
    }

    this.validateString(data.materialName, 'materialName', 3, 255)

    if (data.categoryId !== undefined && data.categoryId !== null) {
      this.validateId(data.categoryId)
      
      // Verify category exists
      const category = await this.materialTypeRepository.findById(data.categoryId)
      if (!category) {
        throw new ValidationError(`Material type with id ${data.categoryId} not found`, 'categoryId')
      }
    }

    if (data.unitMeasure !== undefined && data.unitMeasure !== null) {
      if (!VALID_UNIT_MEASURES.includes(data.unitMeasure)) {
        throw new ValidationError(
          `Unit measure must be one of: ${VALID_UNIT_MEASURES.join(', ')}`,
          'unitMeasure'
        )
      }
    }

    if (data.initialQuantity !== undefined && data.initialQuantity !== null) {
      this.validateNumber(data.initialQuantity, 'initialQuantity', 0, 1000000)
    }

    // Business rule: Material name should not contain special characters except spaces, hyphens, and parentheses
    const namePattern = /^[a-zA-Z0-9\s\-().&\/]+$/
    if (!namePattern.test(data.materialName)) {
      throw new ValidationError(
        'Material name can only contain letters, numbers, spaces, hyphens, parentheses, ampersands, and forward slashes',
        'materialName'
      )
    }
  }

  private async validateUpdateData(data: UpdateInventoryAssetServiceData): Promise<void> {
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided for update')
    }

    if (data.materialName !== undefined) {
      this.validateString(data.materialName, 'materialName', 3, 255)
      
      const namePattern = /^[a-zA-Z0-9\s\-().&\/]+$/
      if (!namePattern.test(data.materialName)) {
        throw new ValidationError(
          'Material name can only contain letters, numbers, spaces, hyphens, parentheses, ampersands, and forward slashes',
          'materialName'
        )
      }
    }

    if (data.categoryId !== undefined && data.categoryId !== null) {
      this.validateId(data.categoryId)
      
      // Verify category exists
      const category = await this.materialTypeRepository.findById(data.categoryId)
      if (!category) {
        throw new ValidationError(`Material type with id ${data.categoryId} not found`, 'categoryId')
      }
    }

    if (data.unitMeasure !== undefined) {
      if (!VALID_UNIT_MEASURES.includes(data.unitMeasure)) {
        throw new ValidationError(
          `Unit measure must be one of: ${VALID_UNIT_MEASURES.join(', ')}`,
          'unitMeasure'
        )
      }
    }
  }

  // Business logic methods
  async canDeleteAsset(id: number): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      this.validateId(id)
      
      const asset = await this.inventoryAssetRepository.findByIdWithRelations(id)
      if (!asset) {
        return { canDelete: false, reason: 'Asset not found' }
      }

      if (asset.transactions.length > 0) {
        return { 
          canDelete: false, 
          reason: `Asset has ${asset.transactions.length} associated transactions` 
        }
      }

      if (asset.currentQuantity > 0) {
        return { 
          canDelete: false, 
          reason: `Asset still has ${asset.currentQuantity} ${asset.unitMeasure} in stock` 
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

  async validateMaterialName(name: string): Promise<ApiResponse<{ isValid: boolean; suggestions?: string[] }>> {
    return this.handleOperation(async () => {
      this.validateString(name, 'materialName')

      // Check if name already exists
      const existing = await this.inventoryAssetRepository.findByName(name)
      if (existing) {
        return {
          isValid: false,
          suggestions: [`${name} (New)`, `${name} V2`, `Modified ${name}`]
        }
      }

      // Check for similar names and provide suggestions
      const similar = await this.inventoryAssetRepository.searchByName(name)
      if (similar.length > 0) {
        const suggestions = similar.map(asset => asset.materialName).slice(0, 3)
        return {
          isValid: true,
          suggestions
        }
      }

      return { isValid: true }
    })
  }

  async getAssetHealthCheck(id: number): Promise<ApiResponse<{
    asset: InventoryAssetWithCategory
    stockStatus: 'healthy' | 'low' | 'critical' | 'out-of-stock'
    recommendations: string[]
    riskLevel: 'low' | 'medium' | 'high'
  }>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const asset = await this.inventoryAssetRepository.findByIdWithCategory(id)
      if (!asset) {
        throw new Error(`Asset with id ${id} not found`)
      }

      let stockStatus: 'healthy' | 'low' | 'critical' | 'out-of-stock'
      let riskLevel: 'low' | 'medium' | 'high'
      const recommendations: string[] = []

      if (asset.currentQuantity === 0) {
        stockStatus = 'out-of-stock'
        riskLevel = 'high'
        recommendations.push('Immediate restocking required')
        recommendations.push('Check for pending orders')
      } else if (asset.currentQuantity <= 5) {
        stockStatus = 'critical'
        riskLevel = 'high'
        recommendations.push('Critical stock level - order immediately')
        recommendations.push('Consider increasing minimum stock level')
      } else if (asset.currentQuantity <= 10) {
        stockStatus = 'low'
        riskLevel = 'medium'
        recommendations.push('Low stock level - plan for reorder')
        recommendations.push('Monitor usage patterns')
      } else {
        stockStatus = 'healthy'
        riskLevel = 'low'
        recommendations.push('Stock level is healthy')
      }

      return {
        asset,
        stockStatus,
        recommendations,
        riskLevel
      }
    })
  }

  async getValidUnitMeasures(): Promise<ApiResponse<string[]>> {
    return this.createSuccessResponse(VALID_UNIT_MEASURES)
  }
}