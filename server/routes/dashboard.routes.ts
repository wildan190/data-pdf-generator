import express from 'express'
import {
  getDashboardStats,
  getRecentTransactions,
  getLowStockAssets,
  getUrgentTransactions,
  getHealthCheck
} from '../controllers/dashboard.controller'

const router = express.Router()

router.get('/stats', getDashboardStats)
router.get('/recent-transactions', getRecentTransactions)
router.get('/low-stock', getLowStockAssets)
router.get('/urgent-transactions', getUrgentTransactions)
router.get('/health-check', getHealthCheck)

export default router
