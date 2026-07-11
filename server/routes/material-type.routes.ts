import { Router } from 'express'
import { getMaterialTypeService } from '../services'

const router = Router()
const materialTypeService = getMaterialTypeService()

// Get all material types with stats
router.get('/stats', async (req, res) => {
  try {
    const result = await materialTypeService.getTypesWithStats()
    res.json(result)
  } catch (error) {
    console.error('Get material types with stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to get material types with stats' })
  }
})

// Get all material types
router.get('/', async (req, res) => {
  try {
    const result = await materialTypeService.getAll()
    res.json(result)
  } catch (error) {
    console.error('Get material types error:', error)
    res.status(500).json({ success: false, message: 'Failed to get material types' })
  }
})

// Get material type by id
router.get('/:id', async (req, res) => {
  try {
    const result = await materialTypeService.getById(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Get material type error:', error)
    res.status(500).json({ success: false, message: 'Failed to get material type' })
  }
})

// Create material type
router.post('/', async (req, res) => {
  try {
    const result = await materialTypeService.create(req.body)
    res.status(201).json(result)
  } catch (error) {
    console.error('Create material type error:', error)
    res.status(500).json({ success: false, message: 'Failed to create material type' })
  }
})

// Update material type
router.put('/:id', async (req, res) => {
  try {
    const result = await materialTypeService.update(Number(req.params.id), req.body)
    res.json(result)
  } catch (error) {
    console.error('Update material type error:', error)
    res.status(500).json({ success: false, message: 'Failed to update material type' })
  }
})

// Delete material type
router.delete('/:id', async (req, res) => {
  try {
    const result = await materialTypeService.delete(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Delete material type error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete material type' })
  }
})

export default router
