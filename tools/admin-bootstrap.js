#!/usr/bin/env node
// Creates an initial admin user if none exists. Uses env ADMIN_EMAIL/ADMIN_PASSWORD or defaults.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

(async () => {
  try {
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role='admin'"
    );
    if (count > 0) {
      console.log("Admin user already exists. No action taken.");
      return;
    }
    const email = (process.env.ADMIN_EMAIL || "admin@example.com").trim();
    const name = process.env.ADMIN_NAME || "Administrator";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users(name, email, password_hash, role, entity_id) VALUES (?,?,?,?,NULL)",
      [name, email, password_hash, "admin"]
    );
    console.log("Admin user created successfully:");
    console.log("  Email:", email);
    console.log("  Password:", password);
    console.log("Please change this password after first login.");
  } catch (e) {
    console.error("Failed to bootstrap admin:", e.message);
    process.exitCode = 1;
  } finally {
    pool.end();
  }
})();
