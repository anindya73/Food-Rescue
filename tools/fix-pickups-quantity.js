require("dotenv").config();
const mysql = require("mysql2/promise");

/**
 * Migration script to add quantity column to pickups table
 * and populate it from food_requests or a default value
 */

(async () => {
  console.log("Starting pickups table migration...");

  const conn = await mysql.createConnection({
    host: (process.env.DB_HOST || "localhost").trim(),
    user: (process.env.DB_USER || "root").trim(),
    password: (process.env.DB_PASSWORD || "").trim(),
    database: (process.env.DB_NAME || "FoodRescue").trim(),
  });

  try {
    // Check if quantity column exists
    const [columns] = await conn.query(
      "SHOW COLUMNS FROM pickups LIKE 'quantity'"
    );

    if (columns.length === 0) {
      console.log("Adding quantity column to pickups table...");
      await conn.query(
        "ALTER TABLE pickups ADD COLUMN quantity INT DEFAULT 0 AFTER delivered"
      );
      console.log("✓ Column added successfully");
    } else {
      console.log("✓ Quantity column already exists");
    }

    // First, try to update from food_requests via donations
    console.log("\n1. Updating pickups with quantities from food_requests...");
    const [result1] = await conn.query(`
      UPDATE pickups p
      JOIN food_requests fr ON fr.assigned_donation_id = p.donation_id
      SET p.quantity = fr.quantity
      WHERE (p.quantity = 0 OR p.quantity IS NULL)
        AND fr.status = 'Fulfilled'
        AND fr.assigned_donation_id IS NOT NULL
    `);
    console.log(
      `   ✓ Updated ${result1.affectedRows} pickups from food_requests`
    );

    // Second, for remaining zeros, try to get from donations if they still have quantity
    console.log(
      "\n2. Updating remaining pickups from donations (if quantity > 0)..."
    );
    const [result2] = await conn.query(`
      UPDATE pickups p
      JOIN donations d ON p.donation_id = d.id
      SET p.quantity = d.quantity
      WHERE (p.quantity = 0 OR p.quantity IS NULL)
        AND d.quantity > 0
    `);
    console.log(`   ✓ Updated ${result2.affectedRows} pickups from donations`);

    // Third, for delivered items with still 0, set a default value of 10
    console.log(
      "\n3. Setting default quantity (10 kg) for remaining zero-quantity pickups..."
    );
    const [result3] = await conn.query(`
      UPDATE pickups
      SET quantity = 10
      WHERE (quantity = 0 OR quantity IS NULL)
        AND delivered = 1
    `);
    console.log(
      `   ✓ Updated ${result3.affectedRows} delivered pickups with default quantity`
    );

    // Show summary
    const [[{ total }]] = await conn.query(
      "SELECT COUNT(*) as total FROM pickups"
    );
    const [[{ withQty }]] = await conn.query(
      "SELECT COUNT(*) as withQty FROM pickups WHERE quantity > 0"
    );
    const [[{ delivered }]] = await conn.query(
      "SELECT COUNT(*) as delivered FROM pickups WHERE delivered = 1"
    );

    console.log("\n" + "=".repeat(50));
    console.log("MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total pickups:                    ${total}`);
    console.log(`Pickups with quantity > 0:        ${withQty}`);
    console.log(`Pickups with quantity = 0:        ${total - withQty}`);
    console.log(`Delivered pickups:                ${delivered}`);
    console.log("=".repeat(50));

    // Show some example data
    console.log("\nSample pickup data:");
    const [samples] = await conn.query(`
      SELECT p.id, p.quantity, p.delivered, d.food_item, d.quantity as donation_qty
      FROM pickups p
      JOIN donations d ON p.donation_id = d.id
      ORDER BY p.id DESC
      LIMIT 10
    `);
    console.table(samples);

    console.log("\n✅ Migration completed successfully!");
  } catch (e) {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
