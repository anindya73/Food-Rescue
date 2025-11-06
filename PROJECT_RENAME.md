# Project Rename Summary

## Project Name Changed: FoodRescueDB → FoodRescue

### All Changes Made:

#### 1. Database Name

- **Old**: `FoodRescueDB`
- **New**: `FoodRescue`

#### 2. Files Updated:

**Configuration Files:**

- ✅ `.env` - Changed `DB_NAME=FoodRescue`
- ✅ `package.json` - Changed package name to `foodrescue-node`
- ✅ `src/config/db.js` - Updated default database name

**SQL Files:**

- ✅ `sql/schema.sql` - CREATE DATABASE FoodRescue
- ✅ `sql/seed.sql` - USE FoodRescue

**Server Files:**

- ✅ `src/server.js` - Startup message now says "FoodRescue running..."
- ✅ `src/views/partials/head.ejs` - Page title default is "FoodRescue"
- ✅ `src/views/partials/sidebar.ejs` - Sidebar header shows "FoodRescue"
- ✅ `src/routes/util.js` - PDF receipt header updated

**Tool Scripts:**

- ✅ `tools/db-wipe.js` - Default database name
- ✅ `tools/db-seed.js` - Default database name
- ✅ `tools/test-data-setup.js` - Default database name

**Documentation:**

- ✅ `SETUP_GUIDE.md` - Title updated
- ✅ `start-server.bat` - Startup message updated

### Database Migration:

- ✅ New database `FoodRescue` created
- ✅ All tables created with new schema
- ✅ Admin user created in new database

### Server Status:

✅ **Server running at http://localhost:3000**
✅ **Login**: admin@example.com / admin123

### What You'll See:

- Browser tab title: "FoodRescue" or "Page Name - FoodRescue"
- Sidebar header: "🎒 FoodRescue"
- Console: "FoodRescue running at http://localhost:3000"
- PDF receipts: "FoodRescue - Donation Receipt"

### Old Database:

- The old `FoodRescueDB` database still exists but is no longer used
- You can drop it manually if needed: `DROP DATABASE FoodRescueDB;`

---

All references to "FoodRescueDB" have been replaced with "FoodRescue" throughout the project!
