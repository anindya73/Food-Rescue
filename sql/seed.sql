USE FoodRescue;

INSERT INTO centers (name, location, capacity) VALUES
('Central Redistribution Hub', 'MG Road', 1000),
('North Storage', 'Sector 21', 600);

INSERT INTO donors (name, contact, address) VALUES
('GreenLeaf Restaurant', '9876543210', 'HSR Layout'),
('FreshMart Grocery', '9765432109', 'Indiranagar');

INSERT INTO volunteers (name, phone, assigned_area) VALUES
('Aman Gupta', '9998887771', 'HSR'),
('Pooja N', '9998887772', 'Indiranagar');

INSERT INTO receivers (name, contact, address) VALUES
('Hope Shelter', '8887776661', 'BTM'),
('Care NGO', '8887776662', 'Koramangala');

INSERT INTO donations (donor_id, food_item, quantity, expiry_date, center_id, status) VALUES
(1, 'Cooked Rice', 30, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 1, 'Pending'),
(2, 'Bread Loaves', 50, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 2, 'Delivered');
