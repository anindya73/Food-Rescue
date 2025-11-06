const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureRole } = require("../utils/auth");

router.get("/", ensureRole("donor"), async (req, res) => {
  try {
    const [donations] = await pool.query(
      "SELECT * FROM donations WHERE donor_id=? ORDER BY id DESC",
      [req.user.entity_id]
    );
    res.render("donor/dashboard", { donations });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load donations");
    res.render("donor/dashboard", { donations: [] });
  }
});

router.get("/donate", ensureRole("donor"), async (req, res) => {
  try {
    const [centers] = await pool.query("SELECT id,name FROM centers");
    res.render("donor/donate", { centers });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load centers");
    res.redirect("/donor");
  }
});

router.post("/donate", ensureRole("donor"), async (req, res) => {
  const { food_item, quantity, expiry_date, center_id } = req.body;
  try {
    if (!food_item || !quantity || !expiry_date || !center_id) {
      req.flash("error", "All fields are required");
      return res.redirect("/donor/donate");
    }
    await pool.query(
      "INSERT INTO donations(donor_id,food_item,quantity,original_quantity,expiry_date,center_id,status) VALUES (?,?,?,?,?,?,?)",
      [
        req.user.entity_id,
        food_item,
        quantity,
        quantity,
        expiry_date,
        center_id,
        "Pending",
      ]
    );
    req.flash("success", "Donation created");
    res.redirect("/donor");
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to create donation");
    res.redirect("/donor/donate");
  }
});

module.exports = router;
