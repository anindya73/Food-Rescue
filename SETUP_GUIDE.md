# FoodRescue Setup Guide - Configure Master Data

## Server Status

✅ Server is running at: **http://localhost:3001**

## Step-by-Step: Configure Centers (Master Data)

### 1. Login as Admin

1. Open your browser and go to: **http://localhost:3001/login**
2. Enter the admin credentials:
   - **Email:** `admin@example.com`
   - **Password:** `admin123`
3. Click **Login**

### 2. Access Manage Centers

After logging in, you'll see the admin dashboard with a sidebar on the left.

In the sidebar, you'll see these menu items:

- ✅ Dashboard
- ✅ **Manage Centers** ← Click this one!
- ✅ Assign Pickup
- ✅ Reports

**Click on "Manage Centers"** or navigate directly to: **http://localhost:3001/admin/centers**

### 3. Add Your First Center

On the "Manage Centers" page, you'll see:

- A form on the left to add a new center
- A table on the right showing existing centers (empty initially)

Fill in the form:

- **Name:** e.g., "Central Food Hub"
- **Location:** e.g., "MG Road, Bangalore"
- **Capacity:** e.g., 1000

Click **Save** button.

### 4. Add More Centers (Optional)

Repeat step 3 to add more centers:

- "North Storage Facility" - "Sector 21, Delhi" - 600
- "South Distribution Center" - "Anna Nagar, Chennai" - 800

### 5. Verify Centers Appear

After adding centers, the table on the right will show:

- ID
- Name
- Location
- Capacity

## Next Steps: Use the App

### Register Users

Go to **http://localhost:3001/register** to create:

- Donor accounts (will create donations)
- Volunteer accounts (will pick up donations)
- Receiver accounts (will request food)

### Create Donations (as Donor)

1. Login as a donor
2. Click "Add Donation" in sidebar
3. Select a center from the dropdown (you'll see the centers you just created!)
4. Fill in food item, quantity, expiry date
5. Submit

### Assign Pickups (as Admin)

1. Login as admin
2. Click "Assign Pickup"
3. Assign pending donations to volunteers

### View Dashboard Data

1. Go to admin dashboard
2. See real-time stats:
   - Total donations
   - Expiring soon
   - Top donors
   - Volunteer performance

---

## Troubleshooting

### "I don't see Manage Centers in the sidebar"

- Make sure you're logged in as admin (check the sidebar shows your role as "admin")
- Refresh the page (Ctrl+R or F5)

### "The centers dropdown is empty when donating"

- Make sure you added centers via /admin/centers first
- Centers must be created before donors can select them

### "I can't login"

- Use credentials: `admin@example.com` / `admin123`
- Make sure the server is running on port 3001

### Need to reset everything?

Run: `npm run db:wipe` to clear all data, then `npm run admin:bootstrap` to recreate admin user

---

## Quick Commands Reference

```powershell
# Start server
$env:PORT=3001; node src/server.js

# Create admin user (if missing)
npm run admin:bootstrap

# Wipe all data
npm run db:wipe

# Wipe data but keep admin users
npm run db:wipe:keep-admin
```
