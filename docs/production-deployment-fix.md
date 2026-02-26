# Production Deployment Fix Guide

## Problem
The production deployment at `chorechamp.vercel.app` returns 404 for all routes except the homepage.

## Diagnosis
The ChoreChamp routes exist and build correctly locally:
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Password reset page
- `/dashboard` - Protected dashboard
- `/chores` - Chore management
- `/rewards` - Rewards system
- `/household` - Household management

The issue is a deployment mismatch - the production deployment may be:
1. Serving an old version of the code
2. Missing environment variables
3. Deployed from the wrong branch or directory

## Solution

### Option 1: Redeploy via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select the `chorechamp` project
3. Go to Settings > Environment Variables
4. Verify these variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Go to Deployments tab
6. Click "Redeploy" on the latest successful deployment
7. Select "Use existing Build Cache" = OFF (to force a fresh build)

### Option 2: Redeploy via Vercel CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Link project
cd chorechamp
vercel link

# Deploy to production
vercel --prod
```

### Option 3: Force Push to Trigger New Deployment
```bash
# Make a small change and push
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

## Environment Variables Required

| Variable | Where to find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API > service_role (for test seeding only) |

## Verify Deployment
After redeployment, check these URLs:
- https://chorechamp.vercel.app/auth/login - Should show login form
- https://chorechamp.vercel.app/auth/register - Should show registration form
- https://chorechamp.vercel.app/dashboard - Should redirect to login (protected)

## E2E Test Users

To seed test users for E2E testing:

1. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
2. Run: `npm run test:seed-users`

Test credentials:
- parent@test.com / Test1234!
- child@test.com / Test1234!
- partner@test.com / Test1234!
- solo@test.com / Test1234!