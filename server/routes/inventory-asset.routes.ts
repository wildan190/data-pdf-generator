import { Router } from 'express'
import { getInventoryAssetService } from '../services'

const router = Router()
const inventoryAssetService = getInventoryAssetService()

// Get all inventory assets
router.get('/', async (req, res) => {
  try {
    const result = await inventoryAssetService.getAll()
    res.json(result)
  } catch (error) {
    console.error('Get inventory assets error:', error)
    res.status(500).json({ success: false, message: 'Failed to get inventory assets' })
  }
})

// Get inventory asset by id
router.get('/:id', async (req, res) => {
  try {
    const result = await inventoryAssetService.getById(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Get inventory asset error:', error)
    res.status(500).json({ success: false, message: 'Failed to get inventory asset' })
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
