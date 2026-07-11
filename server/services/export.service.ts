import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType } from 'docx'
import PDFKit from 'pdfkit'
import { getReportRepository } from '../repositories'
import type { 
  MaterialTransactionFilters,
  ReportAlartMasuk,
  ReportAlartKeluar,
  ReportInvestment,
  ApiResponse 
} from '../types'

// Export formats
export type ExportFormat = 'pdf' | 'excel' | 'word'

// Export options interface
export interface ExportOptions {
  format: ExportFormat
  filename?: string
  title?: string
  subtitle?: string
  includeHeaders?: boolean
  includeTimestamp?: boolean
  filters?: MaterialTransactionFilters
  dateRange?: {
    from: Date
    to: Date
  }
}

// Export data structure
export interface ExportData {
  headers: string[]
  rows: Array<Array<string | number>>
  metadata: {
    title: string
    generatedAt: Date
    totalRecords: number
    filters?: string
  }
}

export class ExportService {
  private reportRepository = getReportRepository()

  // Main export method
  async exportReport(
    reportType: 'incoming' | 'outgoing' | 'investment',
    options: ExportOptions
  ): Promise<{ success: boolean; buffer?: Buffer; filename: string; contentType: string; error?: string }> {
    try {
      // Get data based on report type
      const exportData = await this.prepareExportData(reportType, options)
      
      // Generate file based on format
      let buffer: Buffer
      let contentType: string
      
      switch (options.format) {
        case 'pdf':
          buffer = await this.generatePDF(exportData)
          contentType = 'application/pdf'
          break
          
        case 'excel':
          buffer = this.generateExcel(exportData)
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
          
        case 'word':
          buffer = await this.generateWord(exportData)
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          break
          
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
      
      const filename = this.generateFilename(reportType, options)
      
      return {
        success: true,
        buffer,
        filename,
        contentType
      }
      
    } catch (error) {
      console.error('Export error:', error)
      return {
        success: false,
        filename: '',
        contentType: '',
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  // Prepare data for export
  private async prepareExportData(
    reportType: 'incoming' | 'outgoing' | 'investment',
    options: ExportOptions
  ): Promise<ExportData> {
    let headers: string[]
    let rows: Array<Array<string | number>>
    let title: string
    let data: any[]

    switch (reportType) {
      case 'incoming':
        title = 'Incoming Materials Report'
        headers = ['Transaction ID', 'Material Name', 'Quantity', 'Division', 'Priority', 'Date', 'Notes']
        data = await this.reportRepository.getReportAlatMasuk(options.filters)
        rows = data.map((item: ReportAlartMasuk) => [
          item.transactionId,
          item.jenisMaterial,
          item.kuantitas,
          item.divisi,
          item.status,
          item.tanggalMasuk.toLocaleDateString(),
          item.catatan || ''
        ])
        break

      case 'outgoing':
        title = 'Outgoing Materials Report'
        headers = ['Transaction ID', 'Material Name', 'Quantity', 'Division', 'Priority', 'Date', 'Notes']
        data = await this.reportRepository.getReportAlatKeluar(options.filters)
        rows = data.map((item: ReportAlartKeluar) => [
          item.transactionId,
          item.jenisMaterial,
          item.kuantitas,
          item.divisi,
          item.status,
          item.tanggalKeluar.toLocaleDateString(),
          item.catatan || ''
        ])
        break

      case 'investment':
        title = 'Investment Report'
        headers = ['Asset ID', 'Category', 'Material Name', 'Total Incoming', 'Total Outgoing', 'Net Stock', 'Last Updated']
        data = await this.reportRepository.getReportInvestment()
        rows = data.map((item: ReportInvestment) => [
          item.assetId,
          item.categoryName || 'Uncategorized',
          item.materialName,
          item.totalAlatMasuk,
          item.totalAlatKeluar,
          item.netInvestmentStok,
          item.pembaruanTerakhir.toLocaleDateString()
        ])
        break

      default:
        throw new Error(`Unsupported report type: ${reportType}`)
    }

    return {
      headers,
      rows,
      metadata: {
        title: options.title || title,
        generatedAt: new Date(),
        totalRecords: rows.length,
        filters: this.formatFilters(options.filters)
      }
    }
  }

  // Generate PDF
  private async generatePDF(data: ExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFKit({ margin: 40 })
      const buffers: Buffer[] = []
      
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on('error', reject)

      // Header
      doc.fontSize(18).font('Helvetica-Bold').text(data.metadata.title, { align: 'center' })
      doc.moveDown(0.5)
      
      // Metadata
      doc.fontSize(10).font('Helvetica')
      doc.text(`Generated: ${data.metadata.generatedAt.toLocaleString()}`, { align: 'right' })
      doc.text(`Total Records: ${data.metadata.totalRecords}`, { align: 'right' })
      
      if (data.metadata.filters) {
        doc.text(`Filters: ${data.metadata.filters}`, { align: 'right' })
      }
      
      doc.moveDown(1)

      // Table setup
      const tableTop = doc.y
      const itemHeight = 20
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
      const columnWidth = pageWidth / data.headers.length

      // Draw table headers
      doc.fontSize(9).font('Helvetica-Bold')
      data.headers.forEach((header, i) => {
        doc.rect(doc.page.margins.left + i * columnWidth, tableTop, columnWidth, itemHeight)
          .fillAndStroke('#f8f9fa', '#dee2e6')
        
        doc.fillColor('#000')
          .text(header, 
            doc.page.margins.left + i * columnWidth + 5, 
            tableTop + 6, 
            { width: columnWidth - 10, height: itemHeight }
          )
      })

      // Draw table rows
      doc.font('Helvetica').fontSize(8)
      let currentY = tableTop + itemHeight

      data.rows.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (currentY > doc.page.height - doc.page.margins.bottom - itemHeight) {
          doc.addPage()
          currentY = doc.page.margins.top
          
          // Redraw headers on new page
          doc.fontSize(9).font('Helvetica-Bold')
          data.headers.forEach((header, i) => {
            doc.rect(doc.page.margins.left + i * columnWidth, currentY, columnWidth, itemHeight)
              .fillAndStroke('#f8f9fa', '#dee2e6')
            
            doc.fillColor('#000')
              .text(header, 
                doc.page.margins.left + i * columnWidth + 5, 
                currentY + 6, 
                { width: columnWidth - 10, height: itemHeight }
              )
          })
          currentY += itemHeight
          doc.font('Helvetica').fontSize(8)
        }

        // Draw row
        row.forEach((cell, cellIndex) => {
          doc.rect(doc.page.margins.left + cellIndex * columnWidth, currentY, columnWidth, itemHeight)
            .stroke('#dee2e6')
          
          doc.fillColor('#000')
            .text(String(cell), 
              doc.page.margins.left + cellIndex * columnWidth + 5, 
              currentY + 6, 
              { width: columnWidth - 10, height: itemHeight }
            )
        })
        
        currentY += itemHeight
      })

      // Footer
      doc.fontSize(8)
        .text('Generated by Inventory Management System', 
          doc.page.margins.left, 
          doc.page.height - doc.page.margins.bottom + 10
        )

      doc.end()
    })
  }

  // Generate Excel
  private generateExcel(data: ExportData): Buffer {
    const workbook = XLSX.utils.book_new()
    
    // Create worksheet data
    const wsData = [
      // Title row
      [data.metadata.title],
      [], // Empty row
      // Metadata
      [`Generated: ${data.metadata.generatedAt.toLocaleString()}`],
      [`Total Records: ${data.metadata.totalRecords}`],
      ...(data.metadata.filters ? [[`Filters: ${data.metadata.filters}`]] : []),
      [], // Empty row
      // Headers
      data.headers,
      // Data rows
      ...data.rows
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(wsData)
    
    // Set column widths
    const colWidths = data.headers.map(() => ({ wch: 15 }))
    worksheet['!cols'] = colWidths
    
    // Style the title row
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' }
      }
    }
    
    // Merge title cell across all columns
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: data.headers.length - 1 } }
    ]
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }

  // Generate Word document
  private async generateWord(data: ExportData): Promise<Buffer> {
    const tableRows = [
      // Header row
      new TableRow({
        children: data.headers.map(header => 
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: header, bold: true })]
            })],
            width: { size: 100 / data.headers.length, type: WidthType.PERCENTAGE }
          })
        )
      }),
      // Data rows
      ...data.rows.map(row => 
        new TableRow({
          children: row.map(cell => 
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(String(cell))] })],
              width: { size: 100 / data.headers.length, type: WidthType.PERCENTAGE }
            })
          )
        })
      )
    ]

    const doc = new Document({
      sections: [{
        children: [
          // Title
          new Paragraph({
            children: [new TextRun({ text: data.metadata.title, bold: true, size: 28 })],
            alignment: AlignmentType.CENTER
          }),
          
          // Spacing
          new Paragraph({ children: [new TextRun('')] }),
          
          // Metadata
          new Paragraph({
            children: [new TextRun(`Generated: ${data.metadata.generatedAt.toLocaleString()}`)]
          }),
          new Paragraph({
            children: [new TextRun(`Total Records: ${data.metadata.totalRecords}`)]
          }),
          
          ...(data.metadata.filters ? [
            new Paragraph({
              children: [new TextRun(`Filters: ${data.metadata.filters}`)]
            })
          ] : []),
          
          // Spacing
          new Paragraph({ children: [new TextRun('')] }),
          
          // Table
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        ]
      }]
    })

    return Packer.toBuffer(doc)
  }

  // Generate filename
  private generateFilename(reportType: string, options: ExportOptions): string {
    if (options.filename) {
      return options.filename
    }

    const timestamp = new Date().toISOString().split('T')[0]
    const extension = this.getFileExtension(options.format)
    
    return `${reportType}-report-${timestamp}.${extension}`
  }

  // Get file extension
  private getFileExtension(format: ExportFormat): string {
    const extensions = {
      pdf: 'pdf',
      excel: 'xlsx',
      word: 'docx'
    }
    return extensions[format]
  }

  // Format filters for display
  private formatFilters(filters?: MaterialTransactionFilters): string {
    if (!filters) return 'None'

    const filterParts: string[] = []

    if (filters.transactionType) {
      filterParts.push(`Type: ${filters.transactionType}`)
    }
    if (filters.priorityStatus) {
      filterParts.push(`Priority: ${filters.priorityStatus}`)
    }
    if (filters.divisionId) {
      filterParts.push(`Division ID: ${filters.divisionId}`)
    }
    if (filters.assetId) {
      filterParts.push(`Asset ID: ${filters.assetId}`)
    }
    if (filters.dateFrom) {
      filterParts.push(`From: ${filters.dateFrom.toLocaleDateString()}`)
    }
    if (filters.dateTo) {
      filterParts.push(`To: ${filters.dateTo.toLocaleDateString()}`)
    }

    return filterParts.length > 0 ? filterParts.join(', ') : 'None'
  }

  // Bulk export - multiple reports in one file
  async exportMultipleReports(
    reports: Array<{ type: 'incoming' | 'outgoing' | 'investment'; title?: string }>,
    options: ExportOptions
  ): Promise<{ success: boolean; buffer?: Buffer; filename: string; contentType: string; error?: string }> {
    try {
      // Only supported for Excel format currently
      if (options.format !== 'excel') {
        throw new Error('Multiple reports export is only supported for Excel format')
      }

      const workbook = XLSX.utils.book_new()

      for (const report of reports) {
        const exportData = await this.prepareExportData(report.type, {
          ...options,
          title: report.title
        })

        // Create worksheet for this report
        const wsData = [
          [exportData.metadata.title],
          [],
          [`Generated: ${exportData.metadata.generatedAt.toLocaleString()}`],
          [`Total Records: ${exportData.metadata.totalRecords}`],
          ...(exportData.metadata.filters ? [[`Filters: ${exportData.metadata.filters}`]] : []),
          [],
          exportData.headers,
          ...exportData.rows
        ]

        const worksheet = XLSX.utils.aoa_to_sheet(wsData)
        const colWidths = exportData.headers.map(() => ({ wch: 15 }))
        worksheet['!cols'] = colWidths

        // Add worksheet to workbook
        const sheetName = report.title || report.type.charAt(0).toUpperCase() + report.type.slice(1)
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      const filename = options.filename || `combined-reports-${new Date().toISOString().split('T')[0]}.xlsx`

      return {
        success: true,
        buffer,
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }

    } catch (error) {
      console.error('Multiple reports export error:', error)
      return {
        success: false,
        filename: '',
        contentType: '',
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }
}