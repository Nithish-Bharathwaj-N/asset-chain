-- ============================================================
-- IT ASSETS MODULE SCHEMA
-- Run AFTER schema.sql and transport_schema.sql
-- ============================================================

USE asset_management;

-- ============================================================
-- IT CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS it_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO it_categories (name, description) VALUES
('Computer',       'Desktops, workstations'),
('Laptop',         'Portable computers'),
('Printer',        'Printers and scanners'),
('Projector',      'Projectors and display devices'),
('Networking',     'Routers, switches, access points'),
('Server',         'Servers and NAS devices'),
('UPS',            'Uninterruptible power supplies'),
('Peripheral',     'Keyboards, mice, monitors'),
('Storage',        'External drives, pen drives'),
('Other',          'Miscellaneous IT items');

-- ============================================================
-- IT ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS it_assets (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    asset_tag        VARCHAR(50) UNIQUE NOT NULL,
    asset_name       VARCHAR(150) NOT NULL,
    category_id      INT,
    brand            VARCHAR(100),
    model            VARCHAR(100),
    serial_number    VARCHAR(100) UNIQUE,
    processor        VARCHAR(100),
    ram_gb           INT,
    storage_gb       INT,
    os               VARCHAR(100),
    ip_address       VARCHAR(30),
    mac_address      VARCHAR(30),
    location         VARCHAR(150),
    department       VARCHAR(100),
    assigned_to      VARCHAR(100),
    assigned_user_id INT,
    purchase_date    DATE,
    purchase_cost    DECIMAL(12,2),
    vendor_name      VARCHAR(100),
    warranty_expiry  DATE,
    status           ENUM('available','assigned','under_repair','disposed','lost') DEFAULT 'available',
    condition_grade  ENUM('A','B','C','D') DEFAULT 'A',
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES it_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- IT ASSET ASSIGNMENTS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS it_assignments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    asset_id        INT NOT NULL,
    assigned_to     VARCHAR(100),
    assigned_user_id INT,
    department      VARCHAR(100),
    location        VARCHAR(150),
    assigned_date   DATE NOT NULL,
    returned_date   DATE,
    assigned_by     INT,
    notes           TEXT,
    status          ENUM('active','returned') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES it_assets(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- IT MAINTENANCE / SERVICE LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS it_maintenance (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    asset_id         INT NOT NULL,
    maintenance_type ENUM('repair','service','upgrade','inspection','software_install','other') DEFAULT 'repair',
    description      TEXT,
    cost             DECIMAL(12,2),
    vendor_name      VARCHAR(100),
    technician_name  VARCHAR(100),
    maintenance_date DATE NOT NULL,
    next_due_date    DATE,
    status           ENUM('completed','pending','in_progress') DEFAULT 'completed',
    created_by       INT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES it_assets(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- IT DISPOSAL LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS it_disposal (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    asset_id        INT NOT NULL,
    disposal_date   DATE NOT NULL,
    disposal_method ENUM('sold','donated','scrapped','transferred') DEFAULT 'scrapped',
    disposal_value  DECIMAL(12,2),
    disposed_by     INT,
    remarks         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES it_assets(id) ON DELETE CASCADE,
    FOREIGN KEY (disposed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- IT SOFTWARE LICENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS it_software (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    software_name  VARCHAR(150) NOT NULL,
    version        VARCHAR(50),
    license_key    VARCHAR(255),
    license_type   ENUM('perpetual','subscription','open_source','trial') DEFAULT 'perpetual',
    total_licenses INT DEFAULT 1,
    used_licenses  INT DEFAULT 0,
    vendor         VARCHAR(100),
    purchase_date  DATE,
    expiry_date    DATE,
    cost           DECIMAL(12,2),
    assigned_to    TEXT,
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- CONSTRUCTION MODULE SCHEMA
-- ============================================================

-- ============================================================
-- CONSTRUCTION CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    unit        VARCHAR(30),
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO construction_categories (name, unit, description) VALUES
('Cement',       'bags',    'Cement bags'),
('Steel',        'kg',      'Steel rods and bars'),
('Bricks',       'pieces',  'Red bricks and fly ash bricks'),
('Sand',         'cubic ft','River sand and M-sand'),
('Aggregate',    'cubic ft','Coarse aggregate, gravel'),
('Wood/Timber',  'sq ft',   'Timber and wood planks'),
('Paint',        'liters',  'Wall paint and primer'),
('Tiles',        'sq ft',   'Floor and wall tiles'),
('Glass',        'sq ft',   'Window and door glass'),
('Electrical',   'pieces',  'Wiring, switches, fixtures'),
('Plumbing',     'pieces',  'Pipes, fittings, fixtures'),
('Safety',       'pieces',  'Helmets, gloves, gear'),
('Tools',        'pieces',  'Hammers, drills, machinery'),
('Other',        'pieces',  'Miscellaneous items');

-- ============================================================
-- CONSTRUCTION PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_projects (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    project_name   VARCHAR(200) NOT NULL,
    project_code   VARCHAR(30) UNIQUE,
    description    TEXT,
    location       VARCHAR(200),
    start_date     DATE,
    end_date       DATE,
    budget         DECIMAL(15,2),
    spent          DECIMAL(15,2) DEFAULT 0,
    contractor     VARCHAR(150),
    project_manager VARCHAR(100),
    status         ENUM('planning','active','on_hold','completed','cancelled') DEFAULT 'planning',
    created_by     INT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- CONSTRUCTION INVENTORY (MATERIALS STOCK)
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_inventory (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT,
    item_name       VARCHAR(150) NOT NULL,
    brand           VARCHAR(100),
    unit            VARCHAR(30),
    total_quantity  DECIMAL(12,2) DEFAULT 0,
    available_qty   DECIMAL(12,2) DEFAULT 0,
    reorder_level   DECIMAL(12,2) DEFAULT 0,
    unit_cost       DECIMAL(12,2),
    storage_location VARCHAR(150),
    supplier        VARCHAR(150),
    last_purchase   DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES construction_categories(id) ON DELETE SET NULL
);

-- ============================================================
-- CONSTRUCTION MATERIAL PURCHASE / INWARD
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_purchases (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    project_id      INT,
    item_id         INT,
    quantity        DECIMAL(12,2) NOT NULL,
    unit_cost       DECIMAL(12,2),
    total_cost      DECIMAL(12,2),
    supplier        VARCHAR(150),
    invoice_number  VARCHAR(100),
    purchase_date   DATE NOT NULL,
    received_by     INT,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES construction_projects(id) ON DELETE SET NULL,
    FOREIGN KEY (item_id) REFERENCES construction_inventory(id) ON DELETE SET NULL,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- CONSTRUCTION MATERIAL ISSUES (OUTWARD / USAGE)
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_issues (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    project_id   INT,
    item_id      INT,
    quantity     DECIMAL(12,2) NOT NULL,
    issued_to    VARCHAR(100),
    purpose      TEXT,
    issue_date   DATE NOT NULL,
    issued_by    INT,
    returned_qty DECIMAL(12,2) DEFAULT 0,
    return_date  DATE,
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES construction_projects(id) ON DELETE SET NULL,
    FOREIGN KEY (item_id) REFERENCES construction_inventory(id) ON DELETE SET NULL,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- CONSTRUCTION WORKERS / LABOUR
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_workers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    worker_id       VARCHAR(30) UNIQUE,
    trade           ENUM('mason','carpenter','plumber','electrician','painter','helper','supervisor','other') DEFAULT 'helper',
    phone           VARCHAR(15),
    aadhar          VARCHAR(20),
    address         TEXT,
    contractor      VARCHAR(100),
    daily_rate      DECIMAL(10,2),
    joined_date     DATE,
    status          ENUM('active','inactive') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CONSTRUCTION ATTENDANCE / LABOUR LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_attendance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT,
    worker_id   INT NOT NULL,
    work_date   DATE NOT NULL,
    shift       ENUM('full','half','overtime') DEFAULT 'full',
    amount_paid DECIMAL(10,2),
    recorded_by INT,
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES construction_projects(id) ON DELETE SET NULL,
    FOREIGN KEY (worker_id) REFERENCES construction_workers(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- CONSTRUCTION EQUIPMENT (MACHINERY)
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_equipment (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    equipment_name  VARCHAR(150) NOT NULL,
    equipment_code  VARCHAR(30) UNIQUE,
    category        ENUM('excavator','mixer','crane','compactor','generator','scaffolding','hand_tool','vehicle','other') DEFAULT 'other',
    brand           VARCHAR(100),
    model           VARCHAR(100),
    owned_rented    ENUM('owned','rented') DEFAULT 'owned',
    rental_rate     DECIMAL(12,2),
    status          ENUM('available','in_use','under_repair','retired') DEFAULT 'available',
    last_service    DATE,
    next_service    DATE,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
