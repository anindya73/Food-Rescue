const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureRole } = require("../utils/auth");

router.get("/", ensureRole("receiver"), async (req, res) => {
  try {
    // Get available food at centers
    const [available] = await pool.query(`
      SELECT d.id, d.food_item, d.quantity, d.expiry_date, c.name AS center_name
      FROM donations d JOIN centers c ON d.center_id=c.id
      WHERE d.status='Delivered' AND d.expiry_date >= CURDATE() AND d.quantity > 0
      ORDER BY d.expiry_date ASC
    `);

    // Get receiver's food requests
    const [requests] = await pool.query(
      `
      SELECT id, food_item, quantity, urgency, status, request_date, notes
      FROM food_requests
      WHERE receiver_id = ?
      ORDER BY request_date DESC, created_at DESC
    `,
      [req.user.entity_id]
    );

    res.render("receiver/dashboard", { available, requests });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load dashboard");
    res.render("receiver/dashboard", { available: [], requests: [] });
  }
});

// Create new food request
router.post("/request", ensureRole("receiver"), async (req, res) => {
  const { food_item, quantity, urgency, notes } = req.body;

  if (!food_item || !quantity) {
    req.flash("error", "Food item and quantity are required");
    return res.redirect("/receiver");
  }

  try {
    await pool.query(
      "INSERT INTO food_requests(receiver_id, food_item, quantity, urgency, status, request_date, notes) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)",
      [
        req.user.entity_id,
        food_item,
        quantity,
        urgency || "Medium",
        "Pending",
        notes || null,
      ]
    );

    req.flash("success", "Food request submitted successfully!");
    res.redirect("/receiver");
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to submit food request");
    res.redirect("/receiver");
  }
});

// Old route - kept for backward compatibility but can be removed
router.post(
  "/request/:donationId",
  ensureRole("receiver"),
  async (req, res) => {
    const donationId = req.params.donationId;
    try {
      const [[don]] = await pool.query("SELECT * FROM donations WHERE id=?", [
        donationId,
      ]);
      if (!don) {
        req.flash("error", "Donation not found");
        return res.redirect("/receiver");
      }
      await pool.query(
        "INSERT INTO distributions(receiver_id,center_id,food_item,quantity,date_distributed) VALUES (?,?,?,?,CURDATE())",
        [req.user.entity_id, don.center_id, don.food_item, don.quantity]
      );
      await pool.query(
        "UPDATE donations SET quantity=0, status='Allocated' WHERE id=?",
        [donationId]
      );
      req.flash("success", "Request created, allocation done.");
      res.redirect("/receiver");
    } catch (e) {
      console.error(e);
      req.flash("error", "Failed to process request");
      res.redirect("/receiver");
    }
  }
);

module.exports = router;
