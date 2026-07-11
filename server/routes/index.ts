import { Router } from 'express'
import divisionRoutes from './division.routes'
import materialTypeRoutes from './material-type.routes'
import inventoryAssetRoutes from './inventory-asset.routes'
import materialTransactionRoutes from './material-transaction.routes'
import reportRoutes from './report.routes'
import exportRoutes from './export.routes'

const router = Router()

router.use('/divisions', divisionRoutes)
router.use('/material-types', materialTypeRoutes)
router.use('/inventory-assets', inventoryAssetRoutes)
router.use('/material-transactions', materialTransactionRoutes)
router.use('/reports', reportRoutes)
router.use('/export', exportRoutes)

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
})

export default router
