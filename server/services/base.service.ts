import { ValidationError, NotFoundError, ApiResponse, PaginationInfo, PaginationQuery } from '../types'

// Base service interface for common operations
export interface IBaseService<T, CreateData, UpdateData> {
  getById(id: number): Promise<ApiResponse<T>>
  getAll(pagination?: PaginationQuery): Promise<ApiResponse<T[]>>
  create(data: CreateData): Promise<ApiResponse<T>>
  update(id: number, data: UpdateData): Promise<ApiResponse<T>>
  delete(id: number): Promise<ApiResponse<void>>
}

// Base service implementation with common error handling and response formatting
export abstract class BaseService<T, CreateData, UpdateData> 
  implements IBaseService<T, CreateData, UpdateData> {

  abstract getById(id: number): Promise<ApiResponse<T>>
  abstract getAll(pagination?: PaginationQuery): Promise<ApiResponse<T[]>>
  abstract create(data: CreateData): Promise<ApiResponse<T>>
  abstract update(id: number, data: UpdateData): Promise<ApiResponse<T>>
  abstract delete(id: number): Promise<ApiResponse<void>>

  // Helper method to create success response
  protected createSuccessResponse<R>(
    data?: R, 
    message?: string, 
    pagination?: PaginationInfo
  ): ApiResponse<R> {
    return {
      success: true,
      data,
      message,
      pagination
    }
  }

  // Helper method to create error response
  protected createErrorResponse(error: string | Error): ApiResponse<never> {
    const errorMessage = error instanceof Error ? error.message : error
    return {
      success: false,
      error: errorMessage
    }
  }

  // Helper method to handle service operations with error catching
  protected async handleOperation<R>(
    operation: () => Promise<R>
  ): Promise<ApiResponse<R>> {
    try {
      const result = await operation()
      return this.createSuccessResponse(result)
    } catch (error) {
      console.error('Service operation error:', error)
      
      if (error instanceof ValidationError) {
        return this.createErrorResponse(`Validation error: ${error.message}`)
      }
      
      if (error instanceof NotFoundError) {
        return this.createErrorResponse(`Resource not found: ${error.message}`)
      }

      if (error instanceof Error) {
        return this.createErrorResponse(error.message)
      }

      return this.createErrorResponse('An unexpected error occurred')
    }
  }

  // Helper method for operations with pagination
  protected async handlePaginatedOperation<R>(
    operation: () => Promise<R[]>,
    countOperation: () => Promise<number>,
    pagination?: PaginationQuery
  ): Promise<ApiResponse<R[]>> {
    try {
      const [data, total] = await Promise.all([
        operation(),
        countOperation()
      ])

      const paginationInfo = pagination ? {
        page: pagination.page || 1,
        pageSize: pagination.pageSize || 10,
        total,
        totalPages: Math.ceil(total / (pagination.pageSize || 10))
      } : undefined

      return this.createSuccessResponse(data, undefined, paginationInfo)
    } catch (error) {
      console.error('Paginated service operation error:', error)
      return this.createErrorResponse(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }

  // Validation helpers
  protected validateId(id: number): void {
    if (!id || isNaN(id) || id <= 0) {
      throw new ValidationError('Invalid ID provided', 'id')
    }
  }

  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName)
    }
  }

  protected validateString(value: string, fieldName: string, minLength = 1, maxLength = 255): void {
    this.validateRequired(value, fieldName)
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, fieldName)
    }
    if (value.trim().length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName)
    }
    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} must be at most ${maxLength} characters long`, fieldName)
    }
  }

  protected validateNumber(value: number, fieldName: string, min = 0, max?: number): void {
    this.validateRequired(value, fieldName)
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`, fieldName)
    }
    if (value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName)
    }
    if (max !== undefined && value > max) {
      throw new ValidationError(`${fieldName} must be at most ${max}`, fieldName)
    }
  }

  protected validateEnum<T extends string>(
    value: T, 
    fieldName: string, 
    validValues: T[]
  ): void {
    this.validateRequired(value, fieldName)
    if (!validValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${validValues.join(', ')}`, 
        fieldName
      )
    }
  }

  protected sanitizeString(value: string): string {
    return value.trim().replace(/\s+/g, ' ')
  }
}