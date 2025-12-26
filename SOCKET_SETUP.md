# Socket.IO Setup Guide

## Environment Variables Required

### Backend (.env file in `/backend` folder)

```env
# Server Configuration
PORT=8000

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_SECRET_EXPIRY=7d

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend URL (for CORS and Socket.IO)
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env file in `/frontend` folder)

```env
# Backend API URL
VITE_API_URL=http://localhost:8000

# Socket.IO Server URL
VITE_SOCKET_URL=http://localhost:8000
```

## Troubleshooting Socket.IO Connection Issues

### 1. Check if backend server is running
```bash
cd backend
npm run dev
```
You should see: `Server is running at port::8000` and `Socket.IO initialized with CORS origin: http://localhost:5173`

### 2. Check if frontend is running
```bash
cd frontend
npm run dev
```
Check the console URL (usually http://localhost:5173)

### 3. Verify Ports Match

**Backend:**
- Check `PORT` in backend `.env` file (default: 8000)
- Check `FRONTEND_URL` matches your frontend URL

**Frontend:**
- Check `VITE_API_URL` matches backend PORT
- Check `VITE_SOCKET_URL` matches backend PORT
- Check browser console for actual frontend URL

### 4. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for Socket.IO connection messages
- **Network tab**: Check WebSocket connections
- Look for errors like:
  - `Socket.IO connection error`
  - `Authentication error`
  - CORS errors

### 5. Common Issues

**Issue: "Authentication error"**
- Make sure you're logged in
- Check if JWT_SECRET is set in backend .env
- Clear cookies and login again

**Issue: "CORS error"**
- Make sure `FRONTEND_URL` in backend .env matches your actual frontend URL
- If frontend runs on different port, update `FRONTEND_URL`

**Issue: "Connection refused"**
- Make sure backend server is running
- Check if PORT in .env matches the port server is actually running on
- Check firewall settings

**Issue: "Socket.IO not connecting"**
- Check browser console for connection errors
- Verify token is being sent (check cookies)
- Make sure Socket.IO is initialized after server starts

### 6. Testing Socket.IO Connection

1. Open browser DevTools Console
2. Look for: `✅ Socket.IO connected successfully: [socket-id]`
3. If you see connection errors, check:
   - Backend server logs
   - Browser console errors
   - Network tab for WebSocket connection

### 7. Verify Notifications Work

1. Login with two different accounts in different browsers
2. From Account A: Like/Comment/Follow Account B's post
3. Account B should receive notification immediately
4. Check browser console for `newNotification` events

### 8. Verify Messages Work

1. Login with two different accounts
2. Go to chat page
3. Select a user and send a message
4. Message should appear in real-time for both users
5. Check browser console for `newMessage` events

## Quick Fix Checklist

- [ ] Backend `.env` file exists with all required variables
- [ ] Frontend `.env` file exists (optional, will use defaults)
- [ ] `PORT` in backend `.env` matches `VITE_API_URL` port
- [ ] `FRONTEND_URL` in backend `.env` matches actual frontend URL
- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] User is logged in (check cookies)
- [ ] Browser console shows Socket.IO connection success
- [ ] No CORS errors in browser console
- [ ] No authentication errors in backend logs

## Still Not Working?

1. **Check backend logs** for Socket.IO initialization message
2. **Check browser console** for connection errors
3. **Verify ports** are not already in use
4. **Restart both servers** after changing .env files
5. **Clear browser cache and cookies**, then login again

