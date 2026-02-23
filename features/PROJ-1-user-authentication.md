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
- [ ] BUG: Email display shows user ID instead of email address
- [x] Save changes with success feedback
- [ ] Cancel changes option - NOT IMPLEMENTED

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

---

## QA Test Results

**Tested:** 2026-02-23
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASSED (Next.js 16.1.1)

### Acceptance Criteria Status

#### AC-1.1: User Registration
- [x] Email validation with proper format check (Zod schema with `.email()`)
- [x] Password minimum 8 characters with complexity rules (requires uppercase, lowercase, number)
- [x] Confirmation email infrastructure in place (`emailRedirectTo` configured)
- [x] Duplicate email detection with clear error message (German: "E-Mail bereits registriert")
- [ ] BUG: Redirect to onboarding after registration - User sees success message and must manually go to login (expected: auto-redirect to dashboard)

#### AC-1.2: User Login
- [x] Login form with email and password fields
- [ ] BUG: "Remember me" checkbox is NON-FUNCTIONAL - value is collected but not passed to Supabase signIn
- [x] Clear error messages for invalid credentials (German: "Ungultige Anmeldedaten")
- [x] Redirect to dashboard after successful login (uses `window.location.href`)
- [x] Loading state during authentication ("Wird geladen...")

#### AC-1.3: Password Reset
- [x] "Forgot password" link on login page
- [x] Email input for password reset
- [x] Password reset email sent via Supabase
- [x] Secure token-based reset link (Supabase handles tokens)
- [x] New password must meet complexity requirements (Zod validation)
- [ ] BUG: Reset password page shows error for missing token but doesn't prevent form submission

#### AC-1.4: User Logout
- [x] Logout button accessible from profile page
- [x] Session cleared on logout (Supabase signOut + state reset)
- [x] Redirect to landing page (`window.location.href = "/"`)
- [x] No cached sensitive data after logout (session cleared from state and cookies)

#### AC-1.5: User Profile
- [x] Display name (required, min 2 chars, max 50 chars)
- [x] Auto-generated initials avatar with color gradient
- [ ] BUG: Email field displays `profile.id` (UUID) instead of `profile.email` - shows user ID in email field!
- [x] Save changes with success feedback ("Profil erfolgreich aktualisiert!")
- [ ] NOT IMPLEMENTED: Cancel changes option - no button to revert form changes

### Edge Cases Status

#### EC-1: Email already exists during registration
- [x] Handled correctly - Supabase returns error, translated to German

#### EC-2: Invalid email format
- [x] Handled correctly - Zod validation shows "Ungultige E-Mail-Adresse"

#### EC-3: Password too weak
- [x] Handled correctly - Zod validation enforces 8 chars, uppercase, lowercase, number
- [x] Password strength indicator shows "Schwach", "Mittel", "Stark"

#### EC-4: Expired password reset token
- [x] Partially handled - Error message shown but form still submittable

#### EC-5: Session expired during activity
- [x] Handled - Middleware refreshes session, protected layout checks auth state

#### EC-6: Network error during authentication
- [ ] NOT HANDLED - No network error handling, user sees generic Supabase error

#### EC-7: Multiple failed login attempts (rate limiting)
- [x] Handled by Supabase built-in rate limiting

### Security Audit Results

#### Authentication Security
- [x] Password hashing: Handled by Supabase (bcrypt/scrypt)
- [x] Session cookies: HttpOnly, Secure (in production), SameSite=Lax
- [x] Session management: Server-side via Supabase SSR
- [x] Auth state persistence: Supabase handles token refresh

#### Authorization (Row Level Security)
- [x] RLS enabled on `profiles` table
- [x] SELECT policy: Users can only view own profile
- [x] INSERT policy: Users can only insert own profile
- [x] UPDATE policy: Users can only update own profile
- [x] DELETE policy: Users can only delete own profile
- [x] Foreign key cascade: ON DELETE CASCADE for user deletion

#### Input Validation
- [x] Client-side validation: Zod schemas on all forms
- [ ] PARTIAL: No server-side API routes - validation relies on Supabase and client-side only
- [x] SQL injection: Protected by Supabase parameterized queries
- [x] XSS: React auto-escapes, no `dangerouslySetInnerHTML` used

#### Security Headers
- [ ] NOT CONFIGURED: No explicit security headers in middleware or next.config.ts
- [ ] Missing: X-Frame-Options, X-Content-Type-Options, Content-Security-Policy

#### CSRF Protection
- [x] Supabase SSR handles CSRF via SameSite cookies

#### Secrets Management
- [x] Environment variables used for Supabase credentials
- [x] `.env.local.example` provided with dummy values
- [x] `.env.local` in `.gitignore`

#### Protected Routes
- [x] Middleware protects `/dashboard` and `/profile` routes
- [x] Client-side auth check in protected layout
- [x] Authenticated users redirected away from auth pages

### Cross-Browser Testing
- [ ] Chrome - NOT TESTED (manual testing required)
- [ ] Firefox - NOT TESTED (manual testing required)
- [ ] Safari - NOT TESTED (manual testing required)

### Responsive Design Testing
- [ ] Mobile (375px) - NOT TESTED (manual testing required)
- [ ] Tablet (768px) - NOT TESTED (manual testing required)
- [ ] Desktop (1440px) - NOT TESTED (manual testing required)

### Bugs Found

#### BUG-1: "Remember Me" Checkbox Non-Functional
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Go to `/auth/login`
  2. Check "Angemeldet bleiben" (Remember Me) checkbox
  3. Log in with credentials
  4. Close browser and reopen
  5. Expected: Session persists longer
  6. Actual: Checkbox value is ignored, no effect on session duration
- **Root Cause:** `signIn` function in `auth-provider.tsx` does not use `rememberMe` parameter
- **Fix Location:** `src/components/auth/auth-provider.tsx:114-125`
- **Priority:** Fix before deployment

#### BUG-2: Email Field Shows User ID Instead of Email
- **Severity:** High
- **Steps to Reproduce:**
  1. Log in and go to `/profile`
  2. Look at the Email field
  3. Expected: Shows user's email address
  4. Actual: Shows user's UUID (e.g., "a1b2c3d4-...")
- **Root Cause:** `src/app/(protected)/profile/page.tsx:169` uses `profile?.id` instead of email
- **Fix Location:** `src/app/(protected)/profile/page.tsx:169`
- **Priority:** Fix before deployment

#### BUG-3: No Cancel Button on Profile Edit
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to `/profile`
  2. Edit display name
  3. Try to cancel changes
  4. Expected: Cancel button to revert form
  5. Actual: No cancel button, must manually revert or navigate away
- **Priority:** Fix in next sprint

#### BUG-4: Password Reset Page Allows Submission Without Token
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Navigate directly to `/auth/reset-password` without token
  2. Error message shows "Ungultiger Link"
  3. Form is still visible and submittable
  4. Expected: Form hidden or disabled when no valid token
- **Priority:** Fix in next sprint

#### BUG-5: No Network Error Handling
- **Severity:** Low
- **Steps to Reproduce:**
  1. Disconnect network
  2. Try to log in
  3. Expected: Friendly error message like "Netzwerkfehler"
  4. Actual: Generic Supabase error or no feedback
- **Priority:** Nice to have

#### BUG-6: Missing Security Headers
- **Severity:** Medium
- **Issue:** No security headers configured in middleware or Next.js config
- **Missing Headers:**
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: origin-when-cross-origin
  - Strict-Transport-Security (production)
- **Priority:** Fix before deployment

#### BUG-7: No Redirect After Registration
- **Severity:** Low
- **Steps to Reproduce:**
  1. Complete registration form
  2. Submit
  3. Expected: Redirect to dashboard (since email confirmation disabled for MVP)
  4. Actual: Shows success message with "Zum Login" button, user must manually navigate
- **Priority:** Fix in next sprint

### Architecture Observations

#### API Routes Not Implemented
The spec mentions API endpoints (`POST /api/auth/register`, etc.) but they are not implemented. The app uses Supabase client directly from the browser. This is acceptable for MVP but differs from the spec.

**Recommendation:** Either implement the API routes or update the spec to reflect the actual architecture.

### Summary

| Category | Status |
|----------|--------|
| Acceptance Criteria | 20/26 passed (77%) |
| Bugs Found | 7 total (2 High, 3 Medium, 2 Low) |
| Security | Issues found (missing security headers) |
| Production Ready | **NO** |

### Critical/High Priority Bugs to Fix Before Deployment
1. **BUG-2:** Email field shows UUID instead of email (High)
2. **BUG-6:** Missing security headers (Medium - but security-critical)

### Recommendation
**DO NOT DEPLOY** until the following are fixed:
1. Email display bug (shows UUID instead of email)
2. Security headers are configured
3. "Remember Me" functionality is implemented or checkbox is removed

After fixes, run `/qa` again to verify.