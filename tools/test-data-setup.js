require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

(async () => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const conn = await mysql.createConnection({
    host: (DB_HOST || "localhost").trim(),
    user: (DB_USER || "root").trim(),
    password: (DB_PASSWORD || "").trim(),
    database: (DB_NAME || "FoodRescue").trim(),
  });

  console.log("Creating test data for Food Request feature...");

  // Create a receiver
  const [receiverResult] = await conn.query(
    "INSERT INTO receivers (name, contact, address) VALUES (?, ?, ?)",
    ["Hope Shelter", "555-1234", "123 Main St"]
  );
  const receiverId = receiverResult.insertId;
  console.log("✓ Created receiver: Hope Shelter");

  // Create receiver user
  const receiverPass = await bcrypt.hash("receiver123", 10);
  await conn.query(
    "INSERT INTO users(name, email, password_hash, role, entity_id) VALUES (?,?,?,?,?)",
    [
      "Hope Shelter",
      "receiver@example.com",
      receiverPass,
      "receiver",
      receiverId,
    ]
  );
  console.log(
    "✓ Created receiver user: receiver@example.com (password: receiver123)"
  );

  // Create a donor
  const [donorResult] = await conn.query(
    "INSERT INTO donors (name, contact, address) VALUES (?, ?, ?)",
    ["GreenLeaf Restaurant", "555-5678", "456 Oak Ave"]
  );
  const donorId = donorResult.insertId;
  console.log("✓ Created donor: GreenLeaf Restaurant");

  // Create donor user
  const donorPass = await bcrypt.hash("donor123", 10);
  await conn.query(
    "INSERT INTO users(name, email, password_hash, role, entity_id) VALUES (?,?,?,?,?)",
    ["GreenLeaf Restaurant", "donor@example.com", donorPass, "donor", donorId]
  );
  console.log("✓ Created donor user: donor@example.com (password: donor123)");

  // Create a center
  const [centerResult] = await conn.query(
    "INSERT INTO centers (name, location, capacity) VALUES (?, ?, ?)",
    ["Central Food Hub", "Downtown District", 1000]
  );
  const centerId = centerResult.insertId;
  console.log("✓ Created center: Central Food Hub");

  // Create delivered donations
  await conn.query(
    `
    INSERT INTO donations (donor_id, food_item, quantity, expiry_date, center_id, status) VALUES 
    (?, 'Rice', 50, DATE_ADD(CURDATE(), INTERVAL 30 DAY), ?, 'Delivered'),
    (?, 'Bread', 20, DATE_ADD(CURDATE(), INTERVAL 5 DAY), ?, 'Delivered'),
    (?, 'Vegetables', 30, DATE_ADD(CURDATE(), INTERVAL 7 DAY), ?, 'Delivered'),
    (?, 'Canned Food', 40, DATE_ADD(CURDATE(), INTERVAL 60 DAY), ?, 'Delivered'),
    (?, 'Fruits', 25, DATE_ADD(CURDATE(), INTERVAL 10 DAY), ?, 'Delivered')
  `,
    [
      donorId,
      centerId,
      donorId,
      centerId,
      donorId,
      centerId,
      donorId,
      centerId,
      donorId,
      centerId,
    ]
  );
  console.log("✓ Created 5 available donations at center");

  // Create a volunteer for completeness
  const [volResult] = await conn.query(
    "INSERT INTO volunteers (name, phone, assigned_area) VALUES (?, ?, ?)",
    ["John Doe", "555-9999", "Downtown"]
  );
  const volId = volResult.insertId;

  const volPass = await bcrypt.hash("volunteer123", 10);
  await conn.query(
    "INSERT INTO users(name, email, password_hash, role, entity_id) VALUES (?,?,?,?,?)",
    ["John Doe", "volunteer@example.com", volPass, "volunteer", volId]
  );
  console.log(
    "✓ Created volunteer user: volunteer@example.com (password: volunteer123)"
  );

  console.log("\n=== Test Setup Complete! ===\n");
  console.log("You can now login with:");
  console.log("  Admin: admin@example.com / admin123");
  console.log("  Donor: donor@example.com / donor123");
  console.log("  Receiver: receiver@example.com / receiver123");
  console.log("  Volunteer: volunteer@example.com / volunteer123");
  console.log("\nTo test the Food Request feature:");
  console.log("1. Login as receiver@example.com");
  console.log("2. Submit a food request (e.g., Rice, 10 kg, High urgency)");
  console.log("3. Login as admin@example.com");
  console.log("4. View pending requests on dashboard");
  console.log('5. Click "Assign" to fulfill the request');

  await conn.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
