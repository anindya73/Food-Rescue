const mysql = require("mysql2/promise");

// Helper to safely read and trim env values
const env = (key, fallback = "") => {
  const v = process.env[key];
  return (typeof v === "string" ? v.trim() : v) || fallback;
};

const pool = mysql.createPool({
  host: env("DB_HOST", "localhost"),
  user: env("DB_USER", "root"),
  password: env("DB_PASSWORD", ""),
  database: env("DB_NAME", "FoodRescue"),
  port: Number(env("DB_PORT", "3306")),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
