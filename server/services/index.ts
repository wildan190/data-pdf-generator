// Service exports
export * from './base.service'
export * from './division.service'
export * from './material-type.service'
export * from './inventory-asset.service'
export * from './material-transaction.service'
export * from './report.service'

// Service instances for dependency injection
import { DivisionService } from './division.service'
import { MaterialTypeService } from './material-type.service'
import { InventoryAssetService } from './inventory-asset.service'
import { MaterialTransactionService } from './material-transaction.service'
import { ReportService } from './report.service'

// Service container for centralized access
export class ServiceContainer {
  private static _instance: ServiceContainer
  private _divisionService: DivisionService
  private _materialTypeService: MaterialTypeService
  private _inventoryAssetService: InventoryAssetService
  private _materialTransactionService: MaterialTransactionService
  private _reportService: ReportService

  private constructor() {
    this._divisionService = new DivisionService()
    this._materialTypeService = new MaterialTypeService()
    this._inventoryAssetService = new InventoryAssetService()
    this._materialTransactionService = new MaterialTransactionService()
    this._reportService = new ReportService()
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer._instance) {
      ServiceContainer._instance = new ServiceContainer()
    }
    return ServiceContainer._instance
  }

  public get divisionService(): DivisionService {
    return this._divisionService
  }

  public get materialTypeService(): MaterialTypeService {
    return this._materialTypeService
  }

  public get inventoryAssetService(): InventoryAssetService {
    return this._inventoryAssetService
  }

  public get materialTransactionService(): MaterialTransactionService {
    return this._materialTransactionService
  }

  public get reportService(): ReportService {
    return this._reportService
  }
}

// Factory function for easy access
export function getServices() {
  return ServiceContainer.getInstance()
}

// Individual factory functions
export function getDivisionService(): DivisionService {
  return ServiceContainer.getInstance().divisionService
}

export function getMaterialTypeService(): MaterialTypeService {
  return ServiceContainer.getInstance().materialTypeService
}

export function getInventoryAssetService(): InventoryAssetService {
  return ServiceContainer.getInstance().inventoryAssetService
}

export function getMaterialTransactionService(): MaterialTransactionService {
  return ServiceContainer.getInstance().materialTransactionService
}

export function getReportService(): ReportService {
  return ServiceContainer.getInstance().reportService
}