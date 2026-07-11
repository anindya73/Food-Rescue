const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureRole } = require("../utils/auth");

router.get("/", ensureRole("volunteer"), async (req, res) => {
  try {
    const [pickups] = await pool.query(
      `
      SELECT p.id, d.food_item, p.quantity, c.name AS center_name, p.pickup_date, p.delivered, d.id AS donation_id
      FROM pickups p JOIN donations d ON p.donation_id=d.id JOIN centers c ON d.center_id=c.id
      WHERE p.volunteer_id=? ORDER BY p.pickup_date DESC
    `,
      [req.user.entity_id]
    );
    res.render("volunteer/dashboard", { pickups });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load pickups");
    res.render("volunteer/dashboard", { pickups: [] });
  }
});

router.post("/deliver/:id", ensureRole("volunteer"), async (req, res) => {
  const pid = req.params.id;
  try {
    await pool.query("UPDATE pickups SET delivered=1 WHERE id=?", [pid]);
    const [[row]] = await pool.query(
      "SELECT donation_id FROM pickups WHERE id=?",
      [pid]
    );
    if (row)
      await pool.query("UPDATE donations SET status='Delivered' WHERE id=?", [
        row.donation_id,
      ]);
    req.flash("success", "Marked delivered");
    res.redirect("/volunteer");
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to mark as delivered");
    res.redirect("/volunteer");
  }
});

module.exports = router;
