# Deploy Sonic Backend to Digital Ocean (App Platform + Docker)

Step-by-step guide to deploy the Sonic Django backend on Digital Ocean using Docker and App Platform.

---

## Prerequisites

- [ ] Digital Ocean account ([cloud.digitalocean.com](https://cloud.digitalocean.com))
- [ ] GitHub account with your `sonic` repo
- [ ] Backend already prepared for production (Dockerfile uses Daphne, settings support `DATABASE_URL` and `REDIS_URL`)

---

## Phase 1: Push Code to GitHub

1. **Ensure your backend is committed and pushed:**
   ```bash
   cd /path/to/sonic
   git add .
   git commit -m "Prepare backend for DigitalOcean deployment"
   git push origin main
   ```

2. Your repo structure should have the backend in a `backend/` folder at the root, or as the root of a separate repo.

---

## Phase 2: Create the App on Digital Ocean

### Step 1: Create a New App

1. Go to [DigitalOcean Cloud Console](https://cloud.digitalocean.com/)
2. Click **Apps** in the left sidebar
3. Click **Create App**

### Step 2: Connect and Select Source

1. Connect GitHub if you haven't already (authorize Digital Ocean)
2. Select your repository (e.g. `sonic` or your backend repo)
3. Set **Source Directory** to `backend` (if backend is inside the repo root)
4. Select branch: `main` (or your default branch)
5. Click **Next**

### Step 3: Configure the Web Service

1. Digital Ocean should detect your Dockerfile
2. Ensure **Type** is set to **Dockerfile**
3. **Dockerfile Path:** `Dockerfile` (or `backend/Dockerfile` if source dir is repo root)
4. **HTTP Port:** `8000`
5. Click **Edit** next to your web component to adjust settings

### Step 4: Database – Choose One Option

**Option A: Free External PostgreSQL (Recommended for small apps)**

Digital Ocean does not offer a free database. Use a free external PostgreSQL instead:

| Provider | Free Tier | Sign Up |
|----------|-----------|---------|
| **Neon** | 1 project, 3 GB storage, 1 GB RAM | [neon.tech](https://neon.tech) |
| **Supabase** | 500 MB, 2 projects | [supabase.com](https://supabase.com) |
| **Railway** | $5 free credit/mo | [railway.app](https://railway.app) |
| **Render** | 1 GB storage, 90-day free | [render.com](https://render.com) |
| **ElephantSQL** | 20 MB (tiny, for testing) | [elephantsql.com](https://elephantsql.com) |

1. Sign up at one of the providers above and create a PostgreSQL database  
   **→ Using Supabase? See [Appendix: Supabase Database Setup](#appendix-supabase-database-setup-step-by-step) for detailed steps.**
2. Copy the connection string (e.g. `postgresql://user:pass@host:5432/dbname?sslmode=require`)
3. In Digital Ocean → your web component → **Environment Variables**, add:
   - `DATABASE_URL` = `your-connection-string` (paste the full URL)
4. Skip adding a Digital Ocean database – you're done with the database step

**Option B: Digital Ocean Managed PostgreSQL ($7–15/mo)**

1. On the app spec page, click **+ Add Resource**
2. Select **Database** → **PostgreSQL**
3. Pick a plan (Basic ~$15/mo or Dev Database ~$7/mo)
4. Name it: `sonic-db`
5. In environment variables, set: `DATABASE_URL` = `${sonic-db.DATABASE_URL}`

### Step 5: Add Redis (Optional but Recommended for WebSockets)

1. Click **+ Add Resource** again
2. Select **Database**
3. Choose **Redis**
4. Pick a plan
5. Name it: `sonic-redis`
6. Click **Add**

> **Note:** If you skip Redis, real-time notifications work only with a single app instance. Add Redis if you plan to scale or use multiple instances.

### Step 6: Set Environment Variables for Your Web Service

1. Click on your **web** (service) component
2. Under **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `*.ondigitalocean.app` (or your exact app URL after first deploy) |
| `DATABASE_URL` | Your Neon/Supabase/etc connection string, or `${sonic-db.DATABASE_URL}` if using DO managed DB |
| `REDIS_URL` | `${sonic-redis.REDIS_URL}` (only if you added Redis) |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.com` (comma-separated if multiple) |
| `CSRF_TRUSTED_ORIGINS` | `https://your-frontend.com` |

3. If using Digital Ocean database/Redis: use **Reference** → select the component for `DATABASE_URL` and `REDIS_URL`.

---

## Phase 3: Deploy

1. Review your app spec
2. Click **Create Resources** or **Deploy**
3. Wait for the build and deploy (typically 3–8 minutes)

---

## Phase 4: Post-Deploy Configuration

1. **Get your app URL** – e.g. `https://sonic-backend-xxxxx.ondigitalocean.app`

2. **Update environment variables** with the real URL:
   - Go to your App → **Settings** → **App-Level Environment Variables** (or edit the web component)
   - Set `ALLOWED_HOSTS` = `your-actual-app.ondigitalocean.app`
   - Add your app URL to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` if needed

3. **Redeploy** so the new vars take effect (Apps → your app → Deployments → Redeploy)

4. **Verify the API:**
   ```bash
   curl https://your-app.ondigitalocean.app/api/
   ```

---

## Phase 5: Point Your Mobile App to Production

1. In your Expo app's `.env`, set:
   ```
   EXPO_PUBLIC_API_BASE_URL=https://your-app.ondigitalocean.app
   ```

2. Rebuild/restart the app so it uses the production API.

---

## Summary Checklist

- [ ] Code pushed to GitHub
- [ ] App created on Digital Ocean App Platform
- [ ] Source directory set to `backend`
- [ ] Dockerfile detected, port 8000
- [ ] Database: free external (Neon/Supabase/etc) **or** Digital Ocean managed PostgreSQL
- [ ] `DATABASE_URL` set (connection string or component reference)
- [ ] Redis added and linked via `REDIS_URL` (optional)
- [ ] `SECRET_KEY` set (strong random value)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` includes your app URL
- [ ] `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` set for frontend
- [ ] Deploy completed
- [ ] Post-deploy env vars updated with actual URL
- [ ] Mobile app configured to use production API URL

---

## Alternative: Droplet + Docker

For more control (VPS instead of managed App Platform):

1. Create a **Droplet** (Ubuntu 22.04)
2. Install Docker and Docker Compose
3. Create a **Digital Ocean Container Registry**
4. Build and push your image:
   ```bash
   doctl registry login
   docker build -t registry.digitalocean.com/YOUR_REGISTRY/sonic-backend:latest ./backend
   docker push registry.digitalocean.com/YOUR_REGISTRY/sonic-backend:latest
   ```
5. Add a **Managed PostgreSQL** database
6. SSH into the Droplet and run your container with `DATABASE_URL` and other env vars

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check Dockerfile path and that `backend/` (or repo root) contains the Dockerfile |
| 502 Bad Gateway | Ensure HTTP port is 8000 and the app listens on `0.0.0.0:8000` |
| Database connection refused | Verify `DATABASE_URL` is set (external URL or component reference). For Supabase, ensure `?sslmode=require` in the URL. |

---

## Appendix: Supabase Database Setup (Step by Step)

Use this when choosing **Option A** with Supabase as your free PostgreSQL database.

### Step 1: Create a Supabase Account and Project

1. Go to [supabase.com](https://supabase.com) and click **Start your project**
2. Sign in with GitHub or email
3. Click **New Project**
4. Fill in:
   - **Name:** `sonic` (or any name)
   - **Database Password:** Create a strong password and **save it** – you'll need it
   - **Region:** Choose closest to your Digital Ocean app region (e.g. same region)
5. Click **Create new project** and wait 1–2 minutes for the project to be ready

### Step 2: Get Your Connection String

1. In the Supabase dashboard, open your project
2. Click **Connect** (or go to **Project Settings** → **Database**)
3. In the "Connect to your project" dialog, go to **Connection string**
4. Set **Method** to **Session pooler** (not Direct connection)
   - Direct connection shows "Not IPv4 compatible" – Digital Ocean and most cloud platforms use IPv4 only
   - Session pooler uses port **6543** and works on IPv4
5. Copy the connection string (URI format). It looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with the database password you set in Step 1
7. Add `?sslmode=require` at the end if it's not there (e.g. `...postgres?sslmode=require`)

**Example of final URL:**
```
postgresql://postgres.jmtbcghemetazvqymelw:[MyStr0ngP@ss]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### Step 3: (Optional) Restrict Network Access

Supabase allows connections from anywhere by default. For production, you can restrict to your Digital Ocean app's IP if known, but for App Platform this is harder (IPs can change). Leaving it open is fine for small apps; you protect access with a strong password.

### Step 4: Use the Connection String in Digital Ocean

1. In Digital Ocean → your App → **web** component → **Environment Variables**
2. Add or edit:
   - **Key:** `DATABASE_URL`
   - **Value:** Paste your full Supabase connection string (with password, with `?sslmode=require`)
3. Ensure it's marked as **Encrypted** (sensitive) if the UI offers that option
4. Do **not** add a Digital Ocean database – Supabase is your database

### Step 5: Deploy and Verify

1. Deploy your app on Digital Ocean
2. After deploy, Django will run migrations automatically and create tables in Supabase
3. In Supabase: **Table Editor** → you should see tables like `sonic_app_user`, etc., after the first successful request

### Supabase Free Tier Limits

- **500 MB** database storage
- **2 projects** per account
- Suitable for small apps, MVPs, and side projects

### Troubleshooting Supabase

| Issue | Solution |
|-------|----------|
| "Not IPv4 compatible" / Connection timeout | **Use Session pooler** (Method → Session pooler, port 6543), not Direct connection. Digital Ocean is IPv4-only. |
| SSL error | Ensure `?sslmode=require` is at the end of your connection string |
| Password special chars | If your password has `@`, `#`, etc., URL-encode them (e.g. `@` → `%40`) |
| "Too many connections" | Session pooler (port 6543) handles this – ensure you're not using Direct connection |
| CORS errors | Add your frontend and app URLs to `CORS_ALLOWED_ORIGINS` |
| CSRF errors | Add same URLs to `CSRF_TRUSTED_ORIGINS` |
