const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureRole } = require("../utils/auth");

router.get("/", ensureRole("admin"), async (req, res) => {
  try {
    // Core metrics
    const [[{ total_donations }]] = await pool.query(
      "SELECT COUNT(*) AS total_donations FROM donations"
    );
    const [[{ pending_donations }]] = await pool.query(
      "SELECT COUNT(*) AS pending_donations FROM donations WHERE status='Pending'"
    );
    const [[{ delivered_donations }]] = await pool.query(
      "SELECT COUNT(*) AS delivered_donations FROM donations WHERE status='Delivered'"
    );
    const [[{ expiring_3days }]] = await pool.query(
      "SELECT COUNT(*) AS expiring_3days FROM donations WHERE expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND status != 'Expired' AND quantity > 0"
    );

    // User counts
    const [[{ total_donors }]] = await pool.query(
      "SELECT COUNT(*) AS total_donors FROM donors"
    );
    const [[{ total_volunteers }]] = await pool.query(
      "SELECT COUNT(*) AS total_volunteers FROM volunteers"
    );
    const [[{ total_receivers }]] = await pool.query(
      "SELECT COUNT(*) AS total_receivers FROM receivers"
    );
    const [[{ total_centers }]] = await pool.query(
      "SELECT COUNT(*) AS total_centers FROM centers"
    );

    // Top performers
    const [topDonors] = await pool.query(`
      SELECT d.name, SUM(o.quantity) AS total_qty, COUNT(o.id) AS donation_count
      FROM donors d JOIN donations o ON d.id=o.donor_id
      GROUP BY d.id ORDER BY total_qty DESC LIMIT 5
    `);
    const [volPerf] = await pool.query(`
      SELECT v.name, SUM(p.delivered=1) AS delivered_count, COUNT(p.id) AS total_assigned
      FROM volunteers v LEFT JOIN pickups p ON v.id=p.volunteer_id
      GROUP BY v.id ORDER BY delivered_count DESC LIMIT 5
    `);

    // Recent activity
    const [recentDonations] = await pool.query(`
      SELECT d.id, d.food_item, d.quantity, d.status, donors.name AS donor_name, centers.name AS center_name
      FROM donations d 
      JOIN donors ON donors.id=d.donor_id 
      JOIN centers ON centers.id=d.center_id
      ORDER BY d.id DESC LIMIT 5
    `);

    // Status breakdown
    const [statusBreakdown] = await pool.query(`
      SELECT status, COUNT(*) AS count 
      FROM donations 
      GROUP BY status
    `);

    // Pending food requests from receivers
    const [foodRequests] = await pool.query(`
      SELECT fr.id, fr.food_item, fr.quantity, fr.urgency, fr.request_date, fr.notes, r.name AS receiver_name, fr.receiver_id
      FROM food_requests fr
      JOIN receivers r ON r.id = fr.receiver_id
      WHERE fr.status = 'Pending'
      ORDER BY 
        CASE fr.urgency 
          WHEN 'High' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Low' THEN 3 
        END,
        fr.request_date ASC
      LIMIT 10
    `);

    // Get all volunteers for assignment dropdown
    const [total_volunteers_list] = await pool.query(
      "SELECT id, name FROM volunteers"
    );

    // Get available food (donations with status Pending or Delivered and quantity > 0)
    const [availableFood] = await pool.query(`
      SELECT d.food_item, d.quantity, d.expiry_date, c.name AS center_name
      FROM donations d
      JOIN centers c ON c.id = d.center_id
      WHERE d.status IN ('Pending', 'Delivered') AND d.quantity > 0 AND d.expiry_date >= CURDATE()
      ORDER BY d.expiry_date ASC
    `);

    res.render("admin/dashboard", {
      total_donations,
      pending_donations,
      delivered_donations,
      expiring_3days,
      total_donors,
      total_volunteers,
      total_receivers,
      total_centers,
      topDonors,
      volPerf,
      recentDonations,
      statusBreakdown,
      foodRequests,
      total_volunteers_list,
      availableFood,
    });
  } catch (e) {
    console.error(e);
    res.render("admin/dashboard", {
      total_donations: 0,
      pending_donations: 0,
      delivered_donations: 0,
      expiring_3days: 0,
      total_donors: 0,
      total_volunteers: 0,
      total_receivers: 0,
      total_centers: 0,
      topDonors: [],
      volPerf: [],
      recentDonations: [],
      statusBreakdown: [],
      foodRequests: [],
      total_volunteers_list: [],
    });
  }
});

router.get("/assign", ensureRole("admin"), async (req, res) => {
  try {
    const [donations] = await pool.query(`
      SELECT d.id, d.food_item, d.quantity, c.name AS center_name
      FROM donations d JOIN centers c ON c.id=d.center_id
      WHERE d.status='Pending'
    `);
    const [volunteers] = await pool.query("SELECT id, name FROM volunteers");
    res.render("admin/assign", { donations, volunteers });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load assignment page");
    res.redirect("/admin");
  }
});

router.post("/assign", ensureRole("admin"), async (req, res) => {
  const { donation_id, volunteer_id } = req.body;
  try {
    if (!donation_id || !volunteer_id) {
      req.flash("error", "Donation and volunteer are required");
      return res.redirect("/admin/assign");
    }

    // Get the donation quantity before assignment
    const [[donation]] = await pool.query(
      "SELECT quantity FROM donations WHERE id=?",
      [donation_id]
    );

    if (!donation) {
      req.flash("error", "Donation not found");
      return res.redirect("/admin/assign");
    }

    await pool.query(
      "INSERT INTO pickups(donation_id, volunteer_id, pickup_date, delivered, quantity) VALUES (?,?,CURDATE(),0,?)",
      [donation_id, volunteer_id, donation.quantity]
    );
    await pool.query(`UPDATE donations SET status='Picked Up' WHERE id=?`, [
      donation_id,
    ]);
    req.flash("success", "Pickup assigned");
    res.redirect("/admin/assign");
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to assign pickup");
    res.redirect("/admin/assign");
  }
});

router.get("/reports", ensureRole("admin"), async (req, res) => {
  try {
    const [expiring] = await pool.query(
      "SELECT food_item, quantity, expiry_date FROM donations WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND status != 'Expired' AND quantity > 0"
    );
    const [served] = await pool.query(
      `SELECT r.name, COUNT(d.id) AS total FROM receivers r JOIN distributions d ON r.id=d.receiver_id GROUP BY r.name`
    );
    res.render("admin/reports", { expiring, served });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load reports");
    res.redirect("/admin");
  }
});

router.get("/centers", ensureRole("admin"), async (req, res) => {
  try {
    const [centers] = await pool.query(
      "SELECT id, name, location, capacity FROM centers ORDER BY id DESC"
    );
    res.render("admin/centers", { centers });
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to load centers");
    res.redirect("/admin");
  }
});

router.post("/centers", ensureRole("admin"), async (req, res) => {
  const { name, location, capacity } = req.body;
  if (!name || !location) {
    req.flash("error", "Name and location are required");
    return res.redirect("/admin/centers");
  }
  try {
    await pool.query(
      "INSERT INTO centers(name, location, capacity) VALUES (?,?,?)",
      [name, location, Number(capacity || 0)]
    );
    req.flash("success", "Center added");
  } catch (e) {
    console.error(e);
    req.flash("error", "Failed to add center");
  }
  res.redirect("/admin/centers");
});

// Assign delivery to receiver's food request
router.post(
  "/assign-request/:requestId",
  ensureRole("admin"),
  async (req, res) => {
    const requestId = req.params.requestId;
    const { volunteer_id } = req.body;
    try {
      // Validate volunteer_id is provided
      if (!volunteer_id) {
        req.flash("error", "Please select a volunteer");
        return res.redirect("/admin");
      }

      console.log(
        `Assigning request ${requestId} to volunteer ${volunteer_id}`
      );

      // Get the food request details
      const [[request]] = await pool.query(
        "SELECT * FROM food_requests WHERE id = ? AND status = 'Pending'",
        [requestId]
      );

      if (!request) {
        req.flash("error", "Food request not found or already processed");
        return res.redirect("/admin");
      }

      // Find a suitable donation that matches the request
      const [[donation]] = await pool.query(
        `
      SELECT d.id, d.center_id, d.food_item, d.quantity
      FROM donations d
      WHERE d.status IN ('Pending', 'Delivered')
        AND d.food_item LIKE ?
        AND d.quantity >= ?
        AND d.expiry_date >= CURDATE()
      ORDER BY d.expiry_date ASC
      LIMIT 1
    `,
        [`%${request.food_item}%`, request.quantity]
      );

      if (!donation) {
        console.log(
          `No donation found for: ${request.food_item}, qty: ${request.quantity}`
        );
        req.flash(
          "error",
          `No available donation found matching "${request.food_item}" with quantity ${request.quantity} kg`
        );
        return res.redirect("/admin");
      }

      console.log(
        `Found donation #${donation.id}: ${donation.food_item} (${donation.quantity} kg)`
      );

      // Create distribution record
      await pool.query(
        "INSERT INTO distributions(receiver_id, center_id, food_item, quantity, date_distributed) VALUES (?,?,?,?,CURDATE())",
        [
          request.receiver_id,
          donation.center_id,
          donation.food_item,
          request.quantity,
        ]
      );

      // Update donation quantity
      const newQuantity = donation.quantity - request.quantity;
      if (newQuantity <= 0) {
        await pool.query(
          "UPDATE donations SET quantity=0, status='Allocated' WHERE id=?",
          [donation.id]
        );
      } else {
        await pool.query("UPDATE donations SET quantity=? WHERE id=?", [
          newQuantity,
          donation.id,
        ]);
      }

      // Update food request status
      await pool.query(
        "UPDATE food_requests SET status='Fulfilled', assigned_donation_id=? WHERE id=?",
        [donation.id, requestId]
      );

      // Create pickup record for volunteer (store the assigned quantity)
      await pool.query(
        "INSERT INTO pickups(donation_id, volunteer_id, pickup_date, delivered, quantity) VALUES (?,?,CURDATE(),0,?)",
        [donation.id, volunteer_id, request.quantity]
      );

      console.log(
        `Successfully assigned request ${requestId} to volunteer ${volunteer_id}`
      );
      req.flash(
        "success",
        `Successfully assigned ${request.quantity} kg of ${request.food_item} to the receiver and volunteer.`
      );
    } catch (e) {
      console.error("Assignment error:", e);
      req.flash("error", `Failed to assign delivery: ${e.message}`);
    }

    res.redirect("/admin");
  }
);

// Delete food request
router.post(
  "/delete-request/:requestId",
  ensureRole("admin"),
  async (req, res) => {
    const requestId = req.params.requestId;
    try {
      await pool.query("DELETE FROM food_requests WHERE id = ?", [requestId]);
      console.log(`Deleted food request #${requestId}`);
      req.flash("success", "Food request deleted successfully");
    } catch (e) {
      console.error("Delete request error:", e);
      req.flash("error", "Failed to delete food request");
    }
    res.redirect("/admin");
  }
);

module.exports = router;
