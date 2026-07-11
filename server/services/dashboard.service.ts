import { prisma } from '../lib/database'

export class DashboardService {
  async getStats() {
    const [
      totalAssets,
      totalTransactions,
      urgentTransactions,
      recentActivityCount,
      totalIncoming,
      totalOutgoing
    ] = await Promise.all([
      prisma.inventoryAsset.count(),
      prisma.materialTransaction.count(),
      prisma.materialTransaction.count({
        where: {
          priorityStatus: {
            in: ['prioritas', 'urgen']
          }
        }
      }),
      prisma.materialTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.materialTransaction.count({
        where: {
          transactionType: 'masuk'
        }
      }),
      prisma.materialTransaction.count({
        where: {
          transactionType: 'keluar'
        }
      })
    ])

    return {
      totalAssets,
      totalTransactions,
      lowStockAlerts: 0,
      urgentTransactions,
      recentActivityCount,
      totalIncoming,
      totalOutgoing
    }
  }

  async getRecentTransactions(limit = 5) {
    return prisma.materialTransaction.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        asset: true,
        division: true
      }
    })
  }

  async getLowStockAssets(limit = 5) {
    return prisma.inventoryAsset.findMany({
      take: limit,
      orderBy: {
        currentQuantity: 'asc'
      },
      include: {
        category: true
      }
    })
  }

  async getUrgentTransactions(limit = 5) {
    return prisma.materialTransaction.findMany({
      where: {
        priorityStatus: {
          in: ['prioritas', 'urgen']
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        asset: true,
        division: true
      }
    })
  }

  async getHealthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`
      return {
        healthy: true,
        message: 'System is healthy'
      }
    } catch (error) {
      return {
        healthy: false,
        message: 'Database connection failed'
      }
    }
  }
}
