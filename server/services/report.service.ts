import { BaseService } from './base.service'
import { getReportRepository } from '../repositories'
import { 
  ApiResponse, 
  PaginationQuery, 
  MaterialTransactionFilters,
  ReportAlartMasuk,
  ReportAlartKeluar,
  ReportInvestment,
  ValidationError 
} from '../types'

// Report service interface
export interface IReportService {
  getReportAlatMasuk(
    filters?: MaterialTransactionFilters,
    pagination?: PaginationQuery
  ): Promise<ApiResponse<ReportAlartMasuk[]>>
  
  getReportAlatKeluar(
    filters?: MaterialTransactionFilters,
    pagination?: PaginationQuery
  ): Promise<ApiResponse<ReportAlartKeluar[]>>
  
  getReportInvestment(
    pagination?: PaginationQuery
  ): Promise<ApiResponse<ReportInvestment[]>>
  
  getDashboardStats(): Promise<ApiResponse<{
    totalAssets: number
    totalTransactions: number
    totalIncoming: number
    totalOutgoing: number
    lowStockAlerts: number
    urgentTransactions: number
    recentActivityCount: number
  }>>
  
  getMonthlyTransactionSummary(year: number, month: number): Promise<ApiResponse<{
    totalIncoming: number
    totalOutgoing: number
    netChange: number
    transactionCount: number
    byPriority: {
      prioritas: number
      urgen: number
      trivial: number
    }
    byDivision: Array<{
      divisionName: string
      count: number
    }>
  }>>
  
  getStockMovementAnalysis(assetId: number, days?: number): Promise<ApiResponse<{
    assetName: string
    startingQuantity: number
    currentQuantity: number
    totalIncoming: number
    totalOutgoing: number
    netChange: number
    transactions: Array<{
      date: Date
      type: 'masuk' | 'keluar'
      quantity: number
      division: string
      runningBalance: number
    }>
  }>>
}

// Report service implementation
export class ReportService implements IReportService {
  private reportRepository = getReportRepository()

  async getReportAlatMasuk(
    filters?: MaterialTransactionFilters,
    pagination?: PaginationQuery
  ): Promise<ApiResponse<ReportAlartMasuk[]>> {
    try {
      this.validateFilters(filters)
      this.validatePagination(pagination)

      const data = await this.reportRepository.getReportAlatMasuk(filters, pagination)
      
      return {
        success: true,
        data,
        message: `Retrieved ${data.length} incoming material records`
      }
    } catch (error) {
      console.error('Report Alat Masuk error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate incoming materials report'
      }
    }
  }

  async getReportAlatKeluar(
    filters?: MaterialTransactionFilters,
    pagination?: PaginationQuery
  ): Promise<ApiResponse<ReportAlartKeluar[]>> {
    try {
      this.validateFilters(filters)
      this.validatePagination(pagination)

      const data = await this.reportRepository.getReportAlatKeluar(filters, pagination)
      
      return {
        success: true,
        data,
        message: `Retrieved ${data.length} outgoing material records`
      }
    } catch (error) {
      console.error('Report Alat Keluar error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate outgoing materials report'
      }
    }
  }

  async getReportInvestment(
    pagination?: PaginationQuery
  ): Promise<ApiResponse<ReportInvestment[]>> {
    try {
      this.validatePagination(pagination)

      const data = await this.reportRepository.getReportInvestment(pagination)
      
      // Calculate additional metrics
      const totalAssets = data.length
      const totalStock = data.reduce((sum, item) => sum + item.netInvestmentStok, 0)
      const zeroStockAssets = data.filter(item => item.netInvestmentStok === 0).length
      
      return {
        success: true,
        data,
        message: `Investment report: ${totalAssets} assets, ${totalStock} total stock units, ${zeroStockAssets} assets with zero stock`
      }
    } catch (error) {
      console.error('Report Investment error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate investment report'
      }
    }
  }

  async getDashboardStats(): Promise<ApiResponse<{
    totalAssets: number
    totalTransactions: number
    totalIncoming: number
    totalOutgoing: number
    lowStockAlerts: number
    urgentTransactions: number
    recentActivityCount: number
  }>> {
    try {
      const stats = await this.reportRepository.getDashboardStats()
      
      return {
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      }
    } catch (error) {
      console.error('Dashboard stats error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve dashboard statistics'
      }
    }
  }

  async getMonthlyTransactionSummary(year: number, month: number): Promise<ApiResponse<{
    totalIncoming: number
    totalOutgoing: number
    netChange: number
    transactionCount: number
    byPriority: {
      prioritas: number
      urgen: number
      trivial: number
    }
    byDivision: Array<{
      divisionName: string
      count: number
    }>
  }>> {
    try {
      this.validateYear(year)
      this.validateMonth(month)

      const data = await this.reportRepository.getMonthlyTransactionSummary(year, month)
      
      return {
        success: true,
        data,
        message: `Monthly summary for ${month}/${year}: ${data.transactionCount} transactions, net change: ${data.netChange}`
      }
    } catch (error) {
      console.error('Monthly transaction summary error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate monthly transaction summary'
      }
    }
  }

  async getStockMovementAnalysis(assetId: number, days: number = 30): Promise<ApiResponse<{
    assetName: string
    startingQuantity: number
    currentQuantity: number
    totalIncoming: number
    totalOutgoing: number
    netChange: number
    transactions: Array<{
      date: Date
      type: 'masuk' | 'keluar'
      quantity: number
      division: string
      runningBalance: number
    }>
  }>> {
    try {
      this.validateId(assetId)
      this.validateDays(days)

      const data = await this.reportRepository.getStockMovementAnalysis(assetId, days)
      
      return {
        success: true,
        data,
        message: `Stock movement analysis for ${data.assetName} over ${days} days: ${data.transactions.length} transactions`
      }
    } catch (error) {
      console.error('Stock movement analysis error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate stock movement analysis'
      }
    }
  }

  // Validation methods
  private validateFilters(filters?: MaterialTransactionFilters): void {
    if (!filters) return

    if (filters.transactionType && !['masuk', 'keluar'].includes(filters.transactionType)) {
      throw new ValidationError('Invalid transaction type', 'transactionType')
    }

    if (filters.priorityStatus && !['prioritas', 'urgen', 'trivial'].includes(filters.priorityStatus)) {
      throw new ValidationError('Invalid priority status', 'priorityStatus')
    }

    if (filters.divisionId && (typeof filters.divisionId !== 'number' || filters.divisionId <= 0)) {
      throw new ValidationError('Invalid division ID', 'divisionId')
    }

    if (filters.assetId && (typeof filters.assetId !== 'number' || filters.assetId <= 0)) {
      throw new ValidationError('Invalid asset ID', 'assetId')
    }

    if (filters.dateFrom && filters.dateTo) {
      if (!(filters.dateFrom instanceof Date) || isNaN(filters.dateFrom.getTime())) {
        throw new ValidationError('Invalid start date', 'dateFrom')
      }
      
      if (!(filters.dateTo instanceof Date) || isNaN(filters.dateTo.getTime())) {
        throw new ValidationError('Invalid end date', 'dateTo')
      }
      
      if (filters.dateFrom >= filters.dateTo) {
        throw new ValidationError('Start date must be before end date', 'dateFrom')
      }

      // Limit date range to 2 years for performance
      const maxRangeMs = 2 * 365 * 24 * 60 * 60 * 1000
      if (filters.dateTo.getTime() - filters.dateFrom.getTime() > maxRangeMs) {
        throw new ValidationError('Date range cannot exceed 2 years', 'dateTo')
      }
    }
  }

  private validatePagination(pagination?: PaginationQuery): void {
    if (!pagination) return

    if (pagination.page !== undefined) {
      if (typeof pagination.page !== 'number' || pagination.page < 1) {
        throw new ValidationError('Page must be a positive number', 'page')
      }
    }

    if (pagination.pageSize !== undefined) {
      if (typeof pagination.pageSize !== 'number' || pagination.pageSize < 1 || pagination.pageSize > 1000) {
        throw new ValidationError('Page size must be between 1 and 1000', 'pageSize')
      }
    }
  }

  private validateId(id: number): void {
    if (!id || typeof id !== 'number' || id <= 0 || isNaN(id)) {
      throw new ValidationError('Invalid ID provided', 'id')
    }
  }

  private validateYear(year: number): void {
    if (!year || typeof year !== 'number' || year < 2020 || year > 2030) {
      throw new ValidationError('Year must be between 2020 and 2030', 'year')
    }
  }

  private validateMonth(month: number): void {
    if (!month || typeof month !== 'number' || month < 1 || month > 12) {
      throw new ValidationError('Month must be between 1 and 12', 'month')
    }
  }

  private validateDays(days: number): void {
    if (!days || typeof days !== 'number' || days < 1 || days > 365) {
      throw new ValidationError('Days must be between 1 and 365', 'days')
    }
  }

  // Utility methods for report generation
  async generateComprehensiveReport(
    filters?: MaterialTransactionFilters & {
      includeIncoming?: boolean
      includeOutgoing?: boolean
      includeInvestment?: boolean
    }
  ): Promise<ApiResponse<{
    summary: {
      generatedAt: Date
      period: string
      totalRecords: number
    }
    incomingMaterials?: ReportAlartMasuk[]
    outgoingMaterials?: ReportAlartKeluar[]
    investmentSummary?: ReportInvestment[]
  }>> {
    try {
      this.validateFilters(filters)

      const summary = {
        generatedAt: new Date(),
        period: this.formatPeriod(filters?.dateFrom, filters?.dateTo),
        totalRecords: 0
      }

      const result: any = { summary }

      if (filters?.includeIncoming !== false) {
        const incomingResponse = await this.getReportAlatMasuk(filters)
        if (incomingResponse.success) {
          result.incomingMaterials = incomingResponse.data
          summary.totalRecords += incomingResponse.data?.length || 0
        }
      }

      if (filters?.includeOutgoing !== false) {
        const outgoingResponse = await this.getReportAlatKeluar(filters)
        if (outgoingResponse.success) {
          result.outgoingMaterials = outgoingResponse.data
          summary.totalRecords += outgoingResponse.data?.length || 0
        }
      }

      if (filters?.includeInvestment !== false) {
        const investmentResponse = await this.getReportInvestment()
        if (investmentResponse.success) {
          result.investmentSummary = investmentResponse.data
          summary.totalRecords += investmentResponse.data?.length || 0
        }
      }

      return {
        success: true,
        data: result,
        message: `Comprehensive report generated with ${summary.totalRecords} total records`
      }
    } catch (error) {
      console.error('Comprehensive report error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate comprehensive report'
      }
    }
  }

  private formatPeriod(dateFrom?: Date, dateTo?: Date): string {
    if (!dateFrom && !dateTo) {
      return 'All time'
    }
    
    if (dateFrom && dateTo) {
      return `${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`
    }
    
    if (dateFrom) {
      return `From ${dateFrom.toLocaleDateString()}`
    }
    
    if (dateTo) {
      return `Until ${dateTo.toLocaleDateString()}`
    }
    
    return 'Custom period'
  }

  // Export format helpers
  async getReportForExport(
    reportType: 'incoming' | 'outgoing' | 'investment',
    filters?: MaterialTransactionFilters,
    pagination?: PaginationQuery
  ): Promise<ApiResponse<{
    headers: string[]
    data: Array<Array<string | number>>
    metadata: {
      reportType: string
      generatedAt: Date
      totalRecords: number
      filters?: MaterialTransactionFilters
    }
  }>> {
    try {
      let headers: string[] = []
      let rawData: any[] = []
      let reportTypeName = ''

      switch (reportType) {
        case 'incoming':
          const incomingResponse = await this.getReportAlatMasuk(filters, pagination)
          if (!incomingResponse.success) {
            throw new Error(incomingResponse.error || 'Failed to fetch incoming data')
          }
          headers = ['Transaction ID', 'Material Type', 'Quantity', 'Division', 'Status', 'Date', 'Notes']
          rawData = incomingResponse.data || []
          reportTypeName = 'Incoming Materials Report'
          break

        case 'outgoing':
          const outgoingResponse = await this.getReportAlatKeluar(filters, pagination)
          if (!outgoingResponse.success) {
            throw new Error(outgoingResponse.error || 'Failed to fetch outgoing data')
          }
          headers = ['Transaction ID', 'Material Type', 'Quantity', 'Division', 'Status', 'Date', 'Notes']
          rawData = outgoingResponse.data || []
          reportTypeName = 'Outgoing Materials Report'
          break

        case 'investment':
          const investmentResponse = await this.getReportInvestment(pagination)
          if (!investmentResponse.success) {
            throw new Error(investmentResponse.error || 'Failed to fetch investment data')
          }
          headers = ['Asset ID', 'Category', 'Material Name', 'Total Incoming', 'Total Outgoing', 'Net Stock', 'Last Updated']
          rawData = investmentResponse.data || []
          reportTypeName = 'Investment Report'
          break

        default:
          throw new ValidationError('Invalid report type', 'reportType')
      }

      // Convert data to array format for export
      const exportData: Array<Array<string | number>> = rawData.map(item => {
        switch (reportType) {
          case 'incoming':
          case 'outgoing':
            return [
              item.transactionId,
              item.jenisMaterial,
              item.kuantitas,
              item.divisi,
              item.status,
              reportType === 'incoming' ? item.tanggalMasuk.toISOString() : item.tanggalKeluar.toISOString(),
              item.catatan || ''
            ]
          case 'investment':
            return [
              item.assetId,
              item.categoryName || 'Uncategorized',
              item.materialName,
              item.totalAlatMasuk,
              item.totalAlatKeluar,
              item.netInvestmentStok,
              item.pembaruanTerakhir.toISOString()
            ]
          default:
            return []
        }
      })

      return {
        success: true,
        data: {
          headers,
          data: exportData,
          metadata: {
            reportType: reportTypeName,
            generatedAt: new Date(),
            totalRecords: exportData.length,
            filters
          }
        }
      }
    } catch (error) {
      console.error('Export data preparation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to prepare export data'
      }
    }
  }
}