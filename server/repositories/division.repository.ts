import { Division, Prisma } from '@prisma/client'
import { BaseRepository } from './base.repository'
import { DivisionWithTransactions, PaginationQuery, NotFoundError } from '../types'

// Division repository interface
export interface IDivisionRepository {
  findById(id: number): Promise<Division | null>
  findByIdWithTransactions(id: number): Promise<DivisionWithTransactions | null>
  findAll(pagination?: PaginationQuery): Promise<Division[]>
  findByName(name: string): Promise<Division | null>
  create(data: Prisma.DivisionCreateInput): Promise<Division>
  update(id: number, data: Prisma.DivisionUpdateInput): Promise<Division>
  delete(id: number): Promise<void>
  count(): Promise<number>
}

// Division repository implementation
export class DivisionRepository 
  extends BaseRepository<Division, Prisma.DivisionCreateInput, Prisma.DivisionUpdateInput> 
  implements IDivisionRepository {

  async findById(id: number): Promise<Division | null> {
    return this.prisma.division.findUnique({
      where: { divisionId: id }
    })
  }

  async findByIdWithTransactions(id: number): Promise<DivisionWithTransactions | null> {
    return this.prisma.division.findUnique({
      where: { divisionId: id },
      include: {
        transactions: {
          include: {
            asset: {
              include: {
                category: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
  }

  async findAll(pagination?: PaginationQuery): Promise<Division[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    return this.prisma.division.findMany({
      skip,
      take,
      orderBy: {
        divisionName: 'asc'
      }
    })
  }

  async findByName(name: string): Promise<Division | null> {
    return this.prisma.division.findUnique({
      where: { divisionName: name }
    })
  }

  async create(data: Prisma.DivisionCreateInput): Promise<Division> {
    // Check if division name already exists
    const existing = await this.findByName(data.divisionName)
    if (existing) {
      throw new Error(`Division with name '${data.divisionName}' already exists`)
    }

    return this.prisma.division.create({
      data
    })
  }

  async update(id: number, data: Prisma.DivisionUpdateInput): Promise<Division> {
    // Check if division exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Division', id)
    }

    // Check for name conflicts if name is being updated
    if (data.divisionName && typeof data.divisionName === 'string') {
      const nameConflict = await this.findByName(data.divisionName)
      if (nameConflict && nameConflict.divisionId !== id) {
        throw new Error(`Division with name '${data.divisionName}' already exists`)
      }
    }

    return this.prisma.division.update({
      where: { divisionId: id },
      data
    })
  }

  async delete(id: number): Promise<void> {
    // Check if division exists
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Division', id)
    }

    // Check if division has associated transactions
    const transactionCount = await this.prisma.materialTransaction.count({
      where: { divisionId: id }
    })

    if (transactionCount > 0) {
      throw new Error(`Cannot delete division '${existing.divisionName}' because it has ${transactionCount} associated transactions`)
    }

    await this.prisma.division.delete({
      where: { divisionId: id }
    })
  }

  async count(): Promise<number> {
    return this.prisma.division.count()
  }

  // Additional methods specific to Division
  async findDivisionsWithTransactionStats(): Promise<Array<Division & { transactionCount: number }>> {
    const divisions = await this.prisma.division.findMany({
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        divisionName: 'asc'
      }
    })

    return divisions.map(division => ({
      divisionId: division.divisionId,
      divisionName: division.divisionName,
      createdAt: division.createdAt,
      transactionCount: division._count.transactions
    }))
  }

  async searchByName(query: string): Promise<Division[]> {
    return this.prisma.division.findMany({
      where: {
        divisionName: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: {
        divisionName: 'asc'
      }
    })
  }
}