import { Router } from 'express'
import { getDivisionService } from '../services'

const router = Router()
const divisionService = getDivisionService()

// Get all divisions
router.get('/', async (req, res) => {
  try {
    const result = await divisionService.getAll()
    res.json(result)
  } catch (error) {
    console.error('Get divisions error:', error)
    res.status(500).json({ success: false, message: 'Failed to get divisions' })
  }
})

// Get division by id
router.get('/:id', async (req, res) => {
  try {
    const result = await divisionService.getById(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Get division error:', error)
    res.status(500).json({ success: false, message: 'Failed to get division' })
  }
})

// Create division
router.post('/', async (req, res) => {
  try {
    const result = await divisionService.create(req.body)
    res.status(201).json(result)
  } catch (error) {
    console.error('Create division error:', error)
    res.status(500).json({ success: false, message: 'Failed to create division' })
  }
})

// Update division
router.put('/:id', async (req, res) => {
  try {
    const result = await divisionService.update(Number(req.params.id), req.body)
    res.json(result)
  } catch (error) {
    console.error('Update division error:', error)
    res.status(500).json({ success: false, message: 'Failed to update division' })
  }
})

// Delete division
router.delete('/:id', async (req, res) => {
  try {
    const result = await divisionService.delete(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Delete division error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete division' })
  }
})

export default router
