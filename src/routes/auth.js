const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

router.get("/login", (req, res) => {
  console.log(
    "Login GET - error:",
    res.locals.error,
    "success:",
    res.locals.success
  );
  res.render("auth/login");
});

router.get("/register", (req, res) => {
  console.log(
    "Register GET - error:",
    res.locals.error,
    "success:",
    res.locals.success
  );
  res.render("auth/register");
});

router.post("/register", async (req, res) => {
  let { name, email, password, role } = req.body;

  // Trim whitespace from inputs
  name = name ? name.trim() : "";
  email = email ? email.trim().toLowerCase() : "";

  // Validate required fields
  if (!name || !email || !password || !role) {
    req.flash("error", "All fields are required.");
    return req.session.save(() => res.redirect("/register"));
  }

  try {
    // Check for duplicate email in users table (case-insensitive)
    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
      [email]
    );
    if (existingEmail.length > 0) {
      req.flash(
        "error",
        "Email already registered. Please use a different email address."
      );
      return req.session.save(() => res.redirect("/register"));
    }

    // Check for duplicate name in users table (case-insensitive)
    const [existingName] = await pool.query(
      "SELECT id FROM users WHERE LOWER(TRIM(name)) = LOWER(?)",
      [name]
    );
    if (existingName.length > 0) {
      console.log("Duplicate name found, setting flash error");
      req.flash("error", "An account with this name already exists.");
      return req.session.save(() => res.redirect("/register"));
    }

    // Check for duplicate name in the respective entity table (case-insensitive)
    if (role === "donor") {
      const [existingDonor] = await pool.query(
        "SELECT id FROM donors WHERE LOWER(TRIM(name)) = LOWER(?)",
        [name]
      );
      if (existingDonor.length > 0) {
        req.flash("error", "A donor with this name already exists.");
        return req.session.save(() => res.redirect("/register"));
      }
    } else if (role === "volunteer") {
      const [existingVolunteer] = await pool.query(
        "SELECT id FROM volunteers WHERE LOWER(TRIM(name)) = LOWER(?)",
        [name]
      );
      if (existingVolunteer.length > 0) {
        req.flash("error", "A volunteer with this name already exists.");
        return req.session.save(() => res.redirect("/register"));
      }
    } else if (role === "receiver") {
      const [existingReceiver] = await pool.query(
        "SELECT id FROM receivers WHERE LOWER(TRIM(name)) = LOWER(?)",
        [name]
      );
      if (existingReceiver.length > 0) {
        req.flash("error", "A receiver with this name already exists.");
        return req.session.save(() => res.redirect("/register"));
      }
    }
    const hash = await bcrypt.hash(password, 10);
    // create entity if donor/volunteer/receiver
    let entity_id = null;
    if (role === "donor") {
      const [r] = await pool.query("INSERT INTO donors(name) VALUES (?)", [
        name,
      ]);
      entity_id = r.insertId;
    } else if (role === "volunteer") {
      const [r] = await pool.query("INSERT INTO volunteers(name) VALUES (?)", [
        name,
      ]);
      entity_id = r.insertId;
    } else if (role === "receiver") {
      const [r] = await pool.query("INSERT INTO receivers(name) VALUES (?)", [
        name,
      ]);
      entity_id = r.insertId;
    }
    await pool.query(
      "INSERT INTO users(name,email,password_hash,role,entity_id) VALUES (?,?,?,?,?)",
      [name, email, hash, role, entity_id]
    );
    req.flash("success", "Registration successful. Please log in.");
    req.session.save(() => res.redirect("/login"));
  } catch (e) {
    console.error(e);
    req.flash("error", "Registration failed");
    req.session.save(() => res.redirect("/register"));
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    const role = req.user.role;
    if (role === "admin") return res.redirect("/admin");
    if (role === "donor") return res.redirect("/donor");
    if (role === "volunteer") return res.redirect("/volunteer");
    if (role === "receiver") return res.redirect("/receiver");
    return res.redirect("/");
  }
);

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out");
    req.session.save(() => res.redirect("/login"));
  });
});

module.exports = router;
