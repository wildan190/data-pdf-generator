import { prisma } from '../lib/database'
import { 
  ReportAlartMasuk, 
  ReportAlartKeluar, 
  ReportInvestment,
  MaterialTransactionFilters,
  PaginationQuery 
} from '../types'

// Report repository for specialized queries
export class ReportRepository {
  private prisma = prisma

  // Helper method for pagination
  private calculatePagination(page: number = 1, pageSize: number = 50) {
    const normalizedPage = Math.max(1, page)
    const normalizedPageSize = Math.min(Math.max(1, pageSize), 1000) // Max 1000 items for reports
    
    return {
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize
    }
  }

  // Report: Alat Masuk (Incoming Materials)
  async getReportAlatMasuk(
    filters?: MaterialTransactionFilters,
    pagination?: PaginationQuery
  ): Promise<ReportAlartMasuk[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    const where: any = {
      transactionType: 'masuk'
    }

    if (filters) {
      if (filters.priorityStatus) where.priorityStatus = filters.priorityStatus
      if (filters.divisionId) where.divisionId = filters.divisionId
      if (filters.assetId) where.assetId = filters.assetId
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
        if (filters.dateTo) where.createdAt.lte = filters.dateTo
      }
    }

    const transactions = await this.prisma.materialTransaction.findMany({
      where,
      skip,
      take,
      include: {
        asset: true,
        division: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return transactions.map(t => ({
      transactionId: t.transactionId,
      jenisMaterial: t.asset.materialName,
      kuantitas: t.quantity,
      divisi: t.division.divisionName,
      status: t.priorityStatus,
      tanggalMasuk: t.createdAt,
      catatan: t.notes || undefined
    }))
  }

  // Report: Alat Keluar (Outgoing Materials)
  async getReportAlatKeluar(
    filters?: MaterialTransactionFilters,
    pagination?: PaginationQuery
  ): Promise<ReportAlartKeluar[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    const where: any = {
      transactionType: 'keluar'
    }

    if (filters) {
      if (filters.priorityStatus) where.priorityStatus = filters.priorityStatus
      if (filters.divisionId) where.divisionId = filters.divisionId
      if (filters.assetId) where.assetId = filters.assetId
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
        if (filters.dateTo) where.createdAt.lte = filters.dateTo
      }
    }

    const transactions = await this.prisma.materialTransaction.findMany({
      where,
      skip,
      take,
      include: {
        asset: true,
        division: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return transactions.map(t => ({
      transactionId: t.transactionId,
      jenisMaterial: t.asset.materialName,
      kuantitas: t.quantity,
      divisi: t.division.divisionName,
      status: t.priorityStatus,
      tanggalKeluar: t.createdAt,
      catatan: t.notes || undefined
    }))
  }

  // Report: Investment (Current Stock Balance)
  async getReportInvestment(pagination?: PaginationQuery): Promise<ReportInvestment[]> {
    const { skip, take } = pagination 
      ? this.calculatePagination(pagination.page, pagination.pageSize)
      : { skip: undefined, take: undefined }

    const assets = await this.prisma.inventoryAsset.findMany({
      skip,
      take,
      include: {
        category: true
      },
      orderBy: {
        materialName: 'asc'
      }
    })

    const result: ReportInvestment[] = []

    for (const asset of assets) {
      // Calculate total incoming
      const totalMasuk = await this.prisma.materialTransaction.aggregate({
        where: {
          assetId: asset.assetId,
          transactionType: 'masuk'
        },
        _sum: {
          quantity: true
        }
      })

      // Calculate total outgoing
      const totalKeluar = await this.prisma.materialTransaction.aggregate({
        where: {
          assetId: asset.assetId,
          transactionType: 'keluar'
        },
        _sum: {
          quantity: true
        }
      })

      result.push({
        assetId: asset.assetId,
        categoryName: asset.category?.categoryName || 'Uncategorized',
        materialName: asset.materialName,
        totalAlatMasuk: totalMasuk._sum.quantity || 0,
        totalAlatKeluar: totalKeluar._sum.quantity || 0,
        netInvestmentStok: asset.currentQuantity,
        pembaruanTerakhir: asset.lastUpdatedAt
      })
    }

    return result
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<{
    totalAssets: number
    totalTransactions: number
    totalIncoming: number
    totalOutgoing: number
    lowStockAlerts: number
    urgentTransactions: number
    recentActivityCount: number
  }> {
    const [
      totalAssets,
      totalTransactions,
      totalIncoming,
      totalOutgoing,
      lowStockAlerts,
      urgentTransactions,
      recentActivity
    ] = await Promise.all([
      this.prisma.inventoryAsset.count(),
      this.prisma.materialTransaction.count(),
      this.prisma.materialTransaction.count({
        where: { transactionType: 'masuk' }
      }),
      this.prisma.materialTransaction.count({
        where: { transactionType: 'keluar' }
      }),
      this.prisma.inventoryAsset.count({
        where: { currentQuantity: { lte: 10 } }
      }),
      this.prisma.materialTransaction.count({
        where: { priorityStatus: 'urgen' }
      }),
      this.prisma.materialTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ])

    return {
      totalAssets,
      totalTransactions,
      totalIncoming,
      totalOutgoing,
      lowStockAlerts,
      urgentTransactions,
      recentActivityCount: recentActivity
    }
  }

  // Monthly Transaction Summary
  async getMonthlyTransactionSummary(year: number, month: number): Promise<{
    totalIncoming: number
    totalOutgoing: number
    netChange: number
    transactionCount: number
    byPriority: {
      prioritas: number
      urgen: number
      trivial: number
    }
    byDivision: Array<{
      divisionName: string
      count: number
    }>
  }> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const [
      incoming,
      outgoing,
      transactionCount,
      priorityBreakdown,
      divisionBreakdown
    ] = await Promise.all([
      this.prisma.materialTransaction.aggregate({
        where: {
          transactionType: 'masuk',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { quantity: true }
      }),
      this.prisma.materialTransaction.aggregate({
        where: {
          transactionType: 'keluar',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { quantity: true }
      }),
      this.prisma.materialTransaction.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.materialTransaction.groupBy({
        by: ['priorityStatus'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true
      }),
      this.prisma.materialTransaction.groupBy({
        by: ['divisionId'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: true,
        include: {
          division: {
            select: {
              divisionName: true
            }
          }
        }
      })
    ])

    const totalIncoming = incoming._sum.quantity || 0
    const totalOutgoing = outgoing._sum.quantity || 0

    // Process priority breakdown
    const byPriority = {
      prioritas: 0,
      urgen: 0,
      trivial: 0
    }
    priorityBreakdown.forEach(item => {
      byPriority[item.priorityStatus] = item._count
    })

    // Process division breakdown - need to resolve division names
    const byDivision = await Promise.all(
      divisionBreakdown.map(async item => {
        const division = await this.prisma.division.findUnique({
          where: { divisionId: item.divisionId }
        })
        return {
          divisionName: division?.divisionName || 'Unknown',
          count: item._count
        }
      })
    )

    return {
      totalIncoming,
      totalOutgoing,
      netChange: totalIncoming - totalOutgoing,
      transactionCount,
      byPriority,
      byDivision
    }
  }

  // Stock Movement Analysis
  async getStockMovementAnalysis(assetId: number, days: number = 30): Promise<{
    assetName: string
    startingQuantity: number
    currentQuantity: number
    totalIncoming: number
    totalOutgoing: number
    netChange: number
    transactions: Array<{
      date: Date
      type: 'masuk' | 'keluar'
      quantity: number
      division: string
      runningBalance: number
    }>
  }> {
    const asset = await this.prisma.inventoryAsset.findUnique({
      where: { assetId },
      include: { category: true }
    })

    if (!asset) {
      throw new Error(`Asset with id ${assetId} not found`)
    }

    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const transactions = await this.prisma.materialTransaction.findMany({
      where: {
        assetId,
        createdAt: { gte: fromDate }
      },
      include: {
        division: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const [totalIncoming, totalOutgoing] = await Promise.all([
      this.prisma.materialTransaction.aggregate({
        where: {
          assetId,
          transactionType: 'masuk',
          createdAt: { gte: fromDate }
        },
        _sum: { quantity: true }
      }),
      this.prisma.materialTransaction.aggregate({
        where: {
          assetId,
          transactionType: 'keluar',
          createdAt: { gte: fromDate }
        },
        _sum: { quantity: true }
      })
    ])

    const incomingSum = totalIncoming._sum.quantity || 0
    const outgoingSum = totalOutgoing._sum.quantity || 0
    const startingQuantity = asset.currentQuantity - (incomingSum - outgoingSum)

    // Calculate running balance for each transaction
    let runningBalance = startingQuantity
    const transactionHistory = transactions.map(t => {
      const change = t.transactionType === 'masuk' ? t.quantity : -t.quantity
      runningBalance += change
      
      return {
        date: t.createdAt,
        type: t.transactionType,
        quantity: t.quantity,
        division: t.division.divisionName,
        runningBalance
      }
    })

    return {
      assetName: asset.materialName,
      startingQuantity,
      currentQuantity: asset.currentQuantity,
      totalIncoming: incomingSum,
      totalOutgoing: outgoingSum,
      netChange: incomingSum - outgoingSum,
      transactions: transactionHistory
    }
  }
}