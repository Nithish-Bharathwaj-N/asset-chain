-- ============================================================
-- TRANSPORT MODULE SCHEMA
-- Run this AFTER the main asset_management schema.sql
-- ============================================================

USE asset_management;

-- ============================================================
-- 1. TRANSPORT DRIVERS  (no dependencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS transport_drivers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    employee_id     VARCHAR(30)  UNIQUE,
    phone           VARCHAR(15),
    email           VARCHAR(100),
    license_number  VARCHAR(30)  UNIQUE,
    license_expiry  DATE,
    address         TEXT,
    joined_date     DATE,
    status          ENUM('active','on_leave','terminated') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. BUSES  (depends on transport_drivers)
-- ============================================================
CREATE TABLE IF NOT EXISTS buses (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    bus_number           VARCHAR(20)  NOT NULL UNIQUE,
    registration_number  VARCHAR(30)  NOT NULL UNIQUE,
    vehicle_model        VARCHAR(100),
    manufacturer         VARCHAR(100),
    year_of_manufacture  YEAR,
    seating_capacity     INT  DEFAULT 0,
    fuel_type            ENUM('diesel','petrol','cng','electric') DEFAULT 'diesel',
    color                VARCHAR(30),
    status               ENUM('active','inactive','under_maintenance','retired') DEFAULT 'active',
    assigned_driver_id   INT,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_driver_id) REFERENCES transport_drivers(id) ON DELETE SET NULL
);

-- ============================================================
-- 3. BUS ROUTES  (no dependencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_routes (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    route_name          VARCHAR(150) NOT NULL,
    route_code          VARCHAR(20)  UNIQUE,
    start_point         VARCHAR(150),
    end_point           VARCHAR(150),
    distance_km         DECIMAL(8,2),
    estimated_time_min  INT,
    status              ENUM('active','inactive') DEFAULT 'active',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. ROUTE STOPS  (depends on bus_routes)
-- ============================================================
CREATE TABLE IF NOT EXISTS route_stops (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    route_id     INT  NOT NULL,
    stop_name    VARCHAR(150) NOT NULL,
    stop_order   INT  NOT NULL,
    arrival_time TIME,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. BUS ROUTE ASSIGNMENTS  (depends on buses + bus_routes)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_route_assignments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    bus_id      INT NOT NULL,
    route_id    INT NOT NULL,
    shift       ENUM('morning','evening','both') DEFAULT 'both',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id)   REFERENCES buses(id)      ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE CASCADE
);

-- ============================================================
-- 6. RC BOOK DETAILS  (depends on buses)
-- ============================================================
CREATE TABLE IF NOT EXISTS rc_book_details (
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    bus_id                   INT  NOT NULL UNIQUE,
    registration_date        DATE,
    registered_owner         VARCHAR(100),
    registration_authority   VARCHAR(150),
    rc_expiry_date           DATE,
    hypothecation            VARCHAR(100),
    gross_vehicle_weight     VARCHAR(30),
    unladen_weight           VARCHAR(30),
    rc_document_path         VARCHAR(255),
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. BUS INSURANCE  (depends on buses)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_insurance (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    bus_id                INT  NOT NULL,
    policy_number         VARCHAR(100) NOT NULL,
    insurance_company     VARCHAR(150),
    policy_type           ENUM('third_party','comprehensive','own_damage') DEFAULT 'comprehensive',
    premium_amount        DECIMAL(12,2),
    coverage_amount       DECIMAL(15,2),
    start_date            DATE NOT NULL,
    expiry_date           DATE NOT NULL,
    agent_name            VARCHAR(100),
    agent_phone           VARCHAR(15),
    policy_document_path  VARCHAR(255),
    status                ENUM('active','expired','cancelled') DEFAULT 'active',
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- ============================================================
-- 8. FITNESS CERTIFICATE  (depends on buses)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_fitness_certificate (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    bus_id             INT  NOT NULL,
    certificate_number VARCHAR(100),
    issued_by          VARCHAR(150),
    issued_date        DATE,
    expiry_date        DATE NOT NULL,
    remarks            TEXT,
    document_path      VARCHAR(255),
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- ============================================================
-- 9. POLLUTION CERTIFICATE (PUC)  (depends on buses)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_pollution_certificate (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    bus_id             INT  NOT NULL,
    certificate_number VARCHAR(100),
    test_center        VARCHAR(150),
    test_date          DATE,
    expiry_date        DATE NOT NULL,
    result             ENUM('pass','fail') DEFAULT 'pass',
    document_path      VARCHAR(255),
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. BUS MAINTENANCE  (depends on buses)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_maintenance (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    bus_id            INT  NOT NULL,
    maintenance_type  ENUM('service','repair','inspection','tyre_change','others') DEFAULT 'service',
    description       TEXT,
    cost              DECIMAL(12,2),
    vendor_name       VARCHAR(100),
    maintenance_date  DATE NOT NULL,
    next_due_date     DATE,
    odometer_reading  INT,
    status            ENUM('completed','pending','in_progress') DEFAULT 'completed',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- ============================================================
-- 11. BUS FUEL LOG  (depends on buses)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_fuel_log (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    bus_id           INT  NOT NULL,
    fuel_date        DATE NOT NULL,
    liters_filled    DECIMAL(8,2),
    cost_per_liter   DECIMAL(8,2),
    total_cost       DECIMAL(12,2),
    odometer_reading INT,
    fuel_station     VARCHAR(150),
    filled_by        VARCHAR(100),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- ============================================================
-- FITNESS CERTIFICATE
-- ============================================================

-- ============================================================
-- POLLUTION CERTIFICATE (PUC)
-- ============================================================

-- ============================================================
-- BUS FUEL LOG
-- ============================================================

-- ============================================================
-- BUS POINTS (Pass Holders)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_points (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    route_id         INT NOT NULL,
    stop_id          INT,
    pass_holder_name VARCHAR(100) NOT NULL,
    pass_holder_type ENUM('student','staff') DEFAULT 'student',
    roll_number      VARCHAR(30),
    department       VARCHAR(100),
    phone            VARCHAR(15),
    pass_valid_from  DATE,
    pass_valid_to    DATE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES bus_routes(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id)  REFERENCES route_stops(id) ON DELETE SET NULL
);
