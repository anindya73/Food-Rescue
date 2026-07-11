const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");

router.get("/verify/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [[don]] = await pool.query(
      `
      SELECT d.*, donors.name AS donor_name, centers.name AS center_name
      FROM donations d JOIN donors ON donors.id=d.donor_id JOIN centers ON centers.id=d.center_id
      WHERE d.id=?
    `,
      [id]
    );
    if (!don) return res.status(404).send("Donation not found");
    res.render("verify", { don });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

router.get("/qr/:id", async (req, res) => {
  const id = req.params.id;
  const url = `${req.protocol}://${req.get("host")}/verify/${id}`;
  try {
    const png = await QRCode.toBuffer(url, { width: 256 });
    res.set("Content-Type", "image/png");
    return res.send(png);
  } catch (e) {
    res.status(500).send("QR error");
  }
});

router.get("/pdf/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [[don]] = await pool.query(
      `
      SELECT d.*, donors.name AS donor_name, centers.name AS center_name
      FROM donations d JOIN donors ON donors.id=d.donor_id JOIN centers ON centers.id=d.center_id
      WHERE d.id=?
    `,
      [id]
    );
    if (!don) return res.status(404).send("Donation not found");

    // Prevent browser caching so changes reflect immediately
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=donation_${id}.pdf`);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    doc
      .fillColor("#198754")
      .fontSize(24)
      .text("FoodRescue", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(20).text("FoodRescue - Donation Receipt", { align: "center" });
    doc.moveDown();
    doc.fillColor("black").fontSize(12);
    doc.text(`Donation ID: #${don.id}`);
    doc.text(`Donor: ${don.donor_name}`);
    doc.text(`Food Item: ${don.food_item}`);
    doc.text(
      `Quantity (kg/units): ${don.original_quantity || don.quantity} kg`
    );
    doc.text(`Center: ${don.center_name}`);
    // Format expiry as local date (YYYY-MM-DD)
    const expiryDate = new Date(don.expiry_date);
    const expiryStr =
      expiryDate.getFullYear() +
      "-" +
      String(expiryDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(expiryDate.getDate()).padStart(2, "0");
    doc.text(`Expiry: ${expiryStr}`);
    doc.text(`Status: ${don.status}`);
    doc.moveDown();
    // QR code and timestamp removed as requested
    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).send("PDF error");
  }
});

module.exports = router;
