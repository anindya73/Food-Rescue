const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const viewsDir = path.join(__dirname, "..", "src", "views");
const results = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && full.endsWith(".ejs")) results.push(full);
  }
}

walk(viewsDir);

const safeLocals = {
  // common
  user: { id: 1, name: "Tester", role: "admin" },
  title: "Dashboard",
  body: "<p>placeholder</p>",
  extraScripts: "",
  // collections/metrics used by templates
  donations: [],
  pickups: [],
  available: [],
  requests: [],
  centers: [],
  expiring: [],
  served: [],
  volunteers: [],
  don: {
    id: 1,
    donor_name: "Donor",
    food_item: "Apples",
    expiry_date: new Date(),
    quantity: 5,
    center_name: "Center A",
    status: "Pending",
  },
  success: [],
  error: [],
  // admin dashboard specific metrics
  total_donations: 10,
  pending_donations: 2,
  delivered_donations: 5,
  expiring_3days: 1,
  total_donors: 4,
  total_volunteers: 3,
  total_receivers: 2,
  total_centers: 1,
  foodRequests: [],
  total_volunteers_list: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ],
  topDonors: [],
  volPerf: [],
  statusBreakdown: [],
  availableFood: [],
};

let hadError = false;
for (const file of results) {
  const rel = path.relative(viewsDir, file);
  try {
    const str = fs.readFileSync(file, "utf8");
    ejs.render(str, safeLocals, { filename: file });
    console.log("OK:", rel);
  } catch (err) {
    hadError = true;
    console.error("ERROR:", rel);
    console.error(
      err && err.stack ? err.stack.split("\n").slice(0, 8).join("\n") : err
    );
  }
}
if (hadError) process.exit(2);
console.log("All templates rendered successfully (with safe defaults).");
