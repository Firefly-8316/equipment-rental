## Equipment Rental – Deployment Guide

This guide explains how to deploy your MERN app using:
- **MongoDB Atlas** – cloud database
- **Render** – backend (`server/`)
- **Vercel** – frontend (`client/`)

It assumes your project is already pushed to GitHub.

---

## 1. Prepare the Codebase

1. **Check CORS middleware in `server/server.js`:**

   Use this pattern (you may already have it; otherwise update it before pushing):

   ```js
   const cors = require('cors');

   app.use(
     cors({
       origin: process.env.FRONTEND_URL || 'http://localhost:5173',
       credentials: true,
     })
   );
   ```

   - In development, `FRONTEND_URL` is not set so it falls back to `http://localhost:5173`.
   - In production (Render), you set `FRONTEND_URL` to your Vercel URL (e.g. `https://your-app.vercel.app`).

2. **Confirm server listens on `process.env.PORT`:**

   ```js
   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

3. **Commit and push to GitHub** so that both `client/` and `server/` are up to date.

---

## 2. MongoDB Atlas Setup

1. Go to `https://www.mongodb.com/cloud/atlas` and create/login to your account.
2. Create a **free Shared Cluster**.
3. Create a **Database User**:
   - Username: e.g. `db_user`
   - Password: strong password you’ll paste into Render/`.env`.
4. Network access:
   - Add IP `0.0.0.0/0` (allow from anywhere) or a specific IP range.
5. Get your **connection string**:
   - Click “Connect → Drivers → Node.js”.
   - Copy the URI, e.g.:
     `mongodb+srv://db_user:password@cluster0.xxxxx.mongodb.net/equipment_rental`
6. In your **local `.env`** (already present), set:

   ```env
   MONGO_URI=<your Atlas connection string>
   JWT_SECRET=<any strong secret string>
   PORT=5000
   ```

   Test locally:
   - `cd server && npm install && npm run dev`
   - `cd client && npm install && npm run dev`

When local dev works against Atlas, you’re ready to deploy.

---

## 3. Deploy Backend to Render

1. Go to `https://render.com` and create/login to your account.
2. Click **New → Web Service**.
3. Connect your **GitHub repo** and select the repository that contains this project.
4. For the backend service:
   - **Name**: e.g. `equipment-rental-api`
   - **Root directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start` (or `node server.js`)
5. Set **Environment Variables** in Render:
   - `PORT` → `10000` (or leave empty; Render injects its own `PORT` but your code uses `process.env.PORT || 5000`, so either works).
   - `MONGO_URI` → your Atlas connection string.
   - `JWT_SECRET` → same value you used locally.
   - `FRONTEND_URL` → (you will set this after Vercel deploy; for now you can leave blank or set to `http://localhost:5173` during initial testing).
   - Any seed-related envs you use (e.g. `SEED_ADMIN_EMAIL`, etc.) if needed.
6. Click **Create Web Service** and wait for deployment.
7. After it builds successfully, note the **Render URL**, e.g.:
   - `https://equipment-rental-api.onrender.com`

Test backend directly:
- Open `https://equipment-rental-api.onrender.com/api/equipment` in the browser or via `curl` to confirm it responds.

After you know the final Vercel URL (next section), **come back** and set:
- `FRONTEND_URL` → `https://your-frontend.vercel.app`
and trigger a redeploy on Render.

---

## 4. Deploy Frontend to Vercel

1. Go to `https://vercel.com` and create/login to your account.
2. Click **Add New → Project**.
3. Import the same **GitHub repo**.
4. Configure project:
   - **Framework Preset**: Vite → React.
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables** on Vercel (if needed for API URL):
   - Because your frontend currently calls `/api/...` and Vite dev server proxies to `http://localhost:5000`, in production you’ll serve frontend and have it call Render.
   - Simplest approach: rely on browser hitting `/api/...` and set Vercel → Render rewrite or use an absolute URL.

   **Option A – Use absolute backend URL in `client/src/services/api.js`:**

   Modify `API_BASE` to:

   ```js
   const API_BASE =
     import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
   ```

   Then in Vercel, set:

   - `VITE_API_BASE` → `https://equipment-rental-api.onrender.com/api`

   (This change requires a code update and commit before deploying.)

6. Click **Deploy**.
7. After deployment, note your frontend URL:
   - e.g. `https://equipment-rental-frontend.vercel.app`

---

## 5. Finalize CORS (Render backend ↔ Vercel frontend)

1. In **Render → Web Service → Environment**:
   - Set `FRONTEND_URL` to your Vercel URL, e.g.:

     ```env
     FRONTEND_URL=https://equipment-rental-frontend.vercel.app
     ```

2. Redeploy the Render service.
3. Confirm the CORS middleware in `server/server.js` is:

   ```js
   const cors = require('cors');

   app.use(
     cors({
       origin: process.env.FRONTEND_URL || 'http://localhost:5173',
       credentials: true,
     })
   );
   ```

This way:
- In production, only requests from `FRONTEND_URL` are allowed.
- In local dev, CORS is allowed from `http://localhost:5173`.
- You can change the frontend URL **only via the Render env variable**, without touching code.

---

## 6. Environment Summary

### Local `.env` (server/.env)

```env
PORT=5000
MONGO_URI=<Atlas connection string>
JWT_SECRET=<your secret>
SEED_ADMIN_EMAIL=...
SEED_ADMIN_PASSWORD=...
SEED_USER_EMAIL=...
SEED_USER_PASSWORD=...
SEED_USER_NAME=...
```

### Render (Backend)

- `PORT` (optional; Render provides one)
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL` → `https://your-frontend.vercel.app`
- Any seed envs you actually use

### Vercel (Frontend)

- `VITE_API_BASE` → `https://your-backend.onrender.com/api`

---

## 7. Basic End-to-End Test (Production)

1. Open your **Vercel URL** in the browser.
2. Register or log in (if you seeded default users).
3. Confirm:
   - Equipment list loads from Render + Atlas.
   - Booking flow works (date/time, hours/days).
   - Admin/Equipment Manager dashboards load, show bookings, and status/penalty actions succeed.
4. If you see CORS errors in the browser console:
   - Double-check `FRONTEND_URL` on Render and the CORS middleware.
   - Confirm `VITE_API_BASE` (if used) points to the correct Render URL.

With this setup, you can deploy new versions simply by pushing to GitHub; both Render and Vercel will rebuild automatically using the same environment variables. 

