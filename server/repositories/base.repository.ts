import { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/database'
import { PaginationQuery, PaginationInfo } from '../types'

// Base repository interface for common CRUD operations
export interface IBaseRepository<T, CreateData, UpdateData> {
  findById(id: number): Promise<T | null>
  findAll(pagination?: PaginationQuery): Promise<T[]>
  create(data: CreateData): Promise<T>
  update(id: number, data: UpdateData): Promise<T>
  delete(id: number): Promise<void>
  count(): Promise<number>
}

// Base repository implementation
export abstract class BaseRepository<T, CreateData, UpdateData> 
  implements IBaseRepository<T, CreateData, UpdateData> {
  
  protected prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  abstract findById(id: number): Promise<T | null>
  abstract findAll(pagination?: PaginationQuery): Promise<T[]>
  abstract create(data: CreateData): Promise<T>
  abstract update(id: number, data: UpdateData): Promise<T>
  abstract delete(id: number): Promise<void>
  abstract count(): Promise<number>

  // Helper method to calculate pagination
  protected calculatePagination(
    page: number = 1, 
    pageSize: number = 10
  ): { skip: number; take: number } {
    const normalizedPage = Math.max(1, page)
    const normalizedPageSize = Math.min(Math.max(1, pageSize), 100) // Max 100 items per page
    
    return {
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize
    }
  }

  // Helper method to create pagination info
  protected createPaginationInfo(
    page: number,
    pageSize: number,
    total: number
  ): PaginationInfo {
    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  // Transaction helper
  protected async withTransaction<R>(
    fn: (tx: PrismaClient) => Promise<R>
  ): Promise<R> {
    return this.prisma.$transaction(fn)
  }
}