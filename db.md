sql_content = """-- =============================================================================
-- SQL DDL Script: Inventory Tracking & Asset Management System (SNM Group)
-- Target DBMS: PostgreSQL / MySQL Compatible
-- Description: Structured schema to handle material inventory tracking, including
--              incoming/outgoing logs, divisional tracking, and net investment/asset totals.
-- Date: July 11, 2026
-- =============================================================================

-- Create Enums / Constraints for Controlled Fields
-- -----------------------------------------------------------------------------
-- Status Priority Levels
-- 'prioritas' (High Priority), 'urgen' (Urgent), 'trivial' (Low Priority)
-- Transaction Types
-- 'masuk' (Incoming Asset/Material), 'keluar' (Outgoing/Dispatched Asset)

-- 1. Table: Divisions (Master Data for Organization Units)
CREATE TABLE divisions (
    division_id SERIAL PRIMARY KEY,
    division_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: Material Categories / Types (Master Data)
CREATE TABLE material_types (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: Inventory Items (The Consolidated Investment/Asset Registry)
-- Tracks the current stock / value balance based on incoming minus outgoing.
CREATE TABLE inventory_assets (
    asset_id SERIAL PRIMARY KEY,
    material_name VARCHAR(255) NOT NULL UNIQUE,
    category_id INT REFERENCES material_types(category_id) ON DELETE SET NULL,
    current_quantity INT NOT NULL DEFAULT 0,
    unit_measure VARCHAR(50) DEFAULT 'pcs',
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantity_non_negative CHECK (current_quantity >= 0)
);

-- 4. Table: Material Transactions (Form Input Data for Incoming & Outgoing)
CREATE TABLE material_transactions (
    transaction_id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES inventory_assets(asset_id) ON DELETE CASCADE,
    division_id INT NOT NULL REFERENCES divisions(division_id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    transaction_type VARCHAR(10) NOT NULL, -- 'masuk' or 'keluar'
    priority_status VARCHAR(20) NOT NULL,  -- 'prioritas', 'urgen', 'trivial'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Safety Constraints
    CONSTRAINT chk_transaction_quantity CHECK (quantity > 0),
    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('masuk', 'keluar')),
    CONSTRAINT chk_priority_status CHECK (priority_status IN ('prioritas', 'urgen', 'trivial'))
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION (Essential for Exporting to PDF/Excel/Word)
-- =============================================================================
CREATE INDEX idx_transactions_type ON material_transactions(transaction_type);
CREATE INDEX idx_transactions_status ON material_transactions(priority_status);
CREATE INDEX idx_transactions_date ON material_transactions(created_at);
CREATE INDEX idx_assets_name ON inventory_assets(material_name);

-- =============================================================================
-- TRIGGERS TO AUTOMATICALLY CALCULATE INVESTMENT / BALANCE
-- Automatically adjusts current_quantity when 'alat masuk' or 'alat keluar' occurs.
-- =============================================================================

CREATE OR REPLACE FUNCTION update_inventory_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'masuk' THEN
        UPDATE inventory_assets
        SET current_quantity = current_quantity + NEW.quantity,
            last_updated_at = CURRENT_TIMESTAMP
        WHERE asset_id = NEW.asset_id;
    ELSIF NEW.transaction_type = 'keluar' THEN
        -- Check if stock is sufficient before deducting
        IF (SELECT current_quantity FROM inventory_assets WHERE asset_id = NEW.asset_id) < NEW.quantity THEN
            RAISE EXCEPTION 'Stok tidak mencukupi untuk pengeluaran barang ini.';
        END IF;
        
        UPDATE inventory_assets
        SET current_quantity = current_quantity - NEW.quantity,
            last_updated_at = CURRENT_TIMESTAMP
        WHERE asset_id = NEW.asset_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON material_transactions
FOR EACH ROW
EXECUTE FUNCTION update_inventory_balance();

-- =============================================================================
-- VIEWS FOR REPORTING & DATA EXPORTS (PDF, Word, Excel)
-- =============================================================================

-- View 1: Kumpulan Informasi Data Inventaris - Alat Masuk
CREATE OR REPLACE VIEW v_report_alat_masuk AS
SELECT 
    t.transaction_id,
    a.material_name AS jenis_material,
    t.quantity AS kuantitas,
    d.division_name AS divisi,
    t.priority_status AS status,
    t.created_at AS tanggal_masuk,
    t.notes AS catatan
FROM material_transactions t
JOIN inventory_assets a ON t.asset_id = a.asset_id
JOIN divisions d ON t.division_id = d.division_id
WHERE t.transaction_type = 'masuk';

-- View 2: Kumpulan Informasi Data Inventaris - Alat Keluar
CREATE OR REPLACE VIEW v_report_alat_keluar AS
SELECT 
    t.transaction_id,
    a.material_name AS jenis_material,
    t.quantity AS kuantitas,
    d.division_name AS divisi,
    t.priority_status AS status,
    t.created_at AS tanggal_keluar,
    t.notes AS catatan
FROM material_transactions t
JOIN inventory_assets a ON t.asset_id = a.asset_id
JOIN divisions d ON t.division_id = d.division_id
WHERE t.transaction_type = 'keluar';

-- View 3: Investment Report (Total Real-time Stock Balance)
CREATE OR REPLACE VIEW v_report_investment AS
SELECT 
    a.asset_id,
    c.category_name,
    a.material_name,
    COALESCE((SELECT SUM(quantity) FROM material_transactions WHERE asset_id = a.asset_id AND transaction_type = 'masuk'), 0) AS total_alat_masuk,
    COALESCE((SELECT SUM(quantity) FROM material_transactions WHERE asset_id = a.asset_id AND transaction_type = 'keluar'), 0) AS total_alat_keluar,
    a.current_quantity AS net_investment_stok,
    a.last_updated_at AS pembaruan_terakhir
FROM inventory_assets a
LEFT JOIN material_types c ON a.category_id = c.category_id;

-- =============================================================================
-- SEED DATA (Contoh Pengisian Data Awal)
-- =============================================================================
INSERT INTO divisions (division_name) VALUES ('Logistik'), ('Operasional'), ('Konstruksi'), ('Pengadaan');
INSERT INTO material_types (category_name, description) VALUES ('Bahan Bangunan', 'Timber, semen, besi'), ('Alat Berat', 'Excavator, Forklift');

INSERT INTO inventory_assets (material_name, category_id, current_quantity, unit_measure) VALUES 
('Kayu Meranti Kayu Konstruksi', 1, 0, 'batang'),
('Besi Beton 12mm', 1, 0, 'batang');
"""

with open("init_inventory_system.sql", "w") as f:
    f.write(sql_content)
print("SQL file created successfully.")