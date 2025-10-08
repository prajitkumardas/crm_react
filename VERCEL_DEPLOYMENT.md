# Vercel Deployment Guide

This guide will help you deploy your Smart Client Management CRM application to Vercel with minimum configuration changes.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Your Supabase project should be set up and running
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Environment Variables

### Copy Environment Variables
1. Copy your `.env.local` file values
2. You'll need to set these in Vercel dashboard

### Required Environment Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-app-name.vercel.app
```

## Step 2: Deploy to Vercel

### Option A: Deploy from Git (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js

2. **Configure Build Settings**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)

3. **Add Environment Variables**:
   - In Vercel dashboard, go to your project
   - Navigate to "Settings" → "Environment Variables"
   - Add all required environment variables from Step 1

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose your project name
   - Vercel will auto-detect Next.js settings

## Step 3: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production |
| `NEXTAUTH_SECRET` | Random secret string | Production |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Production |

## Step 4: Database Configuration

### Update Supabase CORS Settings

1. Go to your Supabase project dashboard
2. Navigate to "Settings" → "API"
3. Under "CORS Configuration", add your Vercel domain:
   - Add `https://your-app-name.vercel.app` to allowed origins

### Update Authentication Redirect URLs

1. In Supabase, go to "Authentication" → "Settings"
2. Under "Site URL", add: `https://your-app-name.vercel.app`
3. Under "Redirect URLs", add: `https://your-app-name.vercel.app/auth/callback`

## Step 5: Deploy and Test

1. **Trigger Deployment**:
   - If using Git integration, push to your main branch
   - Or manually trigger deployment in Vercel dashboard

2. **Monitor Build**:
   - Check Vercel dashboard for build status
   - View build logs for any errors

3. **Test Application**:
   - Visit your deployed URL
   - Test user registration/login
   - Test basic functionality (add client, create packages, etc.)

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure environment variables are set correctly
- Check build logs in Vercel dashboard

### Runtime Errors
- Verify Supabase connection and CORS settings
- Check that all environment variables are set
- Ensure database tables exist and migrations are run

### Authentication Issues
- Confirm redirect URLs are set in Supabase
- Check that `NEXTAUTH_URL` matches your Vercel domain
- Verify Supabase keys are correct

## Performance Optimizations

Your application is already configured with:
- ✅ Bundle splitting and code splitting
- ✅ Image optimization
- ✅ Static asset caching
- ✅ Compression enabled

## Security Features

- ✅ Environment variables properly configured
- ✅ CORS headers set
- ✅ Security headers configured
- ✅ Supabase RLS (Row Level Security) enabled

## Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] User authentication works
- [ ] Database connections work
- [ ] All features function correctly
- [ ] Mobile responsiveness verified
- [ ] Performance is acceptable

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test Supabase connection
4. Check browser console for errors

Your CRM application is now ready for production! 🚀