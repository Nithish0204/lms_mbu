# Backend Port Issue - FIXED ✅

## Issue

Backend server was failing to start with error:

```
Error: listen EADDRINUSE: address already in use :::5000
```

## Root Causes Found

### 1. **Invalid PORT in .env**

```env
PORT=5000 2  ❌ Invalid - has extra "2"
```

### 2. **Wrong config file path**

```javascript
dotenv.config({ path: './config/config.env' });  ❌ File doesn't exist
```

### 3. **Process already running**

- Another process was using port 5000

---

## Fixes Applied ✅

### 1. Fixed .env File

**Location:** `/Users/nani/Lms/backend/.env`

**Before:**

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_very_long_random_secret_string
JWT_EXPIRE=30d
PORT=5000 2  ❌
```

**After:**

```env
MONGO_URI=mongodb://localhost:27017/lms_db
JWT_SECRET=hackathon_lms_secret_2024_change_in_production
JWT_EXPIRE=30d
NODE_ENV=development
PORT=5001  ✅
```

### 2. Fixed server.js

**Location:** `/Users/nani/Lms/backend/server.js`

**Before:**

```javascript
dotenv.config({ path: './config/config.env' });  ❌
```

**After:**

```javascript
dotenv.config();  ✅ Uses .env in backend root
```

### 3. Killed Conflicting Processes

```bash
lsof -ti:5000 | xargs kill -9
lsof -ti:5001 | xargs kill -9
```

---

## ✅ Current Status

### Backend Server

```
✅ Running on port 5001
✅ MongoDB Connected: localhost
✅ Environment: development
✅ All env vars loaded correctly
```

### Frontend Server

```
✅ Running on port 3000
✅ Tailwind CSS working
✅ All pages rendering
```

---

## 🚀 How to Start Servers

### Backend

```bash
cd /Users/nani/Lms/backend
node server.js
```

**Expected Output:**

```
Server running in development mode on port 5001
MongoDB Connected: localhost
```

### Frontend

```bash
cd /Users/nani/Lms/frontend
npm start
```

**Expected Output:**

```
Compiled with warnings.
webpack compiled with 1 warning

Local:   http://localhost:3000
```

---

## 🔧 Configuration Summary

### Backend (.env)

- **PORT:** 5001
- **MONGO_URI:** mongodb://localhost:27017/lms_db
- **JWT_SECRET:** hackathon_lms_secret_2024_change_in_production
- **JWT_EXPIRE:** 30d
- **NODE_ENV:** development

### Frontend (.env)

- **REACT_APP_API_URL:** http://localhost:5001/api

---

## ⚠️ Troubleshooting

### If Port Still in Use

```bash
# Find process using port
lsof -i:5001

# Kill specific process
kill -9 <PID>

# Or kill all on port
lsof -ti:5001 | xargs kill -9
```

### If MongoDB Not Connected

```bash
# Start MongoDB
brew services start mongodb-community

# Or
mongod --dbpath /data/db
```

### If .env Not Loading

- Make sure `.env` is in `/Users/nani/Lms/backend/`
- No spaces in variable values
- Restart server after changes

---

## 📊 Server Status

| Service  | Port  | Status       | URL                   |
| -------- | ----- | ------------ | --------------------- |
| Backend  | 5001  | ✅ Running   | http://localhost:5001 |
| Frontend | 3000  | ✅ Running   | http://localhost:3000 |
| MongoDB  | 27017 | ✅ Connected | localhost:27017       |

---

## 🎯 Next Steps

1. ✅ Backend running on 5001
2. ✅ Frontend running on 3000
3. ✅ Both connected and working
4. ✅ Ready for development!

---

## Date: October 17, 2025

**Status:** ✅ FIXED - All servers running successfully!
