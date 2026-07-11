import type { 
  ExportFormat, 
  ExportOptions,
  MaterialTransactionFilters,
  ApiResponse 
} from '@/types'
import { ExportUtils } from '@/utils/export.utils'

// Export response interface
export interface ExportResponse {
  success: boolean
  filename?: string
  contentType?: string
  error?: string
  buffer?: ArrayBuffer
}

// Multi-report export request
export interface MultiReportExportRequest {
  reports: Array<{
    type: 'incoming' | 'outgoing' | 'investment'
    title?: string
  }>
  options: ExportOptions
}

export class ExportService {
  private readonly baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

  // Export single report
  async exportReport(
    reportType: 'incoming' | 'outgoing' | 'investment',
    options: ExportOptions
  ): Promise<ExportResponse> {
    try {
      // Validate options
      const errors = ExportUtils.validateExportOptions(options)
      if (errors.length > 0) {
        throw new Error(`Invalid export options: ${errors.join(', ')}`)
      }

      // Prepare request payload
      const payload = {
        reportType,
        ...options,
        // Convert dates to ISO strings for API
        dateRange: options.dateRange ? {
          from: options.dateRange.from.toISOString(),
          to: options.dateRange.to.toISOString()
        } : undefined
      }

      // Make API request
      const response = await fetch(`${this.baseUrl}/export/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle binary response
      const buffer = await response.arrayBuffer()
      const filename = this.getFilenameFromResponse(response, reportType, options.format)
      const contentType = response.headers.get('Content-Type') || ExportUtils.getContentType(options.format)

      return {
        success: true,
        filename,
        contentType,
        buffer
      }

    } catch (error) {
      console.error('Export service error:', error)
      return {
        success: false,
        error: ExportUtils.handleExportError(error)
      }
    }
  }

  // Export multiple reports in one file
  async exportMultipleReports(request: MultiReportExportRequest): Promise<ExportResponse> {
    try {
      // Validate options
      const errors = ExportUtils.validateExportOptions(request.options)
      if (errors.length > 0) {
        throw new Error(`Invalid export options: ${errors.join(', ')}`)
      }

      // Only Excel format supported for multiple reports
      if (request.options.format !== 'excel') {
        throw new Error('Multiple reports export is only supported for Excel format')
      }

      // Prepare request payload
      const payload = {
        ...request,
        options: {
          ...request.options,
          // Convert dates to ISO strings for API
          dateRange: request.options.dateRange ? {
            from: request.options.dateRange.from.toISOString(),
            to: request.options.dateRange.to.toISOString()
          } : undefined
        }
      }

      // Make API request
      const response = await fetch(`${this.baseUrl}/export/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle binary response
      const buffer = await response.arrayBuffer()
      const filename = this.getFilenameFromResponse(response, 'combined', 'excel')
      const contentType = response.headers.get('Content-Type') || ExportUtils.getContentType('excel')

      return {
        success: true,
        filename,
        contentType,
        buffer
      }

    } catch (error) {
      console.error('Multiple export service error:', error)
      return {
        success: false,
        error: ExportUtils.handleExportError(error)
      }
    }
  }

  // Download exported file
  downloadFile(response: ExportResponse): void {
    if (!response.success || !response.buffer) {
      throw new Error(response.error || 'No file data available')
    }

    // Check browser support
    if (!ExportUtils.isBrowserSupported()) {
      throw new Error('Your browser does not support file downloads')
    }

    // Create blob and download
    const blob = new Blob([response.buffer], { 
      type: response.contentType 
    })
    
    ExportUtils.downloadFile(blob, response.filename || 'export')
  }

  // Export and download in one step
  async exportAndDownload(
    reportType: 'incoming' | 'outgoing' | 'investment',
    options: ExportOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.exportReport(reportType, options)
      
      if (!response.success) {
        return { success: false, error: response.error }
      }

      this.downloadFile(response)
      return { success: true }

    } catch (error) {
      return { 
        success: false, 
        error: ExportUtils.handleExportError(error)
      }
    }
  }

  // Get preview of export without downloading
  async getExportPreview(
    reportType: 'incoming' | 'outgoing' | 'investment',
    options: Partial<ExportOptions>
  ): Promise<{
    success: boolean
    preview?: {
      filename: string
      format: ExportFormat
      recordCount: number
      estimatedSize: string
      title: string
    }
    error?: string
  }> {
    try {
      // Make preview request to get metadata
      const response = await fetch(`${this.baseUrl}/export/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType,
          ...options
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        preview: {
          filename: options.filename || ExportUtils.generateFilename(reportType, options.format || 'pdf'),
          format: options.format || 'pdf',
          recordCount: data.recordCount || 0,
          estimatedSize: ExportUtils.formatFileSize(data.estimatedSize || 0),
          title: options.title || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`
        }
      }

    } catch (error) {
      return {
        success: false,
        error: ExportUtils.handleExportError(error)
      }
    }
  }

  // Check export status (for long-running exports)
  async checkExportStatus(exportId: string): Promise<{
    success: boolean
    status?: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number
    error?: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/export/status/${exportId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        status: data.status,
        progress: data.progress
      }

    } catch (error) {
      return {
        success: false,
        error: ExportUtils.handleExportError(error)
      }
    }
  }

  // Get available export formats
  getAvailableFormats(): Array<{ value: ExportFormat; label: string; icon: string }> {
    return [
      {
        value: 'pdf',
        label: ExportUtils.getFormatDisplayName('pdf'),
        icon: ExportUtils.getFormatIcon('pdf')
      },
      {
        value: 'excel',
        label: ExportUtils.getFormatDisplayName('excel'),
        icon: ExportUtils.getFormatIcon('excel')
      },
      {
        value: 'word',
        label: ExportUtils.getFormatDisplayName('word'),
        icon: ExportUtils.getFormatIcon('word')
      }
    ]
  }

  // Helper method to extract filename from response headers
  private getFilenameFromResponse(
    response: Response, 
    reportType: string, 
    format: ExportFormat
  ): string {
    const contentDisposition = response.headers.get('Content-Disposition')
    
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
      if (matches && matches[1]) {
        return matches[1].replace(/['"]/g, '')
      }
    }

    // Fallback to generated filename
    return ExportUtils.generateFilename(reportType, format)
  }

  // Batch export multiple individual reports
  async batchExport(
    exports: Array<{
      reportType: 'incoming' | 'outgoing' | 'investment'
      options: ExportOptions
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{
    success: boolean
    completed: number
    failed: number
    errors: string[]
  }> {
    const results = {
      success: true,
      completed: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < exports.length; i++) {
      try {
        const currentExport = exports[i]
        if (!currentExport) {
          results.failed++
          results.errors.push(`Export at index ${i} is undefined`)
          continue
        }
        const { reportType, options } = currentExport
        const response = await this.exportReport(reportType, options)
        
        if (response.success) {
          this.downloadFile(response)
          results.completed++
        } else {
          results.failed++
          results.errors.push(`${reportType}: ${response.error}`)
        }
      } catch (error) {
        results.failed++
        const reportType = currentExport?.reportType ?? `Export at index ${i}`;

        results.errors.push(`${reportType}: ${ExportUtils.handleExportError(error)}`)
      }

      // Report progress
      onProgress?.(i + 1, exports.length)
    }

    results.success = results.failed === 0
    return results
  }
}

// Export service instance
export const exportService = new ExportService()