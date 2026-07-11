import { Router } from 'express'
import { getReportService } from '../services'

const router = Router()
const reportService = getReportService()

// Helper to convert query params to Date objects if needed
const parseDateParams = (query: any) => {
  const parsed: any = { ...query }
  if (parsed.dateFrom) {
    parsed.dateFrom = new Date(parsed.dateFrom)
  }
  if (parsed.dateTo) {
    parsed.dateTo = new Date(parsed.dateTo)
  }
  if (parsed.divisionId) {
    parsed.divisionId = Number(parsed.divisionId)
  }
  if (parsed.assetId) {
    parsed.assetId = Number(parsed.assetId)
  }
  if (parsed.page) {
    parsed.page = Number(parsed.page)
  }
  if (parsed.pageSize) {
    parsed.pageSize = Number(parsed.pageSize)
  }
  return parsed
}

// Get alat masuk report (aliases for incoming)
router.get(['/alat-masuk', '/incoming'], async (req, res) => {
  try {
    const filters = parseDateParams(req.query)
    const report = await reportService.getReportAlatMasuk(filters)
    res.json(report)
  } catch (error) {
    console.error('Get alat masuk report error:', error)
    res.status(500).json({ success: false, message: 'Failed to get alat masuk report' })
  }
})

// Get alat keluar report (aliases for outgoing)
router.get(['/alat-keluar', '/outgoing'], async (req, res) => {
  try {
    const filters = parseDateParams(req.query)
    const report = await reportService.getReportAlatKeluar(filters)
    res.json(report)
  } catch (error) {
    console.error('Get alat keluar report error:', error)
    res.status(500).json({ success: false, message: 'Failed to get alat keluar report' })
  }
})

// Get investment report
router.get('/investment', async (req, res) => {
  try {
    const pagination = parseDateParams(req.query)
    const report = await reportService.getReportInvestment(pagination)
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

// Get monthly transaction summary
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const year = Number(req.params.year)
    const month = Number(req.params.month)
    const summary = await reportService.getMonthlyTransactionSummary(year, month)
    res.json(summary)
  } catch (error) {
    console.error('Get monthly summary error:', error)
    res.status(500).json({ success: false, message: 'Failed to get monthly summary' })
  }
})

// Get stock movement analysis
router.get('/stock-movement/:assetId', async (req, res) => {
  try {
    const assetId = Number(req.params.assetId)
    const days = req.query.days ? Number(req.query.days) : 30
    const analysis = await reportService.getStockMovementAnalysis(assetId, days)
    res.json(analysis)
  } catch (error) {
    console.error('Get stock movement error:', error)
    res.status(500).json({ success: false, message: 'Failed to get stock movement' })
  }
})

// Generate comprehensive report
router.post('/comprehensive', async (req, res) => {
  try {
    const filters = parseDateParams(req.body)
    const report = await reportService.generateComprehensiveReport(filters)
    res.json(report)
  } catch (error) {
    console.error('Generate comprehensive report error:', error)
    res.status(500).json({ success: false, message: 'Failed to generate comprehensive report' })
  }
})

// Get report data for export
router.get('/:type/export-data', async (req, res) => {
  try {
    const type = req.params.type as 'incoming' | 'outgoing' | 'investment'
    const filters = parseDateParams(req.query)
    const data = await reportService.getReportForExport(type, filters)
    res.json(data)
  } catch (error) {
    console.error('Get export data error:', error)
    res.status(500).json({ success: false, message: 'Failed to get export data' })
  }
})

export default router
