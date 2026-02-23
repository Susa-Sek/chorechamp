# PROJ-1: User Authentication

> Status: Planned
> Created: 2026-02-23
> Dependencies: None

## Overview
Enable users to create accounts and authenticate securely to access their household data.

## User Stories

### US-1.1: User Registration
**As a** new user
**I want to** create an account with email and password
**So that** I can access ChoreChamp with my personal profile

**Acceptance Criteria:**
- [ ] Email validation with proper format check
- [ ] Password minimum 8 characters with complexity rules
- [ ] Confirmation email sent (can be disabled for MVP)
- [ ] Duplicate email detection with clear error message
- [ ] Redirect to onboarding after successful registration

### US-1.2: User Login
**As a** registered user
**I want to** log in with my email and password
**So that** I can access my household and chores

**Acceptance Criteria:**
- [ ] Login form with email and password fields
- [ ] "Remember me" option for extended session
- [ ] Clear error messages for invalid credentials
- [ ] Redirect to dashboard after successful login
- [ ] Loading state during authentication

### US-1.3: Password Reset
**As a** user who forgot my password
**I want to** reset my password via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] "Forgot password" link on login page
- [ ] Email input for password reset
- [ ] Password reset email sent
- [ ] Secure token-based reset link
- [ ] New password must meet complexity requirements

### US-1.4: User Logout
**As a** logged-in user
**I want to** log out of my account
**So that** my account remains secure on shared devices

**Acceptance Criteria:**
- [ ] Logout button accessible from navigation
- [ ] Session cleared on logout
- [ ] Redirect to landing page
- [ ] No cached sensitive data after logout

### US-1.5: User Profile
**As a** logged-in user
**I want to** view and edit my profile
**So that** my information is up to date

**Acceptance Criteria:**
- [ ] Display name (required)
- [ ] Avatar upload (optional, default avatar provided)
- [ ] Email display (read-only, change via separate flow)
- [ ] Save changes with success feedback
- [ ] Cancel changes option

## Edge Cases
- Email already exists during registration
- Invalid email format
- Password too weak
- Expired password reset token
- Session expired during activity
- Network error during authentication
- Multiple failed login attempts (rate limiting)

## Technical Notes
- Use Supabase Auth for authentication
- Store profile data in `profiles` table linked to `auth.users`
- Session management via Supabase client
- RLS policies ensure users can only access their own profile

## Database Schema

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## API Endpoints
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `POST /api/auth/reset-password` - Request password reset
- `GET /api/profile` - Get current user profile
- `PATCH /api/profile` - Update profile

## UI Components
- Login form
- Registration form
- Password reset form
- Profile page
- Avatar upload component