import type { ExportFormat, ExportOptions } from '@/types'

// Export utilities for client-side file handling
export class ExportUtils {
  // Download file from blob
  static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Get content type for format
  static getContentType(format: ExportFormat): string {
    const contentTypes = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    return contentTypes[format]
  }

  // Get file extension for format
  static getFileExtension(format: ExportFormat): string {
    const extensions = {
      pdf: 'pdf',
      excel: 'xlsx',
      word: 'docx'
    }
    return extensions[format]
  }

  // Generate default filename
  static generateFilename(reportType: string, format: ExportFormat, timestamp?: Date): string {
    const date = timestamp || new Date()
    const dateStr = date.toISOString().split('T')[0]
    const extension = this.getFileExtension(format)
    
    return `${reportType}-report-${dateStr}.${extension}`
  }

  // Validate export options
  static validateExportOptions(options: ExportOptions): string[] {
    const errors: string[] = []

    if (!options.format) {
      errors.push('Format is required')
    }

    if (!['pdf', 'excel', 'word'].includes(options.format)) {
      errors.push('Invalid format. Must be pdf, excel, or word')
    }

    if (options.dateRange) {
      if (!options.dateRange.from || !options.dateRange.to) {
        errors.push('Date range must include both from and to dates')
      } else if (options.dateRange.from > options.dateRange.to) {
        errors.push('From date must be before to date')
      }
    }

    return errors
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Create export preview data
  static createPreviewData(
    reportType: string,
    format: ExportFormat,
    options: ExportOptions
  ): {
    filename: string
    format: ExportFormat
    estimatedSize: string
    title: string
  } {
    return {
      filename: options.filename || this.generateFilename(reportType, format),
      format,
      estimatedSize: 'Estimating...',
      title: options.title || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`
    }
  }

  // Check browser support for download
  static isBrowserSupported(): boolean {
    return !!(window.URL && window.URL.createObjectURL && document.createElement)
  }

  // Get format display name
  static getFormatDisplayName(format: ExportFormat): string {
    const displayNames = {
      pdf: 'PDF Document',
      excel: 'Excel Spreadsheet',
      word: 'Word Document'
    }
    return displayNames[format]
  }

  // Get format icon class (for UI)
  static getFormatIcon(format: ExportFormat): string {
    const icons = {
      pdf: 'fas fa-file-pdf',
      excel: 'fas fa-file-excel',
      word: 'fas fa-file-word'
    }
    return icons[format]
  }

  // Create export summary
  static createExportSummary(
    reportType: string,
    recordCount: number,
    filters?: any
  ): string {
    const parts = [
      `Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`,
      `Records: ${recordCount}`
    ]

    if (filters) {
      const filterParts: string[] = []
      
      if (filters.transactionType) {
        filterParts.push(`Type: ${filters.transactionType}`)
      }
      if (filters.priorityStatus) {
        filterParts.push(`Priority: ${filters.priorityStatus}`)
      }
      if (filters.divisionId) {
        filterParts.push(`Division: ${filters.divisionId}`)
      }
      if (filters.dateFrom || filters.dateTo) {
        const fromStr = filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : 'Any'
        const toStr = filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : 'Any'
        filterParts.push(`Date: ${fromStr} - ${toStr}`)
      }

      if (filterParts.length > 0) {
        parts.push(`Filters: ${filterParts.join(', ')}`)
      }
    }

    return parts.join(' | ')
  }

  // Handle export errors
  static handleExportError(error: any): string {
    if (error?.response?.data?.message) {
      return error.response.data.message
    }
    
    if (error?.message) {
      return error.message
    }

    if (typeof error === 'string') {
      return error
    }

    return 'Export failed. Please try again.'
  }

  // Create export progress tracker
  static createProgressTracker() {
    let progress = 0
    let status = 'initializing'

    return {
      setProgress: (value: number) => { progress = value },
      setStatus: (value: string) => { status = value },
      getProgress: () => progress,
      getStatus: () => status,
      reset: () => {
        progress = 0
        status = 'initializing'
      }
    }
  }
}

// Export configuration presets
export const ExportPresets = {
  // Quick export presets
  quick: {
    pdf: {
      format: 'pdf' as ExportFormat,
      includeHeaders: true,
      includeTimestamp: true
    },
    excel: {
      format: 'excel' as ExportFormat,
      includeHeaders: true,
      includeTimestamp: true
    },
    word: {
      format: 'word' as ExportFormat,
      includeHeaders: true,
      includeTimestamp: true
    }
  },

  // Detailed export presets
  detailed: {
    pdf: {
      format: 'pdf' as ExportFormat,
      includeHeaders: true,
      includeTimestamp: true,
      title: 'Detailed Report'
    },
    excel: {
      format: 'excel' as ExportFormat,
      includeHeaders: true,
      includeTimestamp: true,
      title: 'Detailed Report'
    },
    word: {
      format: 'word' as ExportFormat,
      includeHeaders: true,
      includeTimestamp: true,
      title: 'Detailed Report'
    }
  },

  // Summary export presets
  summary: {
    pdf: {
      format: 'pdf' as ExportFormat,
      includeHeaders: true,
      includeTimestamp: true,
      title: 'Summary Report'
    },
    excel: {
      format: 'excel' as ExportFormat,
      includeHeaders: true,
      includeTimestamp: true,
      title: 'Summary Report'
    }
  }
}