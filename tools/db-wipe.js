require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const preserveAdmin = process.argv.includes("--preserve-admin");
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
  let conn;
  try {
    conn = await mysql.createConnection({
      host: (DB_HOST || "localhost").trim(),
      user: (DB_USER || "root").trim(),
      password: (DB_PASSWORD || "").trim(),
      database: (DB_NAME || "FoodRescue").trim(),
      port: Number((DB_PORT || "3306").trim()),
      multipleStatements: true,
    });
  } catch (e) {
    console.error("Failed to connect to MySQL:", e.message || e);
    process.exit(1);
  }

  console.log(
    `Connected to MySQL. Wiping database "${DB_NAME}"${
      preserveAdmin ? " (preserving admin users)" : ""
    }...`
  );
  try {
    await conn.query("SET FOREIGN_KEY_CHECKS=0");
  } catch (e) {
    console.error("Failed to disable foreign key checks:", e.message || e);
    await conn.end();
    process.exit(1);
  }

  const tablesOrder = [
    "food_requests",
    "distributions",
    "pickups",
    "donations",
    "donors",
    "volunteers",
    "receivers",
    "centers",
    "sessions",
  ];

  for (const t of tablesOrder) {
    try {
      await conn.query(`TRUNCATE TABLE \`${t}\``);
      console.log(`TRUNCATE ${t}: OK`);
    } catch (e) {
      console.warn(
        `TRUNCATE ${t}: FAILED -> ${
          e.code || e.message
        }, falling back to DELETE`
      );
      try {
        await conn.query(`DELETE FROM \`${t}\``);
        console.log(`DELETE FROM ${t}: OK`);
      } catch (delErr) {
        console.error(
          `DELETE FROM ${t}: FAILED -> ${delErr.code || delErr.message}`
        );
      }
    }
  }

  // Handle users last
  if (preserveAdmin) {
    try {
      await conn.query("DELETE FROM `users` WHERE role <> 'admin'");
      console.log("Deleted non-admin users.");
    } catch (e) {
      console.error("Failed to delete non-admin users:", e.code || e.message);
    }
  } else {
    try {
      await conn.query("TRUNCATE TABLE `users`");
      console.log("TRUNCATE users: OK");
    } catch (e) {
      console.warn(
        `TRUNCATE users: FAILED -> ${
          e.code || e.message
        }, falling back to DELETE`
      );
      try {
        await conn.query("DELETE FROM `users`");
        console.log("DELETE FROM users: OK");
      } catch (delErr) {
        console.error(
          `DELETE FROM users: FAILED -> ${delErr.code || delErr.message}`
        );
      }
    }
  }

  try {
    await conn.query("SET FOREIGN_KEY_CHECKS=1");
  } catch (e) {
    console.error("Failed to re-enable foreign key checks:", e.message || e);
  }
  await conn.end();
  console.log("Database wipe completed.");
})().catch((e) => {
  console.error("DB wipe failed:", e.message || e);
  process.exit(1);
});
