import { Router } from 'express'
import { getInventoryAssetService } from '../services'

const router = Router()
const inventoryAssetService = getInventoryAssetService()

// Get all inventory assets with category
router.get('/', async (req, res) => {
  try {
    const pagination = {
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 100
    }
    const result = await inventoryAssetService.getAllWithCategory(pagination)
    res.json(result)
  } catch (error) {
    console.error('Get inventory assets error:', error)
    res.status(500).json({ success: false, message: 'Failed to get inventory assets' })
  }
})

// Get all inventory assets with stats (including transaction counts)
router.get('/with-stats', async (req, res) => {
  try {
    const result = await inventoryAssetService.getAllWithStats()
    res.json(result)
  } catch (error) {
    console.error('Get inventory assets with stats error:', error)
    res.status(500).json({ success: false, message: 'Failed to get inventory assets with stats' })
  }
})

// Get inventory asset by id with category
router.get('/:id', async (req, res) => {
  try {
    const result = await inventoryAssetService.getByIdWithCategory(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Get inventory asset error:', error)
    res.status(500).json({ success: false, message: 'Failed to get inventory asset' })
  }
})

// Get inventory asset by id with relations
router.get('/:id/relations', async (req, res) => {
  try {
    const result = await inventoryAssetService.getByIdWithRelations(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Get inventory asset relations error:', error)
    res.status(500).json({ success: false, message: 'Failed to get inventory asset relations' })
  }
})

// Check if asset can be deleted
router.get('/:id/can-delete', async (req, res) => {
  try {
    const result = await inventoryAssetService.canDeleteAsset(Number(req.params.id))
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Check can delete asset error:', error)
    res.status(500).json({ success: false, message: 'Failed to check deletion status' })
  }
})

// Get asset health check
router.get('/:id/health-check', async (req, res) => {
  try {
    const result = await inventoryAssetService.getAssetHealthCheck(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Get asset health check error:', error)
    res.status(500).json({ success: false, message: 'Failed to get asset health check' })
  }
})

// Get low stock assets
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10
    const result = await inventoryAssetService.getLowStockAssets(threshold)
    res.json(result)
  } catch (error) {
    console.error('Get low stock assets error:', error)
    res.status(500).json({ success: false, message: 'Failed to get low stock assets' })
  }
})

// Get zero stock assets
router.get('/zero-stock', async (req, res) => {
  try {
    const result = await inventoryAssetService.getZeroStockAssets()
    res.json(result)
  } catch (error) {
    console.error('Get zero stock assets error:', error)
    res.status(500).json({ success: false, message: 'Failed to get zero stock assets' })
  }
})

// Get most active assets
router.get('/most-active', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10
    const result = await inventoryAssetService.getMostActiveAssets(limit)
    res.json(result)
  } catch (error) {
    console.error('Get most active assets error:', error)
    res.status(500).json({ success: false, message: 'Failed to get most active assets' })
  }
})

// Get stock summary
router.get('/stock-summary', async (req, res) => {
  try {
    const result = await inventoryAssetService.getStockSummary()
    res.json(result)
  } catch (error) {
    console.error('Get stock summary error:', error)
    res.status(500).json({ success: false, message: 'Failed to get stock summary' })
  }
})

// Search assets by name
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q as string || ''
    const result = await inventoryAssetService.searchByName(q)
    res.json(result)
  } catch (error) {
    console.error('Search assets error:', error)
    res.status(500).json({ success: false, message: 'Failed to search assets' })
  }
})

// Create inventory asset
router.post('/', async (req, res) => {
  try {
    const result = await inventoryAssetService.create(req.body)
    res.status(201).json(result)
  } catch (error) {
    console.error('Create inventory asset error:', error)
    res.status(500).json({ success: false, message: 'Failed to create inventory asset' })
  }
})

// Update inventory asset
router.put('/:id', async (req, res) => {
  try {
    const result = await inventoryAssetService.update(Number(req.params.id), req.body)
    res.json(result)
  } catch (error) {
    console.error('Update inventory asset error:', error)
    res.status(500).json({ success: false, message: 'Failed to update inventory asset' })
  }
})

// Delete inventory asset
router.delete('/:id', async (req, res) => {
  try {
    const result = await inventoryAssetService.delete(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Delete inventory asset error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete inventory asset' })
  }
})

export default router
