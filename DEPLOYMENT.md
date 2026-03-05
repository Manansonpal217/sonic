# Deployment Guide

Admin panel → **Vercel** | Backend → **DigitalOcean App Platform**

Both auto-deploy on push to GitHub.

---

## 1. Admin Panel (Vercel)

### Connect GitHub
1. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
2. **Root Directory**: Set to `admin-panel` (required for monorepo)
3. Framework: Next.js (auto-detected)
4. Build Command: `npm run build` (default)
5. Output Directory: `.next` (default)

### Environment Variables (Project Settings → Environment Variables)
Add for **Production** (and Preview if you want):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://sonic-db-n7v6t.ondigitalocean.app/api` |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | `https://sonic-db-n7v6t.ondigitalocean.app/media` |

### After deploy
Your admin will be at `https://your-project.vercel.app`. Note this URL for the backend config below.

---

## 2. Backend (DigitalOcean App Platform)

### Connect GitHub
1. DigitalOcean → Apps → Create App → GitHub
2. Select repo and branch
3. **Source Directory**: Set to `backend` (if backend is in a subfolder)
4. Configure build/run commands for Django

### Environment Variables
Add your **Vercel admin URL** to CORS and CSRF:

| Variable | Value |
|----------|-------|
| `CORS_ALLOWED_ORIGINS` | `https://your-admin.vercel.app,https://sonic-db-n7v6t.ondigitalocean.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://your-admin.vercel.app,https://sonic-db-n7v6t.ondigitalocean.app` |

Replace `your-admin.vercel.app` with your actual Vercel URL (e.g. `inara-admin.vercel.app`).

### Other required vars
- `DEBUG=False`
- `SECRET_KEY` (generate a secure key)
- `DATABASE_URL` (from DigitalOcean managed DB if used)
- `ALLOWED_HOSTS` (your DigitalOcean app URL)

---

## 3. Checklist

- [ ] Vercel: Root Directory = `admin-panel`
- [ ] Vercel: `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_MEDIA_BASE_URL` set
- [ ] DigitalOcean: `CORS_ALLOWED_ORIGINS` includes Vercel URL
- [ ] DigitalOcean: `CSRF_TRUSTED_ORIGINS` includes Vercel URL
- [ ] `.env` files are **not** committed (they’re in `.gitignore`)

---

## 4. Auto-deploy

- **Vercel**: Deploys on every push to the default branch (and PR previews)
- **DigitalOcean**: Deploys when you enable auto-deploy for the connected branch
