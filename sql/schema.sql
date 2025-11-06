CREATE DATABASE IF NOT EXISTS FoodRescue;
USE FoodRescue;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','donor','volunteer','receiver') NOT NULL,
  entity_id INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS donors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(30),
  address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS volunteers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  assigned_area VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS receivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(30),
  address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS centers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  location VARCHAR(120),
  capacity INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT,
  food_item VARCHAR(100),
  quantity INT,
  expiry_date DATE,
  center_id INT,
  status ENUM('Pending','Picked Up','Delivered','Expired','Allocated') DEFAULT 'Pending',
  FOREIGN KEY (donor_id) REFERENCES donors(id),
  FOREIGN KEY (center_id) REFERENCES centers(id)
);

CREATE TABLE IF NOT EXISTS pickups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT,
  volunteer_id INT,
  pickup_date DATE,
  delivered BOOLEAN DEFAULT 0,
  quantity INT DEFAULT 0,
  FOREIGN KEY (donation_id) REFERENCES donations(id),
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
);

CREATE TABLE IF NOT EXISTS distributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receiver_id INT,
  center_id INT,
  food_item VARCHAR(100),
  quantity INT,
  date_distributed DATE,
  FOREIGN KEY (receiver_id) REFERENCES receivers(id),
  FOREIGN KEY (center_id) REFERENCES centers(id)
);

CREATE TABLE IF NOT EXISTS food_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receiver_id INT NOT NULL,
  food_item VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  urgency ENUM('Low','Medium','High') DEFAULT 'Medium',
  status ENUM('Pending','Approved','Rejected','Fulfilled') DEFAULT 'Pending',
  request_date DATE NOT NULL,
  notes TEXT,
  assigned_donation_id INT DEFAULT NULL,
  FOREIGN KEY (receiver_id) REFERENCES receivers(id),
  FOREIGN KEY (assigned_donation_id) REFERENCES donations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW view_top_donors AS
SELECT d.name, SUM(o.quantity) AS total_quantity
FROM donors d JOIN donations o ON d.id=o.donor_id
GROUP BY d.id ORDER BY total_quantity DESC;

CREATE OR REPLACE VIEW view_expiring_soon AS
SELECT id, food_item, quantity, expiry_date
FROM donations
WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND status <> 'Expired';
