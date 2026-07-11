require("dotenv").config();
// Global error logging to diagnose silent exits
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const flash = require("connect-flash");
const methodOverride = require("method-override");
const passport = require("passport");
const initPassport = require("./utils/passport");
const routes = require("./routes");
const pool = require("./config/db");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Ensure trimmed DB env for session store to avoid auth failures from trailing spaces
const envTrim = (k, fb = "") => {
  const v = process.env[k];
  return (typeof v === "string" ? v.trim() : v) || fb;
};
const sessionStore = new MySQLStore({
  host: envTrim("DB_HOST", "localhost"),
  user: envTrim("DB_USER", "root"),
  password: envTrim("DB_PASSWORD", ""),
  database: envTrim("DB_NAME", "FoodRescue"),
  port: Number(envTrim("DB_PORT", "3306")),
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "changeme",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax", // Allows cookies across tabs
    },
  })
);
app.use(flash());

initPassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  next();
});

// Health endpoints before other routes
app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/db-health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.code || e.message });
  }
});

app.use("/", routes);

// Centralized error handler to avoid silent failures
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  if (res.headersSent) return; // avoid double send
  res.status(500).send("Internal Server Error");
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const server = app.listen(PORT, HOST, () =>
  console.log(
    `FoodRescue running at http://${
      HOST === "0.0.0.0" ? "localhost" : HOST
    }:${PORT}`
  )
);
server.on("error", (err) => console.error("Server error:", err));
server.on("close", () => console.log("Server closed"));
