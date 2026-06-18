# Employee Activity Monitor System

A complete full-stack employee activity monitoring solution with:
- 🎨 Next.js Admin Dashboard
- 🔌 Chrome Extension for activity tracking  
- 🗄️ Supabase cloud database
- 🔐 Secure authentication

## ⚡ Quick Start

### 1. Configure Supabase
Edit `.env.local` and add your SERVICE_ROLE_KEY from Supabase Dashboard.

### 2. Install & Run
```bash
npm install
npm run dev
# Dashboard: http://localhost:3000
```

### 3. Load Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

## 📖 Full Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Comprehensive setup & testing instructions
- **[FINAL_REPORT.md](FINAL_REPORT.md)** - Implementation details & verification

## 🎯 Key Features

✅ Employee activity tracking  
✅ Real-time dashboard monitoring  
✅ Detailed activity logs  
✅ User management  
✅ Secure authentication  
✅ Chrome extension integration  

## 📦 What's Included

- **Dashboard**: Admin interface with employee management
- **Extension**: Chrome extension for activity tracking
- **APIs**: RESTful endpoints for data sync
- **Database**: Supabase with RLS policies

## 🚀 Status

✅ **95% Complete** - Ready for deployment  
⏳ **1 Blocker** - Need Supabase SERVICE_ROLE_KEY

## 📊 Technology

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- Supabase
- Chrome Manifest v3

## 🧪 Testing

See [SETUP_GUIDE.md](SETUP_GUIDE.md#testing-workflow) for complete testing instructions.

## 📞 Support

For setup issues, check [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting-checklist)
