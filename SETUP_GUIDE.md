# Employee Activity Monitor System

## Project Overview

This is a complete employee activity monitoring system with:
- **Dashboard**: Next.js admin interface to view employee activity
- **Chrome Extension**: Activity tracker that employees can use to monitor their own browsing
- **Supabase Backend**: Secure database and authentication

## Architecture

```
┌─────────────────────────────────────────────┐
│         Employee Chrome Extension            │
│  ─ Track website visits                      │
│  ─ Send activity logs to Supabase            │
│  ─ Real-time online/offline status           │
└────────────┬────────────────────────────────┘
             │ POST /api/activity
             │
┌────────────▼────────────────────────────────┐
│     Dashboard (Next.js) - localhost:3000     │
│  ─ Admin login & dashboard                   │
│  ─ View all employees                        │
│  ─ See detailed activity logs                │
│  ─ Real-time stats (online users, time)      │
└────────────┬────────────────────────────────┘
             │ Queries
             │
┌────────────▼────────────────────────────────┐
│      Supabase Cloud Database                 │
│  ─ users table                               │
│  ─ activity_logs table                       │
│  ─ RLS policies                              │
└─────────────────────────────────────────────┘
```

## Database Schema

### users
```sql
id (UUID)              - Primary key
email (text)           - User email
name (text)            - User display name
role (text)            - 'admin' or 'employee'
status (text)          - 'active' or 'inactive'
created_at (timestamp) - Account creation time
```

### activity_logs
```sql
id (UUID)              - Primary key
user_id (UUID)         - FK to users.id ✓ (NOT employee_id!)
domain (text)          - Website domain
url (text)             - Full website URL
time_spent (integer)   - Seconds spent on site
visit_count (integer)  - Number of visits
created_at (timestamp) - Log timestamp
```

## Setup Instructions

### 1. CRITICAL: Configure Supabase SERVICE_ROLE_KEY

The dashboard needs a valid SERVICE_ROLE_KEY for admin operations. This key is NOT in the repository for security reasons.

**Steps:**
1. Go to: https://supabase.com/dashboard/project/lrvwbtfqdjjjqmpfbfvz/settings/api
2. Copy the "service_role" secret (NOT the anon key)
3. Edit `.env.local` and replace `PLACEHOLDER_SERVICE_ROLE_KEY` with the actual key

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://lrvwbtfqdjjjqmpfbfvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4B52bbGWu0RjvGW95_aicA_YLOvJDOt
SUPABASE_SERVICE_ROLE_KEY=<PASTE_ACTUAL_SERVICE_ROLE_KEY_HERE>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The dashboard will be available at: http://localhost:3000

### 4. Create Admin Account

**Admin Email**: bhuisompa001@gmail.com

The system will automatically create/update the admin user record when they first login.

### 5. Load Chrome Extension

1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `extension/` folder from this project
5. The extension should now be installed!

## Testing Workflow

### Step 1: Admin Login
1. Go to http://localhost:3000
2. Login with: **bhuisompa001@gmail.com** (use any password)
3. You should see the admin dashboard

### Step 2: Create Employee Account
1. Click "Create New User" button
2. Fill in employee details:
   - Name: Test Employee
   - Email: test@company.com
   - Role: Employee
   - Password: testpass123
3. Click "Create User Account"

### Step 3: Employee Setup & Activity Tracking
1. Open a new Chrome window
2. Go to http://localhost:3000
3. Login as the employee (test@company.com / testpass123)
4. You should see employee dashboard
5. Click the extension icon in Chrome toolbar
6. Click "Sign In" and enter employee credentials
7. The extension should show "Online" status

### Step 4: Generate Test Activity
1. With extension logged in, visit these websites:
   - Google.com
   - YouTube.com
   - GitHub.com
   - LinkedIn.com
   - ChatGPT.com

The extension automatically tracks time on each site.

### Step 5: Verify in Admin Dashboard
1. Go back to http://localhost:3000 admin dashboard
2. Look for the employee in the list
3. Click "View Details" to see:
   - Today's tracked time
   - Websites visited
   - Visit counts
   - Detailed activity logs
   - Last activity timestamp

## API Endpoints

### Dashboard API

**GET `/api/admin-dashboard`**
- Query activity logs and employee data
- Query params: `employeeId` (optional)
- Returns: stats, employees list, employee details

**POST `/api/ensure-admin`**
- Create/update admin user record
- Body: `{ email, userId, name }`
- Server-side only (uses SERVICE_ROLE_KEY)

**POST `/api/activity`**
- Extension sends activity logs here
- Body: `{ user_id, domain, url, time_spent, visit_count }`
- Client-side (uses anon key with RLS)

**GET `/api/activity?user_id=...`**
- Fetch activity logs for a user
- Query params: `user_id`
- Returns: list of activity logs

## Chrome Extension Features

### Popup Window
- **Online/Offline Status**: Visual indicator of extension state
- **Login Form**: Enter employee credentials
- **Current Activity**: Shows domain and time spent
- **Tracking Controls**: Start/Stop tracking
- **Sign Out**: Logout and stop tracking

### Background Service Worker
- **Automatic Tracking**: Runs every 30 seconds
- **Tab Change Detection**: Saves activity when switching tabs
- **Time Calculation**: Measures seconds on each domain
- **Supabase Sync**: Sends logs to database

### Content Script
- **User Activity Detection**: Tracks mouse, keyboard, scroll, touch
- **Page Visibility**: Pauses tracking when tab is hidden
- **Periodic Reporting**: Sends status to background worker

## Known Issues & Solutions

### Issue: "Invalid API key" error
**Solution**: The SERVICE_ROLE_KEY in `.env.local` is invalid or missing.
- Get the actual key from Supabase Dashboard (Settings → API → service_role)
- Don't use the anon key - it's read-only!

### Issue: Extension won't login
**Solution**: Check browser console for errors.
- Ensure employee account exists in dashboard
- Verify Supabase credentials in extension/background.js
- Check that RLS policies allow writes

### Issue: Activity logs not appearing
**Solution**: Verify the chain:
1. Extension is tracking (shows "Tracking" badge)
2. Database has the `activity_logs` table
3. `user_id` column exists (not `employee_id`)
4. RLS policy allows INSERT with user authentication

### Issue: Admin dashboard shows no employees
**Solution**:
- Ensure employees were created in the system
- Check RLS policy allows SELECT on users table
- Verify SERVICE_ROLE_KEY in server is correct

## File Structure

```
.
├── extension/                 # Chrome Extension
│   ├── manifest.json         # Extension configuration
│   ├── background.js         # Service worker
│   ├── popup.html            # Popup UI
│   ├── popup.js              # Popup logic
│   ├── content-script.js     # Page activity tracker
│   └── images/               # Extension icons
│
├── src/
│   ├── app/
│   │   ├── page.tsx          # Login page
│   │   ├── admin/            # Admin dashboard
│   │   ├── employee/         # Employee dashboard
│   │   ├── api/
│   │   │   ├── admin-dashboard/  # Fetch admin data
│   │   │   ├── activity/         # Activity log API
│   │   │   ├── ensure-admin/     # Create admin user
│   │   │   └── ...
│   │   └── actions/          # Server-side actions
│   │       └── user-actions.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts       # Public client
│   │   ├── supabase-admin.ts # Admin client
│   │   ├── stats.ts          # Data fetching
│   │   └── utils.ts          # Utilities
│   │
│   └── globals.css           # Tailwind styles
│
├── .env.local                # Environment config (secrets!)
├── package.json
└── tsconfig.json
```

## Environment Variables

```bash
# Public (safe to commit)
NEXT_PUBLIC_SUPABASE_URL=https://lrvwbtfqdjjjqmpfbfvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4B52bbGWu0RjvGW95_aicA_YLOvJDOt

# Secret (DO NOT commit)
SUPABASE_SERVICE_ROLE_KEY=<ACTUAL_SERVICE_ROLE_KEY>
```

## Troubleshooting Checklist

- [ ] `.env.local` file exists and has valid SERVICE_ROLE_KEY
- [ ] `npm install` completed without errors
- [ ] `npm run dev` starts successfully on port 3000
- [ ] Can login to admin dashboard
- [ ] Can create employee accounts
- [ ] Extension loads in Chrome (check `chrome://extensions/`)
- [ ] Extension can login as employee
- [ ] Activity logs appear in database
- [ ] Dashboard updates with new activity

## Performance Tips

- **Dashboard**: Loads fresh data every page load (no caching)
- **Extension**: Saves activity every 30 seconds
- **Database**: Indexes on `user_id` and `created_at` for fast queries
- **Real-time**: Currently polling, could add WebSockets for live updates

## Security Notes

- ✅ SERVICE_ROLE_KEY kept in .env.local (server-side only)
- ✅ Anon key used in extension/frontend (read-only where possible)
- ✅ RLS policies on Supabase restrict data access
- ✅ Passwords managed by Supabase Auth
- ⚠️ Ensure .env.local is in .gitignore
- ⚠️ Never commit secrets to git

## Next Steps

1. Configure SERVICE_ROLE_KEY in .env.local
2. Run the system: `npm run dev`
3. Test login and activity tracking
4. Deploy to production with proper secrets management

## Support

For issues:
1. Check the browser console (F12) for error messages
2. Review server logs in terminal
3. Check Supabase dashboard for database issues
4. Verify all environment variables are set correctly
