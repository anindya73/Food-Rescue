

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
