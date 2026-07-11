import { Router } from 'express'
import { getReportService } from '../services'

const router = Router()
const reportService = getReportService()

// Get alat masuk report
router.get('/alat-masuk', async (req, res) => {
  try {
    const filters = req.query
    const report = await reportService.getReportAlatMasuk(filters as any)
    res.json(report)
  } catch (error) {
    console.error('Get alat masuk report error:', error)
    res.status(500).json({ success: false, message: 'Failed to get alat masuk report' })
  }
})

// Get alat keluar report
router.get('/alat-keluar', async (req, res) => {
  try {
    const filters = req.query
    const report = await reportService.getReportAlatKeluar(filters as any)
    res.json(report)
  } catch (error) {
    console.error('Get alat keluar report error:', error)
    res.status(500).json({ success: false, message: 'Failed to get alat keluar report' })
  }
})

// Get investment report
router.get('/investment', async (req, res) => {
  try {
    const report = await reportService.getReportInvestment()
    res.json(report)
  } catch (error) {
    console.error('Get investment report error:', error)
    res.status(500).json({ success: false, message: 'Failed to get investment report' })
  }
})

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await reportService.getDashboardStats()
    res.json(stats)
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ success: false, message: 'Failed to get dashboard stats' })
  }
})

export default router
