# Deployment Guide

## Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. Make sure you're in the frontend directory
2. Update the API URL in your code to use environment variable

### Step 2: Deploy to Vercel

**Option A: Using Vercel Dashboard (Easiest)**

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository (or upload folder)
5. Select `frontend` folder as root directory
6. Add Environment Variables:
   - `REACT_APP_SUPABASE_URL` = your_supabase_url
   - `REACT_APP_SUPABASE_ANON_KEY` = your_anon_key
7. Click "Deploy"

**Option B: Using Vercel CLI**

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

When prompted:
- Set up and deploy? Yes
- Which scope? Your account
- Link to existing project? No
- Project name? employee-onboarding-frontend
- Directory? ./
- Override settings? No

---

## Deploy Backend to Render

### Step 1: Create render.yaml

Already created in backend folder.

### Step 2: Deploy to Render

1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: employee-onboarding-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

6. Add Environment Variables:
   - `PORT` = 10000
   - `NODE_ENV` = production
   - `SUPABASE_URL` = your_supabase_url
   - `SUPABASE_SERVICE_KEY` = your_service_key
   - `STORAGE_BUCKET` = employee-documents
   - `FRONTEND_URL` = your_vercel_url (add after frontend is deployed)

7. Click "Create Web Service"

### Step 3: Update Frontend with Backend URL

After backend is deployed, update frontend environment:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `REACT_APP_API_URL` = your_render_backend_url (e.g., https://employee-onboarding-backend.onrender.com/api)
3. Redeploy frontend

---

## Quick Deploy Steps

### 1. Deploy Backend First
- Push code to GitHub
- Create Render web service
- Wait for deployment (5-10 mins)
- Copy backend URL (e.g., https://yourapp.onrender.com)

### 2. Deploy Frontend
- Update frontend to use backend URL
- Deploy to Vercel
- Add environment variables
- Copy frontend URL

### 3. Update CORS
- Update backend CORS to allow your Vercel domain
- Redeploy backend

---

## Important Notes

**Free Tier Limitations:**
- Render: Backend sleeps after 15 mins inactivity (takes 30s to wake up)
- Vercel: 100GB bandwidth/month, unlimited requests

**Environment Variables:**
- Never commit .env files
- Set all variables in deployment dashboard
- Frontend variables must start with REACT_APP_

**Database:**
- Supabase is already hosted, no changes needed
- Make sure RLS is properly configured for production

---

## Troubleshooting

**Backend not responding:**
- Check Render logs
- Verify environment variables
- Ensure port is set to what Render provides

**Frontend can't connect to backend:**
- Check CORS settings
- Verify API_URL is correct
- Check browser console for errors

**Database connection fails:**
- Verify Supabase credentials
- Check if Supabase project is paused
- Review RLS policies
