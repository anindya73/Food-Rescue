require("dotenv").config();
const mysql = require("mysql2/promise");
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: (process.env.DB_HOST || "localhost").trim(),
      user: (process.env.DB_USER || "root").trim(),
      password: (process.env.DB_PASSWORD || "").trim(),
      database: (process.env.DB_NAME || "FoodRescue").trim(),
      port: Number((process.env.DB_PORT || "3306").trim()),
    });
    try {
      await conn.query(
        "ALTER TABLE donations ADD COLUMN original_quantity INT DEFAULT NULL"
      );
      console.log("ALTER TABLE executed: original_quantity added");
    } catch (e) {
      if (e && e.code === "ER_DUP_FIELDNAME")
        console.log("Column already exists");
      else console.error("ALTER TABLE failed:", e.message || e);
    }
    await conn.end();
  } catch (e) {
    console.error("Connection failed:", e.message || e);
    process.exit(1);
  }
})();
