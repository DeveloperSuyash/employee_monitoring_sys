# ⚡ QUICK REFERENCE - COMMON COMMANDS

Keep this handy while working with the project!

---

## 🚀 GETTING STARTED (First Time)

### 1. Install Dependencies
```bash
npm install
# Time: ~2-3 minutes
# Result: 371 packages installed
```

### 2. Start Development Server
```bash
npm run dev
# Time: ~1 second startup
# Opens: http://localhost:3000
# Keep running in terminal
```

### 3. Open Dashboard in Browser
```
URL: http://localhost:3000
Action: Open in Chrome browser
See: Login form
```

### 4. Load Chrome Extension
```
1. Go to: chrome://extensions/
2. Enable: Developer mode (top right)
3. Click: Load unpacked
4. Select: extension/ folder
5. Result: Extension appears in toolbar
```

---

## 📚 DOCUMENTATION COMMANDS

### View Documentation Index
```bash
# Open in your editor or browser:
DOCUMENTATION_INDEX.md
```

### Read Setup Guide
```bash
# Complete setup instructions:
SETUP_GUIDE.md
```

### Check Implementation Details
```bash
# Technical details:
IMPLEMENTATION_SUMMARY.md
```

### View Complete Report
```bash
# Full project report:
FINAL_REPORT.md
```

### Quick Summary
```bash
# Quick project overview:
COMPLETION_SUMMARY.md
```

### Verify Setup
```bash
# Setup verification:
VERIFICATION_CHECKLIST.md
```

---

## 🏗️ BUILD & DEPLOYMENT

### Build for Production
```bash
npm run build
# Time: ~10-15 seconds
# Creates: .next/ folder
# Result: Optimized production build
```

### Start Production Server
```bash
npm start
# Runs: Optimized production build
# Port: http://localhost:3000
```

### Check Build Status
```bash
npm run build 2>&1
# Shows: Build output and any errors
```

### Clean Build
```bash
# Remove old build:
del /s .next
del /s out

# Rebuild:
npm run build
```

---

## 🔍 CODE INSPECTION

### TypeScript Type Check
```bash
npm run build
# Runs: TypeScript type checking
# Shows: Any type errors
```

### Check for Errors
```bash
# In VS Code:
Ctrl+Shift+M
# Shows: Problems panel
```

### Search Code
```bash
# In VS Code:
Ctrl+Shift+F
# Search all files in project
```

---

## 🧪 TESTING COMMANDS

### Test Extension Load
```
1. Go to: chrome://extensions/
2. Look for: Extension in list
3. Check: No error messages
4. Click: Popup to test UI
```

### Test Dashboard
```
1. Visit: http://localhost:3000
2. See: Login form (no errors)
3. Try: Type in email field
4. Check: Form is responsive
```

### Test API Endpoint
```bash
# Check activity endpoint exists:
curl http://localhost:3000/api/activity
# Should return: JSON or error (not 404)
```

---

## ⚙️ CONFIGURATION

### View Environment Variables
```bash
# Open:
.env.local

# See:
NEXT_PUBLIC_SUPABASE_URL=https://lrvwbtfqdjjjqmpfbfvz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_4B52bbGWu0RjvGW95_aicA_YLOvJDOt
SUPABASE_SERVICE_ROLE_KEY=PLACEHOLDER_SERVICE_ROLE_KEY
```

### Update SERVICE_ROLE_KEY
```
1. Get key from: https://supabase.com/dashboard/project/lrvwbtfqdjjjqmpfbfvz/settings/api
2. Copy: service_role secret
3. Edit: .env.local
4. Replace: PLACEHOLDER_SERVICE_ROLE_KEY with actual key
5. Restart: npm run dev
```

### Check Configuration
```bash
# Terminal output should show:
# - SUPABASE_URL: [URL]
# - SERVICE_ROLE_KEY length: [number]
# - Anon key: [key prefix]
```

---

## 📁 FILE NAVIGATION

### View Project Structure
```bash
# Terminal command:
dir /s

# Or see:
PROJECT_STRUCTURE.md
```

### Open Specific Folder
```bash
# Extension:
cd extension

# Source code:
cd src

# API routes:
cd src/app/api

# Libraries:
cd src/lib
```

### List Files
```bash
# Show all .md files:
dir *.md

# Show all in extension:
dir extension

# Show all TypeScript files:
dir /s *.ts
```

---

## 🐛 TROUBLESHOOTING

### Dashboard Won't Load
```bash
# 1. Check server is running:
npm run dev

# 2. Check no errors in terminal

# 3. Reload browser:
Ctrl+R or F5

# 4. Clear cache:
Ctrl+Shift+Delete

# 5. Try incognito window:
Ctrl+Shift+N
```

### Extension Won't Load
```bash
# 1. Check manifest syntax (must be valid JSON):
# Open: extension/manifest.json
# Validate: Use JSON validator online

# 2. Try reloading extension:
# Go to: chrome://extensions/
# Click: Reload button

# 3. Try loading again:
# Load unpacked → select extension/ folder
```

### Build Fails
```bash
# 1. Check Node version:
node --version
# Should be: v18+ (preferably v20+)

# 2. Clean and rebuild:
del /s package-lock.json
del /s node_modules
npm install
npm run build

# 3. Check for TypeScript errors:
npm run build 2>&1 | more
```

### Supabase Connection Fails
```bash
# 1. Check .env.local exists
# 2. Check URL is correct:
# https://lrvwbtfqdjjjqmpfbfvz.supabase.co
# 3. Check anon key is correct:
# sb_publishable_4B52bbGWu0RjvGW95_aicA_YLOvJDOt
# 4. Check internet connection
# 5. Check Supabase status: https://status.supabase.io
```

---

## 💻 TERMINAL TIPS

### Keep Dev Server Running
```bash
# Start dev server in dedicated terminal window:
npm run dev

# Don't close this window!
# Open another terminal for other commands

# To stop: Ctrl+C
```

### Run Commands While Dev Server Active
```bash
# In another terminal (not the dev server one):
npm run build

# This doesn't affect the running dev server
```

### Navigate Directories
```bash
# Go to project root:
cd "c:\Users\Day Shift\Desktop\employee_monitor_sys"

# Go to extension:
cd extension

# Go back:
cd ..
```

### View Recent Errors
```bash
# PowerShell - scroll up in terminal
# Or use: npm run build 2>&1 | more
```

---

## 🔐 SECURITY CHECKLIST

### Before Deployment
```bash
# 1. Check .env.local not in git:
git status
# Should NOT show .env.local

# 2. Verify secrets not in code:
grep -r "sk_live" src/
grep -r "api_key" src/
# Should find nothing

# 3. Check SERVICE_ROLE_KEY is real (>200 chars):
# In .env.local, key should be long JWT

# 4. Review RLS policies in Supabase:
# https://supabase.com/dashboard/...
```

### Production Environment
```bash
# 1. Use production Supabase project
# 2. Update SUPABASE_URL
# 3. Update ANON_KEY
# 4. Keep SERVICE_ROLE_KEY secret!
# 5. Set secure deployment environment
```

---

## 📊 MONITORING

### Check Health
```bash
# Server running?
ps aux | grep node
# Should show: npm or node process

# Port in use?
netstat -ano | findstr :3000
# Should show: PID for dev server
```

### View Logs
```bash
# Development logs:
# Watch terminal where npm run dev runs

# Browser logs:
# F12 → Console tab

# Server errors:
# Terminal output shows errors
```

---

## 🎓 QUICK LEARNING

### Project Structure
```bash
# See complete structure:
PROJECT_STRUCTURE.md

# Or visual diagram:
DOCUMENTATION_INDEX.md
```

### How It Works
```bash
# Understand the system:
IMPLEMENTATION_SUMMARY.md

# See data flow:
PROJECT_STRUCTURE.md → Data Flow section
```

### Architecture
```bash
# Learn about architecture:
FINAL_REPORT.md → Architecture section

# See security model:
FINAL_REPORT.md → Security Considerations
```

---

## 🚀 DEPLOYMENT QUICK START

### Vercel Deployment
```bash
# 1. Install Vercel CLI:
npm install -g vercel

# 2. Login:
vercel login

# 3. Deploy:
vercel

# 4. Add environment variables in Vercel dashboard
# 5. Set SERVICE_ROLE_KEY
# 6. Done!
```

### Railway Deployment
```bash
# 1. Create account: railway.app
# 2. Connect GitHub repo
# 3. Add SERVICE_ROLE_KEY env var
# 4. Deploy automatically
```

### Docker Deployment
```bash
# 1. Create Dockerfile (use Next.js template)
# 2. Build: docker build -t app .
# 3. Run: docker run -p 3000:3000 app
# 4. Add env vars in docker run
```

---

## 📞 QUICK LINKS

### Project Files
- **README.md** - Project description
- **SETUP_GUIDE.md** - Setup instructions
- **IMPLEMENTATION_SUMMARY.md** - Technical details

### External Services
- **Supabase Dashboard**: https://supabase.com/dashboard/project/lrvwbtfqdjjjqmpfbfvz
- **Supabase API Settings**: https://supabase.com/dashboard/project/lrvwbtfqdjjjqmpfbfvz/settings/api
- **Chrome Extensions**: chrome://extensions/

### Documentation
- **Setup Guide**: SETUP_GUIDE.md
- **Structure Guide**: PROJECT_STRUCTURE.md
- **Full Report**: FINAL_REPORT.md
- **Index**: DOCUMENTATION_INDEX.md

---

## ✅ ESSENTIAL CHECKLIST

Before deployment, verify:
- [ ] `npm install` completed
- [ ] `npm run dev` runs without errors
- [ ] Dashboard loads at localhost:3000
- [ ] Extension loads in Chrome without errors
- [ ] SERVICE_ROLE_KEY added to .env.local
- [ ] All documentation reviewed
- [ ] No sensitive data in code
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: Complete testing workflow
- [ ] Ready for production

---

## 🎯 ONE-LINE COMMANDS

```bash
# Install and start (first time):
npm install && npm run dev

# Just build:
npm run build

# Just start dev:
npm run dev

# Quick cleanup:
del /s .next & npm run dev

# Check everything:
npm run build && npm start
```

---

## 💡 PRO TIPS

1. **Keep two terminals open** - One for `npm run dev`, one for other commands
2. **Use F12 in browser** - Check Console for frontend errors
3. **Check terminal output** - Server logs show backend issues
4. **Reload if confused** - Ctrl+R to reload browser
5. **Use incognito mode** - To avoid cache issues during testing
6. **Check .env.local** - Most issues are config-related
7. **Restart dev server** - After changing .env.local, restart with Ctrl+C then npm run dev

---

## 📚 COMPLETE GUIDE TO START

### First Time Setup (follow this order):
1. Open terminal
2. `npm install` (wait ~3 minutes)
3. `npm run dev` (dev server now running)
4. Open http://localhost:3000 in Chrome
5. Load extension from chrome://extensions/ → Load unpacked → select extension/
6. Read SETUP_GUIDE.md for next steps

### That's it! You're ready to test! 🎉

---

**Keep this file handy!**  
Save as bookmark or print for reference while working.

Happy coding! 🚀
