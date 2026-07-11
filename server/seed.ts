import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data in development
  if (process.env.NODE_ENV === 'development') {
    await prisma.materialTransaction.deleteMany({})
    await prisma.inventoryAsset.deleteMany({})
    await prisma.materialType.deleteMany({})
    await prisma.division.deleteMany({})
  }

  // Seed Divisions
  const divisions = await Promise.all([
    prisma.division.create({
      data: {
        divisionName: 'Logistik',
      },
    }),
    prisma.division.create({
      data: {
        divisionName: 'Operasional',
      },
    }),
    prisma.division.create({
      data: {
        divisionName: 'Konstruksi',
      },
    }),
    prisma.division.create({
      data: {
        divisionName: 'Pengadaan',
      },
    }),
  ])

  console.log('✅ Created divisions:', divisions.map(d => d.divisionName))

  // Seed Material Types
  const materialTypes = await Promise.all([
    prisma.materialType.create({
      data: {
        categoryName: 'Bahan Bangunan',
        description: 'Timber, semen, besi',
      },
    }),
    prisma.materialType.create({
      data: {
        categoryName: 'Alat Berat',
        description: 'Excavator, Forklift',
      },
    }),
    prisma.materialType.create({
      data: {
        categoryName: 'Peralatan Konstruksi',
        description: 'Alat-alat konstruksi dan pembangunan',
      },
    }),
    prisma.materialType.create({
      data: {
        categoryName: 'Bahan Kimia',
        description: 'Bahan kimia industri dan laboratorium',
      },
    }),
  ])

  console.log('✅ Created material types:', materialTypes.map(mt => mt.categoryName))

  // Seed Inventory Assets
  const assets = await Promise.all([
    prisma.inventoryAsset.create({
      data: {
        materialName: 'Kayu Meranti Kayu Konstruksi',
        categoryId: materialTypes[0].categoryId, // Bahan Bangunan
        currentQuantity: 0,
        unitMeasure: 'batang',
      },
    }),
    prisma.inventoryAsset.create({
      data: {
        materialName: 'Besi Beton 12mm',
        categoryId: materialTypes[0].categoryId, // Bahan Bangunan
        currentQuantity: 0,
        unitMeasure: 'batang',
      },
    }),
    prisma.inventoryAsset.create({
      data: {
        materialName: 'Semen Portland',
        categoryId: materialTypes[0].categoryId, // Bahan Bangunan
        currentQuantity: 0,
        unitMeasure: 'sak',
      },
    }),
    prisma.inventoryAsset.create({
      data: {
        materialName: 'Excavator CAT 320',
        categoryId: materialTypes[1].categoryId, // Alat Berat
        currentQuantity: 0,
        unitMeasure: 'unit',
      },
    }),
    prisma.inventoryAsset.create({
      data: {
        materialName: 'Forklift Toyota 3 Ton',
        categoryId: materialTypes[1].categoryId, // Alat Berat
        currentQuantity: 0,
        unitMeasure: 'unit',
      },
    }),
    prisma.inventoryAsset.create({
      data: {
        materialName: 'Helm Keselamatan',
        categoryId: materialTypes[2].categoryId, // Peralatan Konstruksi
        currentQuantity: 0,
        unitMeasure: 'pcs',
      },
    }),
  ])

  console.log('✅ Created inventory assets:', assets.map(a => a.materialName))

  // Create a map to track current quantities
  const quantityMap = new Map<number, number>()
  assets.forEach(asset => {
    quantityMap.set(asset.assetId, 0)
  })

  // Seed some sample transactions (use prisma transaction to update quantity)
  await prisma.$transaction(async (tx) => {
    // Incoming materials
    await tx.materialTransaction.create({
      data: {
        assetId: assets[0].assetId,
        divisionId: divisions[2].divisionId, // Konstruksi
        quantity: 100,
        transactionType: 'masuk',
        priorityStatus: 'prioritas',
        notes: 'Pengadaan kayu untuk proyek gedung A',
      },
    })
    quantityMap.set(assets[0].assetId, (quantityMap.get(assets[0].assetId) || 0) + 100)

    await tx.materialTransaction.create({
      data: {
        assetId: assets[1].assetId,
        divisionId: divisions[2].divisionId, // Konstruksi
        quantity: 200,
        transactionType: 'masuk',
        priorityStatus: 'urgen',
        notes: 'Besi beton untuk fondasi',
      },
    })
    quantityMap.set(assets[1].assetId, (quantityMap.get(assets[1].assetId) || 0) + 200)

    await tx.materialTransaction.create({
      data: {
        assetId: assets[2].assetId,
        divisionId: divisions[3].divisionId, // Pengadaan
        quantity: 50,
        transactionType: 'masuk',
        priorityStatus: 'trivial',
        notes: 'Stok semen rutin',
      },
    })
    quantityMap.set(assets[2].assetId, (quantityMap.get(assets[2].assetId) || 0) + 50)

    // Outgoing materials
    await tx.materialTransaction.create({
      data: {
        assetId: assets[0].assetId,
        divisionId: divisions[1].divisionId, // Operasional
        quantity: 30,
        transactionType: 'keluar',
        priorityStatus: 'prioritas',
        notes: 'Penggunaan kayu untuk perbaikan jembatan',
      },
    })
    quantityMap.set(assets[0].assetId, (quantityMap.get(assets[0].assetId) || 0) - 30)

    await tx.materialTransaction.create({
      data: {
        assetId: assets[5].assetId,
        divisionId: divisions[0].divisionId, // Logistik
        quantity: 25,
        transactionType: 'masuk',
        priorityStatus: 'urgen',
        notes: 'Helm keselamatan untuk pekerja baru',
      },
    })
    quantityMap.set(assets[5].assetId, (quantityMap.get(assets[5].assetId) || 0) + 25)

    // Update inventory assets
    for (const asset of assets) {
      const newQty = quantityMap.get(asset.assetId) || 0
      await tx.inventoryAsset.update({
        where: { assetId: asset.assetId },
        data: {
          currentQuantity: newQty,
          lastUpdatedAt: new Date()
        }
      })
    }
  })

  console.log('✅ Created sample transactions and updated inventory!')

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })