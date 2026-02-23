# PROJ-1: User Authentication

> Status: In Review
> Created: 2026-02-23
> Updated: 2026-02-23
> Dependencies: None

## Overview
Enable users to create accounts and authenticate securely to access their household data.

## User Stories

### US-1.1: User Registration
**As a** new user
**I want to** create an account with email and password
**So that** I can access ChoreChamp with my personal profile

**Acceptance Criteria:**
- [x] Email validation with proper format check
- [x] Password minimum 8 characters with complexity rules
- [x] Confirmation email sent (can be disabled for MVP)
- [x] Duplicate email detection with clear error message
- [x] Redirect to onboarding after successful registration

### US-1.2: User Login
**As a** registered user
**I want to** log in with my email and password
**So that** I can access my household and chores

**Acceptance Criteria:**
- [x] Login form with email and password fields
- [x] "Remember me" option for extended session
- [x] Clear error messages for invalid credentials
- [x] Redirect to dashboard after successful login
- [x] Loading state during authentication

### US-1.3: Password Reset
**As a** user who forgot my password
**I want to** reset my password via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- [x] "Forgot password" link on login page
- [x] Email input for password reset
- [x] Password reset email sent
- [x] Secure token-based reset link
- [x] New password must meet complexity requirements

### US-1.4: User Logout
**As a** logged-in user
**I want to** log out of my account
**So that** my account remains secure on shared devices

**Acceptance Criteria:**
- [x] Logout button accessible from navigation
- [x] Session cleared on logout
- [x] Redirect to landing page
- [x] No cached sensitive data after logout

### US-1.5: User Profile
**As a** logged-in user
**I want to** view and edit my profile
**So that** my information is up to date

**Acceptance Criteria:**
- [x] Display name (required)
- [x] Avatar upload (optional, default avatar provided) - Auto-generated initials avatar
- [x] Email display (read-only, change via separate flow)
- [x] Save changes with success feedback
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

---

## Tech Design (Solution Architect)

### Component Structure (Visual Tree)

```
App Layout
+-- AuthProvider (Session State Manager)
|   +-- Checks if user is logged in
|   +-- Provides user context to all children
|
+-- Public Routes (unauthenticated)
|   +-- / (Landing Page)
|   |   +-- Hero Section
|   |   +-- Features Overview
|   |   +-- CTA Buttons (Login / Register)
|   |
|   +-- /auth/login
|   |   +-- AuthLayout (centered card)
|   |   +-- LoginForm
|   |       +-- Email Input
|   |       +-- Password Input
|   |       +-- "Remember Me" Checkbox
|   |       +-- Submit Button
|   |       +-- "Forgot Password" Link
|   |       +-- "Create Account" Link
|   |
|   +-- /auth/register
|   |   +-- AuthLayout (centered card)
|   |   +-- RegisterForm
|   |       +-- Display Name Input
|   |       +-- Email Input
|   |       +-- Password Input
|   |       +-- Confirm Password Input
|   |       +-- Password Strength Indicator
|   |       +-- Submit Button
|   |       +-- "Already have account?" Link
|   |
|   +-- /auth/forgot-password
|   |   +-- AuthLayout
|   |   +-- ForgotPasswordForm
|   |       +-- Email Input
|   |       +-- Submit Button
|   |       +-- Back to Login Link
|   |
|   +-- /auth/reset-password
|       +-- AuthLayout
|       +-- ResetPasswordForm
|           +-- New Password Input
|           +-- Confirm Password Input
|           +-- Submit Button
|
+-- Protected Routes (authenticated)
    +-- /dashboard (redirect here after login)
    |
    +-- /profile
        +-- ProfileHeader
        |   +-- Avatar (editable)
        |   +-- Display Name
        |   +-- Member Since date
        |
        +-- ProfileForm
        |   +-- Display Name Input
        |   +-- Email Display (read-only)
        |   +-- Save Button
        |   +-- Cancel Button
        |
        +-- DangerZone
            +-- Change Password Button
            +-- Delete Account Button
```

### User Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Landing   │────▶│   Register   │────▶│  Onboarding │
│    Page     │     │    Form      │     │ (Dashboard) │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌──────────────┐
       │            │  Email       │
       │            │  Confirm     │
       │            └──────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Login     │────▶│  Dashboard   │────▶│  Profile    │
│    Form     │     │              │     │  Settings   │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Forgot     │────▶│  Reset       │────▶│  Login      │
│  Password   │     │  Password    │     │  Success    │
└─────────────┘     └──────────────┘     └─────────────┘
```

### Data Model (Plain Language)

**User Account (managed by Supabase Auth)**
- Unique identifier (auto-generated)
- Email address (must be unique across all users)
- Encrypted password (handled by Supabase, never stored in plain text)
- Email verification status
- Account creation timestamp

**User Profile (our custom data)**
- Links to the user account via unique identifier
- Display name (shown to other household members)
- Avatar image URL (optional, default avatar provided)
- Timestamps for creation and last update

**Session Data**
- Stored in browser cookies (secure, httpOnly)
- Automatically managed by Supabase
- Expires after configurable time (default: 7 days with "remember me")
- Refreshed automatically while user is active

### Tech Decisions (Why?)

| Decision | Reasoning |
|----------|-----------|
| **Supabase Auth** | Handles all security complexity (password hashing, session management, email verification). Saves development time and reduces security risks. Industry-standard solution. |
| **Server-Side Sessions** | More secure than client-side tokens. Cookies are httpOnly (JavaScript can't access them) and secure (HTTPS only). Prevents XSS attacks from stealing sessions. |
| **Email Confirmation Disabled for MVP** | Reduces friction during testing. Can be enabled later in Supabase dashboard with one click. |
| **Password Requirements** | Minimum 8 characters. Balances security with usability. Supabase can enforce stronger rules if needed. |
| **Redirect to Dashboard after Login** | Using `window.location.href` instead of Next.js router. Ensures server components re-fetch with new session. More reliable for auth state changes. |
| **Default Avatar** | Users get a generated avatar (initials + color) immediately. No friction to start using the app. Can upload custom avatar later. |

### Route Structure

| Route | Public/Protected | Purpose |
|-------|------------------|---------|
| `/` | Public | Landing page with app overview |
| `/auth/login` | Public | Login form |
| `/auth/register` | Public | Registration form |
| `/auth/forgot-password` | Public | Request password reset email |
| `/auth/reset-password` | Public | Set new password (from email link) |
| `/auth/callback` | Public | OAuth callback (future) + Email verification callback |
| `/dashboard` | Protected | Main app entry point after login |
| `/profile` | Protected | View/edit user profile |

### Security Considerations

1. **Password Storage:** Never stored in our database. Supabase handles hashing with bcrypt/scrypt.

2. **Session Security:**
   - HttpOnly cookies (not accessible via JavaScript)
   - Secure flag (HTTPS only in production)
   - SameSite=Lax (protects against CSRF)

3. **Rate Limiting:** Supabase provides built-in rate limiting for auth endpoints. Additional protection via Vercel Edge Functions if needed.

4. **RLS (Row Level Security):** Database policies ensure users can only access their own profile data.

### Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client for auth and database |
| `@supabase/ssr` | Server-side auth helpers for Next.js |
| `react-hook-form` | Form state management and validation |
| `@hookform/resolvers` | Connects Zod validation to react-hook-form |
| `zod` | Runtime validation schemas |
| `lucide-react` | Icons (already installed) |

### Shared Code for React Native (Future)

When building the mobile app, these can be shared:
- **Types:** `User`, `Profile` interfaces
- **Validation:** Zod schemas for registration/login
- **API Logic:** Supabase client configuration
- **Business Logic:** Password strength calculation

Platform-specific:
- **Web:** Next.js pages, server components, cookies
- **Mobile:** React Navigation screens, AsyncStorage for sessions