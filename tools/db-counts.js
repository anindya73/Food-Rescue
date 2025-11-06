require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const {
    DB_HOST = "localhost",
    DB_USER = "root",
    DB_PASSWORD = "",
    DB_NAME = "FoodRescue",
    DB_PORT = "3306",
  } = process.env;
  const conn = await mysql.createConnection({
    host: DB_HOST.trim(),
    user: DB_USER.trim(),
    password: DB_PASSWORD.trim(),
    database: DB_NAME.trim(),
    port: Number(DB_PORT.trim()),
  });

  const [tablesRows] = await conn.query("SHOW TABLES");
  if (!tablesRows.length) {
    console.log("No tables found in database:", DB_NAME);
    await conn.end();
    process.exit(0);
  }

  const key = Object.keys(tablesRows[0])[0]; // e.g., 'Tables_in_FoodRescue'
  const tableNames = tablesRows.map((r) => r[key]).sort();

  for (const t of tableNames) {
    try {
      const [r] = await conn.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
      console.log(`${t}: ${r[0].c}`);
    } catch (e) {
      console.log(`${t}: ERROR -> ${e.code || e.message}`);
    }
  }

  await conn.end();
})().catch((e) => {
  console.error("db-counts failed:", e);
  process.exit(1);
});
