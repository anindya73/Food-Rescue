require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const conn = await mysql.createConnection({
    host: (DB_HOST || "localhost").trim(),
    user: (DB_USER || "root").trim(),
    password: (DB_PASSWORD || "").trim(),
    database: (DB_NAME || "FoodRescue").trim(),
  });

  console.log("Adding sample food requests...");

  // Get a receiver ID
  const [receivers] = await conn.query(
    "SELECT id, name FROM receivers LIMIT 1"
  );
  if (receivers.length === 0) {
    console.log("No receivers found. Please run db:seed first.");
    await conn.end();
    return;
  }

  const receiverId = receivers[0].id;
  const receiverName = receivers[0].name;
  console.log(`Using receiver: ${receiverName} (ID: ${receiverId})`);

  // Add sample food requests
  const sampleRequests = [
    {
      food_item: "Rice",
      quantity: 25,
      urgency: "High",
      notes: "Urgent need for feeding program",
    },
    {
      food_item: "Bread",
      quantity: 15,
      urgency: "Medium",
      notes: "For breakfast distribution",
    },
    {
      food_item: "Vegetables",
      quantity: 20,
      urgency: "Low",
      notes: "Fresh vegetables needed",
    },
  ];

  for (const req of sampleRequests) {
    await conn.query(
      "INSERT INTO food_requests(receiver_id, food_item, quantity, urgency, status, request_date, notes) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)",
      [
        receiverId,
        req.food_item,
        req.quantity,
        req.urgency,
        "Pending",
        req.notes,
      ]
    );
    console.log(
      `✓ Added request: ${req.food_item} (${req.quantity} kg, ${req.urgency} urgency)`
    );
  }

  console.log("\n✅ Sample food requests added successfully!");
  console.log("Refresh your admin dashboard to see them.");

  await conn.end();
})().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
