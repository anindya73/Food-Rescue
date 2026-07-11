require("dotenv").config();
const fs = require("fs");
const path = require("path");
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

  // Seed base data
  let seed = fs.readFileSync(path.join(__dirname, "../sql/seed.sql"), "utf8");
  seed = seed
    .split("\n")
    .filter((line) => !/^\s*USE\s+/i.test(line))
    .join("\n");
  const statements = seed
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await conn.query(stmt);
  }

  // Create sample users
  const [donor1] = await conn.query(
    "SELECT id FROM donors WHERE name='GreenLeaf Restaurant'"
  );
  const [vol1] = await conn.query(
    "SELECT id FROM volunteers WHERE name='Aman Gupta'"
  );
  const [rec1] = await conn.query(
    "SELECT id FROM receivers WHERE name='Hope Shelter'"
  );

  const adminPass = await bcrypt.hash("admin123", 10);
  const donorPass = await bcrypt.hash("donor123", 10);
  const volPass = await bcrypt.hash("vol123", 10);
  const recPass = await bcrypt.hash("recv123", 10);

  await conn.query(
    "INSERT IGNORE INTO users(name,email,password_hash,role,entity_id) VALUES (?,?,?,?,?)",
    ["Admin", "admin@foodrescue.local", adminPass, "admin", null]
  );
  if (donor1.length)
    await conn.query(
      "INSERT IGNORE INTO users(name,email,password_hash,role,entity_id) VALUES (?,?,?,?,?)",
      [
        "GreenLeaf Restaurant",
        "donor@foodrescue.local",
        donorPass,
        "donor",
        donor1[0].id,
      ]
    );
  if (vol1.length)
    await conn.query(
      "INSERT IGNORE INTO users(name,email,password_hash,role,entity_id) VALUES (?,?,?,?,?)",
      [
        "Aman Gupta",
        "volunteer@foodrescue.local",
        volPass,
        "volunteer",
        vol1[0].id,
      ]
    );
  if (rec1.length)
    await conn.query(
      "INSERT IGNORE INTO users(name,email,password_hash,role,entity_id) VALUES (?,?,?,?,?)",
      [
        "Hope Shelter",
        "receiver@foodrescue.local",
        recPass,
        "receiver",
        rec1[0].id,
      ]
    );

  // Create a delivered pickup if exists
  const [don] = await conn.query(
    "SELECT id, center_id, food_item, quantity FROM donations WHERE status='Delivered' LIMIT 1"
  );
  if (don.length && vol1.length) {
    await conn.query(
      "INSERT IGNORE INTO pickups(donation_id, volunteer_id, pickup_date, delivered) VALUES (?,?,CURDATE(),1)",
      [don[0].id, vol1[0].id]
    );
  }

  console.log("Seed data inserted and users created.");
  await conn.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
