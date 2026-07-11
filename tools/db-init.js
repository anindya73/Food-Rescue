require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

(async () => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const conn = await mysql.createConnection({
    host: (DB_HOST || "localhost").trim(),
    user: (DB_USER || "root").trim(),
    password: (DB_PASSWORD || "").trim(),
  });
  // Create DB first
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.query(`USE \`${DB_NAME}\``);
  // Load schema.sql but strip CREATE/USE and split
  let schema = fs.readFileSync(
    path.join(__dirname, "../sql/schema.sql"),
    "utf8"
  );
  schema = schema
    .split("\n")
    .filter((line) => !/^\s*CREATE DATABASE|^\s*USE\s+/i.test(line))
    .join("\n");
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await conn.query(stmt);
  }
  console.log("Schema created.");
  await conn.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
