CREATE DATABASE IF NOT EXISTS asset_management;
USE asset_management;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('head','incharge','student'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_name VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE lab_incharges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT,
    user_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT,
    equipment_name VARCHAR(150),
    total_quantity INT,
    available_quantity INT DEFAULT 0,
    max_per_student INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id)
);

CREATE TABLE borrow_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    lab_id INT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    qr_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (lab_id) REFERENCES labs(id)
);

CREATE TABLE request_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT,
    equipment_id INT,
    quantity INT,
    FOREIGN KEY (request_id) REFERENCES borrow_requests(id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT,
    equipment_id INT,
    student_id INT,
    quantity_given INT,
    quantity_returned INT DEFAULT 0,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP,
    status ENUM('issued','returned','partial','overdue') DEFAULT 'issued',
    FOREIGN KEY (request_id) REFERENCES borrow_requests(id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE purchase_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT,
    equipment_name VARCHAR(150),
    current_quantity INT,
    requested_quantity INT,
    reason TEXT,
    requested_by INT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id),
    FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE TABLE damage_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT,
    student_id INT,
    quantity INT,
    description TEXT,
    reported_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (reported_by) REFERENCES users(id)
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT,
    status ENUM('unread','read') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);