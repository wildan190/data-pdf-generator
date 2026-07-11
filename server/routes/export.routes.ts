import { Router } from 'express'
import { ExportService } from '../services/export.service'
import type { ExportOptions } from '../services/export.service'

const router = Router()
const exportService = new ExportService()

// Export single report
router.post('/report', async (req, res) => {
  try {
    const { reportType, ...options } = req.body
    
    // Convert date strings to Date objects
    const exportOptions: ExportOptions = {
      ...options,
      dateRange: options.dateRange ? {
        from: new Date(options.dateRange.from),
        to: new Date(options.dateRange.to)
      } : undefined,
      filters: options.filters ? {
        ...options.filters,
        dateFrom: options.filters.dateFrom ? new Date(options.filters.dateFrom) : undefined,
        dateTo: options.filters.dateTo ? new Date(options.filters.dateTo) : undefined
      } : undefined
    }

    const result = await exportService.exportReport(reportType, exportOptions)
    
    if (!result.success || !result.buffer) {
      return res.status(500).json({ success: false, message: result.error || 'Export failed' })
    }

    // Set headers for file download
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.buffer)
    
  } catch (error) {
    console.error('Export report error:', error)
    res.status(500).json({ success: false, message: 'Failed to export report' })
  }
})

// Export multiple reports
router.post('/multiple', async (req, res) => {
  try {
    const { reports, options } = req.body
    
    // Convert date strings to Date objects
    const exportOptions: ExportOptions = {
      ...options,
      dateRange: options.dateRange ? {
        from: new Date(options.dateRange.from),
        to: new Date(options.dateRange.to)
      } : undefined,
      filters: options.filters ? {
        ...options.filters,
        dateFrom: options.filters.dateFrom ? new Date(options.filters.dateFrom) : undefined,
        dateTo: options.filters.dateTo ? new Date(options.filters.dateTo) : undefined
      } : undefined
    }

    const result = await exportService.exportMultipleReports(reports, exportOptions)
    
    if (!result.success || !result.buffer) {
      return res.status(500).json({ success: false, message: result.error || 'Export failed' })
    }

    // Set headers for file download
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.buffer)
    
  } catch (error) {
    console.error('Export multiple reports error:', error)
    res.status(500).json({ success: false, message: 'Failed to export reports' })
  }
})

// Export preview
router.post('/preview', async (req, res) => {
  try {
    // Simple preview - just return count based on report type
    const { reportType } = req.body
    const { getReportRepository } = await import('../repositories')
    const reportRepo = getReportRepository()
    
    let recordCount = 0
    
    switch (reportType) {
      case 'incoming':
        const incoming = await reportRepo.getReportAlatMasuk()
        recordCount = incoming.length
        break
      case 'outgoing':
        const outgoing = await reportRepo.getReportAlatKeluar()
        recordCount = outgoing.length
        break
      case 'investment':
        const investment = await reportRepo.getReportInvestment()
        recordCount = investment.length
        break
    }
    
    res.json({
      success: true,
      recordCount,
      estimatedSize: recordCount * 1024 // Estimate 1KB per record
    })
    
  } catch (error) {
    console.error('Export preview error:', error)
    res.status(500).json({ success: false, message: 'Failed to get export preview' })
  }
})

export default router
