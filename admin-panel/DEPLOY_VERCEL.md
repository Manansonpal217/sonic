# Deploy Admin Panel to Vercel

Use this guide to deploy the Sonic admin panel to Vercel with your live backend at **https://sonic-db-n7v6t.ondigitalocean.app**.

---

## 1. Push the admin panel (if not already)

Ensure `admin-panel/` is in your repo and pushed to GitHub/GitLab/Bitbucket.

---

## 2. Create a Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub/GitLab/Bitbucket).
2. Click **Add New** → **Project**.
3. Import your **sonic** repository.
4. Configure the project:
   - **Root Directory:** `admin-panel` (important – not the repo root).
   - **Framework Preset:** Next.js (auto-detected).
   - **Build Command:** `next build` (default).
   - **Output Directory:** leave default.
5. Do **not** deploy yet – add environment variables first.

---

## 3. Set environment variables on Vercel

In your Vercel project: **Settings** → **Environment Variables**. Add:

| Name | Value | Environment |
|------|--------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://sonic-db-n7v6t.ondigitalocean.app/api` | Production, Preview |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | `https://sonic-db-n7v6t.ondigitalocean.app/media` | Production, Preview |

Save. Redeploy (Deployments → ⋮ on latest → Redeploy) so the build uses these values.

---

## 4. Allow the Vercel URL on your backend (DigitalOcean)

Your backend must allow the admin panel’s Vercel URL for CORS and CSRF.

1. After the first deploy, copy your admin panel URL, e.g. `https://sonic-admin-xxx.vercel.app`.
2. In **DigitalOcean** (or wherever the backend runs), edit the backend environment variables and add that URL to:
   - **CORS_ALLOWED_ORIGINS**  
     Append: `,https://your-admin.vercel.app`  
     Example: `https://sonic-db-n7v6t.ondigitalocean.app,https://sonic-admin-xxx.vercel.app`
   - **CSRF_TRUSTED_ORIGINS**  
     Same value: append `,https://your-admin.vercel.app`
3. Restart/redeploy the backend so the new env vars are applied.

---

## 5. Deploy

- **First time:** Click **Deploy** in Vercel after setting the env vars.
- **Later:** Push to your connected branch; Vercel will auto-deploy.

---

## Checklist

- [ ] Vercel project root is `admin-panel`
- [ ] `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_MEDIA_BASE_URL` set on Vercel
- [ ] Backend `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` include your Vercel admin URL
- [ ] Login and API calls work from the deployed admin URL

---

## CORS still failing? (DigitalOcean backend)

If the admin panel shows "CORS error" on login even after adding env vars:

1. **Exact value** – In DigitalOcean App → your backend component → **Settings** → **App-Level Environment Variables**, set:
   - `CORS_ALLOWED_ORIGINS` = `https://sonic-xyz.vercel.app` (no trailing slash, no spaces; add others comma-separated if needed, e.g. `http://localhost:3000,https://sonic-xyz.vercel.app`)
   - `CSRF_TRUSTED_ORIGINS` = same value as above

2. **Redeploy** – Changing env vars does **not** restart the running app. Go to **Deployments** → open the **⋮** on the latest deployment → **Redeploy**, or push a small change to trigger a new deploy.

3. **Check the component** – If the app has multiple components (e.g. API + worker), set the variables for the component that serves the API (the one that receives browser requests).

---

## Optional: custom domain

In Vercel: **Settings** → **Domains** → add your domain (e.g. `admin.yourdomain.com`). Then add that same URL to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` on the backend.
