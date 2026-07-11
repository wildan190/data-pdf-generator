// Repository exports
export * from './base.repository'
export * from './division.repository'
export * from './material-type.repository'
export * from './inventory-asset.repository'
export * from './material-transaction.repository'
export * from './report.repository'

// Repository instances for dependency injection
import { DivisionRepository } from './division.repository'
import { MaterialTypeRepository } from './material-type.repository'
import { InventoryAssetRepository } from './inventory-asset.repository'
import { MaterialTransactionRepository } from './material-transaction.repository'
import { ReportRepository } from './report.repository'

// Repository container for centralized access
export class RepositoryContainer {
  private static _instance: RepositoryContainer
  private _divisionRepository: DivisionRepository
  private _materialTypeRepository: MaterialTypeRepository
  private _inventoryAssetRepository: InventoryAssetRepository
  private _materialTransactionRepository: MaterialTransactionRepository
  private _reportRepository: ReportRepository

  private constructor() {
    this._divisionRepository = new DivisionRepository()
    this._materialTypeRepository = new MaterialTypeRepository()
    this._inventoryAssetRepository = new InventoryAssetRepository()
    this._materialTransactionRepository = new MaterialTransactionRepository()
    this._reportRepository = new ReportRepository()
  }

  public static getInstance(): RepositoryContainer {
    if (!RepositoryContainer._instance) {
      RepositoryContainer._instance = new RepositoryContainer()
    }
    return RepositoryContainer._instance
  }

  public get divisionRepository(): DivisionRepository {
    return this._divisionRepository
  }

  public get materialTypeRepository(): MaterialTypeRepository {
    return this._materialTypeRepository
  }

  public get inventoryAssetRepository(): InventoryAssetRepository {
    return this._inventoryAssetRepository
  }

  public get materialTransactionRepository(): MaterialTransactionRepository {
    return this._materialTransactionRepository
  }

  public get reportRepository(): ReportRepository {
    return this._reportRepository
  }
}

// Factory function for easy access
export function getRepositories() {
  return RepositoryContainer.getInstance()
}

// Individual factory functions
export function getDivisionRepository(): DivisionRepository {
  return RepositoryContainer.getInstance().divisionRepository
}

export function getMaterialTypeRepository(): MaterialTypeRepository {
  return RepositoryContainer.getInstance().materialTypeRepository
}

export function getInventoryAssetRepository(): InventoryAssetRepository {
  return RepositoryContainer.getInstance().inventoryAssetRepository
}

export function getMaterialTransactionRepository(): MaterialTransactionRepository {
  return RepositoryContainer.getInstance().materialTransactionRepository
}

export function getReportRepository(): ReportRepository {
  return RepositoryContainer.getInstance().reportRepository
}