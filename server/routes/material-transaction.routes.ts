import { Router } from 'express'
import { getMaterialTransactionService } from '../services'

const router = Router()
const materialTransactionService = getMaterialTransactionService()

// Get all material transactions
router.get('/', async (req, res) => {
  try {
    const result = await materialTransactionService.getAllWithRelations()
    res.json(result)
  } catch (error) {
    console.error('Get material transactions error:', error)
    res.status(500).json({ success: false, message: 'Failed to get material transactions' })
  }
})

// Get material transaction by id
router.get('/:id', async (req, res) => {
  try {
    const result = await materialTransactionService.getByIdWithRelations(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Get material transaction error:', error)
    res.status(500).json({ success: false, message: 'Failed to get material transaction' })
  }
})

// Create material transaction
router.post('/', async (req, res) => {
  try {
    const result = await materialTransactionService.create(req.body)
    res.status(201).json(result)
  } catch (error) {
    console.error('Create material transaction error:', error)
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to create material transaction' })
  }
})

// Delete material transaction
router.delete('/:id', async (req, res) => {
  try {
    const result = await materialTransactionService.delete(Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Delete material transaction error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete material transaction' })
  }
})

export default router
