import { Division, Prisma } from '@prisma/client'
import { BaseService } from './base.service'
import { getDivisionRepository } from '../repositories'
import { 
  ApiResponse, 
  PaginationQuery, 
  DivisionWithTransactions,
  ValidationError 
} from '../types'

// Division service interface
export interface IDivisionService {
  getById(id: number): Promise<ApiResponse<Division>>
  getByIdWithTransactions(id: number): Promise<ApiResponse<DivisionWithTransactions>>
  getAll(pagination?: PaginationQuery): Promise<ApiResponse<Division[]>>
  getByName(name: string): Promise<ApiResponse<Division | null>>
  create(data: CreateDivisionData): Promise<ApiResponse<Division>>
  update(id: number, data: UpdateDivisionData): Promise<ApiResponse<Division>>
  delete(id: number): Promise<ApiResponse<void>>
  getDivisionsWithStats(): Promise<ApiResponse<Array<Division & { transactionCount: number }>>>
  searchByName(query: string): Promise<ApiResponse<Division[]>>
}

// DTOs for Division service
export interface CreateDivisionData {
  divisionName: string
}

export interface UpdateDivisionData {
  divisionName?: string
}

// Division service implementation
export class DivisionService 
  extends BaseService<Division, CreateDivisionData, UpdateDivisionData> 
  implements IDivisionService {

  private divisionRepository = getDivisionRepository()

  async getById(id: number): Promise<ApiResponse<Division>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const division = await this.divisionRepository.findById(id)
      if (!division) {
        throw new Error(`Division with id ${id} not found`)
      }
      
      return division
    })
  }

  async getByIdWithTransactions(id: number): Promise<ApiResponse<DivisionWithTransactions>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const division = await this.divisionRepository.findByIdWithTransactions(id)
      if (!division) {
        throw new Error(`Division with id ${id} not found`)
      }
      
      return division
    })
  }

  async getAll(pagination?: PaginationQuery): Promise<ApiResponse<Division[]>> {
    return this.handlePaginatedOperation(
      () => this.divisionRepository.findAll(pagination),
      () => this.divisionRepository.count(),
      pagination
    )
  }

  async getByName(name: string): Promise<ApiResponse<Division | null>> {
    return this.handleOperation(async () => {
      this.validateString(name, 'divisionName')
      return this.divisionRepository.findByName(name)
    })
  }

  async create(data: CreateDivisionData): Promise<ApiResponse<Division>> {
    return this.handleOperation(async () => {
      // Validate input data
      this.validateCreateData(data)

      // Sanitize input
      const sanitizedData: Prisma.DivisionCreateInput = {
        divisionName: this.sanitizeString(data.divisionName)
      }

      // Business rule: Division names must be unique (handled by repository)
      const division = await this.divisionRepository.create(sanitizedData)
      
      return division
    })
  }

  async update(id: number, data: UpdateDivisionData): Promise<ApiResponse<Division>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      this.validateUpdateData(data)

      // Prepare update data
      const updateData: Prisma.DivisionUpdateInput = {}
      
      if (data.divisionName !== undefined) {
        updateData.divisionName = this.sanitizeString(data.divisionName)
      }

      const division = await this.divisionRepository.update(id, updateData)
      
      return division
    })
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      // Business rule: Cannot delete division with active transactions (handled by repository)
      await this.divisionRepository.delete(id)
      
      return undefined
    })
  }

  async getDivisionsWithStats(): Promise<ApiResponse<Array<Division & { transactionCount: number }>>> {
    return this.handleOperation(async () => {
      return this.divisionRepository.findDivisionsWithTransactionStats()
    })
  }

  async searchByName(query: string): Promise<ApiResponse<Division[]>> {
    return this.handleOperation(async () => {
      this.validateString(query, 'query', 1, 100)
      return this.divisionRepository.searchByName(query)
    })
  }

  // Private validation methods
  private validateCreateData(data: CreateDivisionData): void {
    if (!data) {
      throw new ValidationError('Division data is required')
    }

    this.validateString(data.divisionName, 'divisionName', 2, 100)

    // Business rule: Division name should not contain special characters except spaces and hyphens
    const namePattern = /^[a-zA-Z0-9\s\-]+$/
    if (!namePattern.test(data.divisionName)) {
      throw new ValidationError(
        'Division name can only contain letters, numbers, spaces, and hyphens',
        'divisionName'
      )
    }
  }

  private validateUpdateData(data: UpdateDivisionData): void {
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided for update')
    }

    if (data.divisionName !== undefined) {
      this.validateString(data.divisionName, 'divisionName', 2, 100)
      
      const namePattern = /^[a-zA-Z0-9\s\-]+$/
      if (!namePattern.test(data.divisionName)) {
        throw new ValidationError(
          'Division name can only contain letters, numbers, spaces, and hyphens',
          'divisionName'
        )
      }
    }
  }

  // Business logic methods
  async canDeleteDivision(id: number): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      this.validateId(id)
      
      const division = await this.divisionRepository.findByIdWithTransactions(id)
      if (!division) {
        return { canDelete: false, reason: 'Division not found' }
      }

      if (division.transactions.length > 0) {
        return { 
          canDelete: false, 
          reason: `Division has ${division.transactions.length} associated transactions` 
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

  async getDivisionUsageReport(id: number): Promise<ApiResponse<{
    division: Division
    transactionCount: number
    lastActivity?: Date
    mostUsedMaterials: Array<{
      materialName: string
      transactionCount: number
    }>
  }>> {
    return this.handleOperation(async () => {
      this.validateId(id)
      
      const divisionWithTransactions = await this.divisionRepository.findByIdWithTransactions(id)
      if (!divisionWithTransactions) {
        throw new Error(`Division with id ${id} not found`)
      }

      const transactions = divisionWithTransactions.transactions
      const lastActivity = transactions.length > 0 
        ? new Date(Math.max(...transactions.map(t => t.createdAt.getTime())))
        : undefined

      // Group transactions by material to find most used materials
      const materialUsage = new Map<string, number>()
      transactions.forEach(transaction => {
        const materialName = transaction.asset.materialName
        materialUsage.set(materialName, (materialUsage.get(materialName) || 0) + 1)
      })

      const mostUsedMaterials = Array.from(materialUsage.entries())
        .map(([materialName, count]) => ({ materialName, transactionCount: count }))
        .sort((a, b) => b.transactionCount - a.transactionCount)
        .slice(0, 10) // Top 10 most used materials

      return {
        division: {
          divisionId: divisionWithTransactions.divisionId,
          divisionName: divisionWithTransactions.divisionName,
          createdAt: divisionWithTransactions.createdAt
        },
        transactionCount: transactions.length,
        lastActivity,
        mostUsedMaterials
      }
    })
  }
}