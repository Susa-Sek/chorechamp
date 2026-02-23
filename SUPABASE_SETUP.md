# Supabase Setup Guide

This guide walks you through setting up Supabase for ChoreChamp.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter a name (e.g., "chorechamp")
4. Set a secure database password (save this!)
5. Choose a region close to your users
6. Click "Create new project"

## 2. Get Your Credentials

1. Go to **Project Settings** > **API**
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run the Database Migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the contents of `supabase/migrations/20240223000001_profiles.sql`
4. Paste and click "Run"

This creates:
- `profiles` table linked to `auth.users`
- Row Level Security (RLS) policies
- Auto-create profile trigger on signup
- Auto-update timestamp trigger

## 4. Configure Authentication

### Disable Email Confirmation (for MVP/Development)

1. Go to **Authentication** > **Providers**
2. Click on "Email"
3. Toggle OFF "Confirm email"
4. Click "Save"

### Enable Email Confirmation (for Production)

1. Go to **Authentication** > **Providers**
2. Toggle ON "Confirm email"
3. Configure SMTP settings or use Supabase's default

### Configure Redirect URLs

1. Go to **Authentication** > **URL Configuration**
2. Add your URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)

## 5. Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/auth/register`
3. Create a test account
4. Check Supabase dashboard:
   - **Authentication** > **Users** should show your new user
   - **Table Editor** > **profiles** should show your profile

## Database Schema

### profiles table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| display_name | TEXT | User's display name (2-50 chars) |
| avatar_url | TEXT | Optional avatar URL |
| created_at | TIMESTAMPTZ | Account creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### RLS Policies

| Policy | Permission |
|--------|------------|
| Users can view own profile | SELECT (own data only) |
| Users can insert own profile | INSERT (own data only) |
| Users can update own profile | UPDATE (own data only) |
| Users can delete own profile | DELETE (own data only) |

## Troubleshooting

### "User already registered" error
The email is already in use. Try a different email or log in instead.

### Profile not created after signup
- Check that the migration was run successfully
- Check Supabase logs for errors
- The trigger might have failed - try inserting manually

### Authentication not persisting
- Clear browser cookies and try again
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Ensure middleware is working (check Network tab for auth cookies)