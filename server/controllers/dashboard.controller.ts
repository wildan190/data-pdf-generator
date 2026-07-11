import { Request, Response } from 'express'
import { DashboardService } from '../services/dashboard.service'

const dashboardService = new DashboardService()

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getStats()
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    })
  }
}

export const getRecentTransactions = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5
    const transactions = await dashboardService.getRecentTransactions(limit)
    res.json({
      success: true,
      data: transactions
    })
  } catch (error) {
    console.error('Error fetching recent transactions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent transactions'
    })
  }
}

export const getLowStockAssets = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5
    const assets = await dashboardService.getLowStockAssets(limit)
    res.json({
      success: true,
      data: assets
    })
  } catch (error) {
    console.error('Error fetching low stock assets:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock assets'
    })
  }
}

export const getUrgentTransactions = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5
    const transactions = await dashboardService.getUrgentTransactions(limit)
    res.json({
      success: true,
      data: transactions
    })
  } catch (error) {
    console.error('Error fetching urgent transactions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch urgent transactions'
    })
  }
}

export const getHealthCheck = async (req: Request, res: Response) => {
  try {
    const health = await dashboardService.getHealthCheck()
    res.json({
      success: true,
      data: health
    })
  } catch (error) {
    console.error('Error performing health check:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to perform health check'
    })
  }
}
