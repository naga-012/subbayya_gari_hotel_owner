# 🚀 Render Deployment Guide — Subbayya Gari Hotel

This guide walks you through deploying the **Subbayya Gari Hotel** Full-Stack Node.js, Express, MongoDB & Socket.IO application to **[Render](https://render.com)**.

---

## 📋 Prerequisites

Before starting, ensure you have:
1. A **[GitHub](https://github.com)** or **[GitLab](https://gitlab.com)** account.
2. A free **[Render](https://render.com)** account.
3. A free **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** account (Render requires a cloud-hosted MongoDB database; local `mongodb://127.0.0.1:27017` will not work on cloud servers).

---

## 🍃 Step 1: Set Up Free MongoDB Atlas Cloud Database

If you already have a MongoDB Atlas cluster, skip to step 1.4 for the connection string.

### 1.1 Create Free Cluster
1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Click **Create** and select the **M0 Free** tier (AWS or GCP region closest to your users, e.g. Mumbai `ap-south-1` or Singapore).
3. Name your cluster (e.g., `Cluster0`) and click **Create Cluster**.

### 1.2 Create Database User
1. In Atlas left sidebar, go to **Security** ➔ **Database Access**.
2. Click **Add New Database User**.
3. Set **Authentication Method** to `Password`.
4. Enter a username (e.g. `subbayya_admin`) and a secure password. *(Save these credentials!)*
5. Set Database User Privileges to **Read and write to any database**.
6. Click **Add User**.

### 1.3 Configure Network Access (Important)
Render web services use dynamic outbound IP addresses, so you must allow connections from any IP:
1. In Atlas left sidebar, go to **Security** ➔ **Network Access**.
2. Click **Add IP Address**.
3. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Click **Confirm**.

### 1.4 Copy Connection String
1. Go to **Deployment** ➔ **Database** in Atlas.
2. Click the **Connect** button on your cluster.
3. Choose **Drivers** (Node.js).
4. Copy the connection string. It looks like:
   ```
   mongodb+srv://subbayya_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
5. Replace `<password>` with your database user password, and add `/subbayya_gari_hotel` before the `?` query string:
   ```
   mongodb+srv://subbayya_admin:YOUR_PASSWORD@cluster0.abcde.mongodb.net/subbayya_gari_hotel?retryWrites=true&w=majority
   ```

---

## 🐙 Step 2: Push Project Code to GitHub

Open PowerShell in your project folder (`c:\Users\myaka\OneDrive\Desktop\subbayya_gari_hotel_owner-main`):

```powershell
# 1. Initialize Git repository
git init

# 2. Stage all project files (.env is safely ignored by .gitignore)
git add .

# 3. Commit your changes
git commit -m "Configure Subbayya Gari Hotel for Render deployment"

# 4. Rename default branch to main
git branch -M main

# 5. Add your GitHub repository remote (create a new repository on github.com first)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 🚀 Step 3: Deploy to Render

You can deploy using either **Method A (Blueprint - 1-Click)** or **Method B (Manual Web Service)**.

### Method A: Deploy using Render Blueprint (Recommended)

The repository includes a ready-to-use [`render.yaml`](./render.yaml) file:

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** (top right) ➔ **Blueprint**.
3. Select and connect your GitHub repository (`<YOUR_REPO_NAME>`).
4. Render will parse [`render.yaml`](./render.yaml) and display the service setup.
5. In the Environment Variables prompt, fill in:
   - `MONGODB_URI`: Paste your MongoDB Atlas connection string from Step 1.4.
   - `OWNER_PASSWORD`: Enter your chosen Owner Admin password (e.g. `123456`).
6. Click **Apply**.
7. Render will automatically build, deploy, and seed your database!

---

### Method B: Deploy Manually as a Web Service

If you prefer configuring via the Render UI:

1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name:** `subbayya-gari-hotel`
   - **Region:** `Oregon (US West)` or `Singapore (Southeast Asia)`
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Click **Advanced** and set:
   - **Health Check Path:** `/api/health`
6. Scroll down to **Environment Variables** and add the following keys:

| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production mode |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas URI from Step 1.4 |
| `JWT_SECRET` | *(Click "Generate" or type a 32+ char secret)* | JWT Signing Key |
| `OWNER_NAME` | `G.Subbayya` | Restaurant Owner display name |
| `OWNER_EMAIL` | `myakallanagarjun09@gmail.com` | Owner Portal login email |
| `OWNER_PASSWORD` | `123456` | Owner Portal login password |
| `OWNER_PHONE` | `+919121792433` | Owner contact phone |

7. Click **Create Web Service**.

---

## 🔍 Step 4: Verification & Live Testing

Once deployment finishes and Render logs show `==> Your service is live`:

### 1. Check Service Health
Visit:
```
https://<your-service-name>.onrender.com/api/health
```
You should see:
```json
{
  "status": "OK",
  "platform": "Render",
  "database": "connected",
  "uptime": 24,
  "timestamp": "2026-09-21T...",
  "restaurant": "Subbayya Gari Hotel"
}
```

### 2. Access Owner Portal
Visit:
```
https://<your-service-name>.onrender.com/owner/
```
Or simply:
```
https://<your-service-name>.onrender.com/
```
*(The root URL automatically redirects to `/owner/`)*.

### 3. Log In to Owner Dashboard
- **Email:** `myakallanagarjun09@gmail.com` (or whatever `OWNER_EMAIL` you set)
- **Password:** `123456` (or whatever `OWNER_PASSWORD` you set)

### 4. Real-time Socket.IO Features
On Render, the Node.js server stays continuously connected. Real-time features work out of the box:
- 🔔 Real-time loud kitchen order audio chimes
- 📊 Instant live dashboard metrics updates
- 🛵 Live multi-stage order tracking

---

## 💡 Render Free Tier Notes

- **Spin-down on inactivity**: On Render's Free tier, services spin down after 15 minutes of inactivity. When a new request arrives, it takes ~30–50 seconds to wake up (cold start).
- **Zero-Downtime Deploys**: Render automatically tests `/api/health` before switching live traffic to new deployments.
- **Custom Domains**: You can attach a custom domain (e.g. `owner.subbayyagarihotel.com`) for free under the service's **Settings** tab with automated SSL certificates.
