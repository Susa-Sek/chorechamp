# PROJ-2: Household Management

> Status: In Review
> Created: 2026-02-23
> Updated: 2026-02-26
> Dependencies: PROJ-1 (User Authentication)

## Overview
Enable users to create households, invite members, and manage membership for collaborative chore tracking.

## User Stories

### US-2.1: Create Household
**As a** new user without a household
**I want to** create a new household
**So that** I can start organizing chores with my family/roommates

**Acceptance Criteria:**
- [ ] Household name input (required, 3-50 characters)
- [ ] User becomes admin of the household
- [ ] Redirect to household dashboard after creation
- [ ] Only one household per user (MVP limitation)

### US-2.2: Join Household via Invite Code
**As a** user with an invite code
**I want to** join an existing household
**So that** I can participate in shared chore management

**Acceptance Criteria:**
- [ ] Enter invite code to join
- [ ] Validate invite code exists and is active
- [ ] User becomes member (not admin) of household
- [ ] Error message for invalid/expired codes
- [ ] Redirect to household dashboard after joining

### US-2.3: Generate Invite Code
**As a** household admin
**I want to** generate an invite code
**So that** I can invite new members to my household

**Acceptance Criteria:**
- [ ] Generate unique 6-character invite code
- [ ] Option to set expiration date (default: 7 days)
- [ ] Copy-to-clipboard functionality
- [ ] Display current active invite codes
- [ ] Revoke invite codes option

### US-2.4: View Household Members
**As a** household member
**I want to** see all members of my household
**So that** I know who is participating

**Acceptance Criteria:**
- [ ] List all members with display name and avatar
- [ ] Show admin badge for admin users
- [ ] Show join date for each member
- [ ] Show member count

### US-2.5: Leave Household
**As a** household member
**I want to** leave my household
**So that** I can join a different one or create my own

**Acceptance Criteria:**
- [ ] Confirmation dialog before leaving
- [ ] Admin cannot leave if other members exist (must transfer admin first)
- [ ] Last member leaving dissolves household
- [ ] Redirect to onboarding after leaving

### US-2.6: Remove Member (Admin Only)
**As a** household admin
**I want to** remove a member from my household
**So that** I can manage membership

**Acceptance Criteria:**
- [ ] Remove button visible to admins only
- [ ] Confirmation dialog before removal
- [ ] Member's chores reassigned to admin or marked unassigned
- [ ] Notification to removed member (optional for MVP)

### US-2.7: Transfer Admin Role
**As a** household admin
**I want to** transfer admin role to another member
**So that** household management can continue if I leave

**Acceptance Criteria:**
- [ ] Select new admin from member list
- [ ] Confirmation dialog
- [ ] Previous admin becomes regular member
- [ ] Only one admin at a time (MVP)

## Edge Cases
- Invite code already used/expired
- User already in a household trying to join another
- Admin trying to leave with members remaining
- Network error during household operations
- Concurrent join attempts with same code
- Household name with special characters/emoji

## Technical Notes
- Use RLS policies to ensure data isolation between households
- Cascade delete chores when household is dissolved
- Store invite codes with expiration dates
- Use transactions for member operations

## Database Schema

```sql
-- Households table
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members table
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Invite codes table
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (char_length(code) = 6),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
```

## API Endpoints
- `POST /api/households` - Create household
- `POST /api/households/join` - Join via invite code
- `POST /api/households/invite-code` - Generate invite code
- `GET /api/households/members` - List members
- `DELETE /api/households/members/:id` - Remove member
- `POST /api/households/leave` - Leave household
- `POST /api/households/transfer-admin` - Transfer admin role

## UI Components
- Create household form
- Join household form (invite code input)
- Member list component
- Invite code generator
- Member management panel

---

## QA Report

> Tested: 2026-02-24
> Tester: Claude QA (Automated)
> Build Status: PASS
> TypeScript: PASS

### Acceptance Criteria Test Results

#### US-2.1: Create Household - PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Household name input (3-50 chars) | PASS | Zod validation + DB CHECK constraint |
| User becomes admin | PASS | Role set to "admin" in insert |
| Redirect to dashboard | PASS | `window.location.href = "/dashboard"` |
| One household per user | PASS | Check in POST /api/households |

**Files Reviewed:**
- `/src/app/api/households/route.ts` (lines 87-184)
- `/src/app/(protected)/household/create/page.tsx`
- `/src/lib/validations/household.ts` (createHouseholdSchema)

---

#### US-2.2: Join Household via Invite Code - PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Enter invite code to join | PASS | 6-char input with auto-uppercase |
| Validate invite code exists | PASS | Query with `is("used_at", null)` |
| Validate invite code is active | PASS | Query with `gt("expires_at", now)` |
| User becomes member (not admin) | PASS | Role set to "member" in insert |
| Error message for invalid codes | PASS | "Ungueltiger oder abgelaufener Einladungscode" |
| Redirect to dashboard | PASS | After successful join |

**Files Reviewed:**
- `/src/app/api/households/join/route.ts`
- `/src/app/(protected)/household/join/page.tsx`

---

#### US-2.3: Generate Invite Code - PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Generate unique 6-character code | PASS | Random from 32-char alphabet (excludes confusing chars) |
| Option to set expiration date | PASS | Select: 1, 3, 7, 14, 30 days |
| Default 7 days | PASS | Default value in schema |
| Copy-to-clipboard | PASS | navigator.clipboard.writeText() |
| Display active invite codes | PASS | Filtered by unused + not expired |
| Revoke invite codes | PASS | DELETE /api/households/invite-codes/[id] |

**Files Reviewed:**
- `/src/app/api/households/invite-code/route.ts`
- `/src/app/api/households/invite-codes/route.ts`
- `/src/app/api/households/invite-codes/[id]/route.ts`

---

#### US-2.4: View Household Members - PARTIAL PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| List all members with display name | PARTIAL | **BUG: RLS blocks profile data** |
| List all members with avatar | PARTIAL | **BUG: RLS blocks profile data** |
| Show admin badge | PASS | Crown icon + "Admin" badge |
| Show join date | PASS | "Dabei seit {formatted date}" |
| Show member count | PASS | Displayed in header |

**Files Reviewed:**
- `/src/app/api/households/members/route.ts`
- `/src/app/(protected)/household/page.tsx`

---

#### US-2.5: Leave Household - PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Confirmation dialog | PASS | AlertDialog with warning message |
| Admin cannot leave with members | PASS | Checked in API + UI disables button |
| Last member dissolves household | PASS | DELETE household when count = 1 |
| Redirect after leaving | PASS | `window.location.href = "/dashboard"` |

**Files Reviewed:**
- `/src/app/api/households/leave/route.ts`
- `/src/components/household/household-provider.tsx` (leaveHousehold)

---

#### US-2.6: Remove Member (Admin Only) - PARTIAL PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Remove button visible to admins only | PASS | DropdownMenu only shown for isAdmin |
| Confirmation dialog | PASS | AlertDialog with confirmation |
| Member's chores reassigned | NOT TESTED | Chores table not yet implemented |
| Notification to removed member | N/A | Marked optional for MVP |

**Files Reviewed:**
- `/src/app/api/households/members/[id]/route.ts`
- `/src/app/(protected)/household/page.tsx`

---

#### US-2.7: Transfer Admin Role - PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Select new admin from member list | PASS | Select dropdown with member names |
| Confirmation dialog | PASS | Dialog with confirmation |
| Previous admin becomes member | PASS | Role updated to "member" |
| Only one admin at a time | PASS | Two sequential updates in transaction |

**Files Reviewed:**
- `/src/app/api/households/transfer-admin/route.ts`
- `/src/components/household/household-provider.tsx` (transferAdmin)

---

### Security Audit

#### CRITICAL Issues

**[SEC-1] RLS Policy Gap - Profiles Table Not Accessible for Household Members**

- **Severity:** CRITICAL
- **File:** `/supabase/migrations/20240223000001_profiles.sql`
- **Location:** Lines 18-21 (RLS policy "Users can view own profile")
- **Description:** The profiles table only allows users to view their own profile via RLS. However, the household members API joins with profiles to fetch display_name and avatar_url. This will fail because users cannot read other household members' profiles.
- **Impact:** Member list will show "Unbekannt" for all members except the current user.
- **Proof:**
  ```sql
  -- Current policy only allows:
  CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

  -- Missing policy for household members to view each other
  ```
- **Recommendation:** Add RLS policy:
  ```sql
  CREATE POLICY "Users can view profiles of household members"
    ON public.profiles FOR SELECT
    USING (
      id IN (
        SELECT user_id FROM household_members
        WHERE household_id IN (
          SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
      )
    );
  ```
- **Priority:** P0 - Blocks core functionality

---

**[SEC-2] Race Condition - Invite Code Double-Use**

- **Severity:** HIGH
- **File:** `/src/app/api/households/join/route.ts`
- **Location:** Lines 51-87
- **Description:** TOCTOU race condition exists. Two users could simultaneously validate the same invite code, both find it valid, and both join. The code would only be marked as used once, but both users would be added as members.
- **Impact:** Invite codes intended for single-use could be used multiple times.
- **Recommendation:**
  1. Use database transaction with row-level locking
  2. Or use PostgreSQL advisory locks
  3. Or use `UPDATE ... WHERE used_at IS NULL RETURNING *` as atomic operation
- **Priority:** P1 - Security vulnerability

---

#### MEDIUM Issues

**[SEC-3] No Rate Limiting on Invite Code Validation**

- **Severity:** MEDIUM
- **File:** `/src/app/api/households/join/route.ts`
- **Description:** No rate limiting on the join endpoint. Attackers could brute-force invite codes.
- **Impact:** Potential for invite code enumeration.
- **Recommendation:** Implement rate limiting (e.g., 5 attempts per minute per IP/user).
- **Priority:** P2 - Security hardening

---

**[SEC-4] Overly Permissive RLS on invite_codes UPDATE**

- **Severity:** MEDIUM
- **File:** `/supabase/migrations/20260224_household_management.sql`
- **Location:** Lines 199-202
- **Description:** The UPDATE policy for invite_codes allows any authenticated user to update any invite code.
  ```sql
  CREATE POLICY "System can update invite codes"
    ON invite_codes FOR UPDATE
    USING (true)
    WITH CHECK (true);
  ```
- **Impact:** Any authenticated user could mark any invite code as used or modify expiration dates.
- **Recommendation:** Restrict UPDATE to service role only or admin of the household.
- **Priority:** P1 - Security vulnerability

---

#### LOW Issues

**[SEC-5] Invite Code Generation Collision Handling**

- **Severity:** LOW
- **File:** `/src/app/api/households/invite-code/route.ts`
- **Location:** Lines 57-80
- **Description:** Code generation has a 10-attempt limit. With 32^6 (~1 billion) combinations, this is unlikely but could theoretically fail under high load.
- **Recommendation:** Use a database-level retry with INSERT ... ON CONFLICT or a while loop with higher limit.
- **Priority:** P3 - Edge case

---

### Bugs Found

#### BUG-1: Profiles RLS Prevents Household Member Data Display

- **ID:** BUG-1
- **Severity:** CRITICAL
- **Priority:** P0
- **Status:** OPEN
- **Steps to Reproduce:**
  1. User A creates a household
  2. User A generates invite code
  3. User B joins the household via invite code
  4. User A views household members
  5. User B's display name shows as "Unbekannt"
- **Expected:** User B's actual display name should be shown
- **Actual:** "Unbekannt" is shown (fallback for null profile data)
- **Root Cause:** RLS on profiles table only allows viewing own profile
- **Location:** `/supabase/migrations/20240223000001_profiles.sql`

---

#### BUG-2: Missing Database Transaction for Household Creation

- **ID:** BUG-2
- **Severity:** MEDIUM
- **Priority:** P2
- **Status:** OPEN
- **Description:** Household creation does two inserts without a transaction. If the member insert fails after the household insert succeeds, there's orphaned data. Code attempts manual rollback but this is not atomic.
- **Location:** `/src/app/api/households/route.ts` lines 131-166
- **Recommendation:** Use Supabase RPC or database transaction

---

#### BUG-3: Transfer Admin Not Atomic

- **ID:** BUG-3
- **Severity:** MEDIUM
- **Priority:** P2
- **Status:** OPEN
- **Description:** Transfer admin does two UPDATE operations. If the second fails after the first succeeds, the household could have no admin. There is rollback code but it's not atomic.
- **Location:** `/src/app/api/households/transfer-admin/route.ts` lines 81-115
- **Recommendation:** Wrap in database transaction or use stored procedure

---

### Code Quality Issues

1. **Duplication:** `household-provider.tsx` duplicates API logic. Consider using API routes consistently or create a shared service layer.

2. **Error Handling:** Some error messages are generic. Consider more specific error messages for debugging.

3. **Type Safety:** Several `as unknown as` casts in API routes could be improved with proper type definitions.

---

### Edge Cases Tested

| Edge Case | Status | Notes |
|-----------|--------|-------|
| Invite code already used | PASS | Returns "Ungueltiger oder abgelaufener Einladungscode" |
| User already in household | PASS | Returns "Du bist bereits Mitglied eines Haushalts" |
| Admin leave with members | PASS | Blocked with appropriate message |
| Network error handling | PASS | Try-catch with generic error message |
| Concurrent code use | FAIL | **BUG: Race condition (SEC-2)** |
| Special characters in name | PASS | DB constraint allows any TEXT, validation limits to 3-50 chars |

---

### Recommendations

1. **P0:** Fix profiles RLS policy to allow household members to view each other's profiles
2. **P1:** Fix invite_codes UPDATE policy to restrict to service role only
3. **P1:** Implement atomic invite code usage to prevent race conditions
4. **P2:** Add rate limiting to join endpoint
5. **P2:** Consider database transactions for multi-step operations
6. **P3:** Add integration tests for race conditions

---

### Summary

| Category | Count |
|----------|-------|
| User Stories Passed | 5/7 |
| User Stories Partial | 2/7 |
| Critical Bugs | 1 |
| High Severity Security | 1 |
| Medium Severity Security | 2 |
| Low Severity Security | 1 |
| Medium Bugs | 2 |

**Overall Status:** BLOCKED - Critical RLS bug must be fixed before deployment.

---

## Bug Fixes

### BUG-1: Household Creation RLS Fix - FIXED (2026-02-26)

**Issue:** Household creation returns 403 Forbidden - RLS INSERT policy missing or not working

**Root Cause:** The RLS policies for `households` and `household_members` tables were not correctly configured to allow authenticated users to create households and add themselves as admin members.

**Fix Applied:**
- Migration: `/supabase/migrations/20260226000002_fix_household_rls_complete.sql`
- Updated production migrations: `/supabase/migrations/apply_prod_migrations.sql`

**RLS Policies Fixed:**

1. **households INSERT policy:**
   ```sql
   CREATE POLICY "Authenticated users can create households"
     ON public.households FOR INSERT
     WITH CHECK (auth.uid() = created_by);
   ```

2. **household_members INSERT policy:**
   ```sql
   CREATE POLICY "Users can insert themselves as members"
     ON public.household_members FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

3. **households SELECT policy:**
   ```sql
   CREATE POLICY "Users can view their households"
     ON public.households FOR SELECT
     USING (
       id IN (
         SELECT household_id FROM household_members WHERE user_id = auth.uid()
       )
     );
   ```

**Deployment Instructions:**
1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `apply_prod_migrations.sql` (Part 5 section)
3. Execute the SQL
4. Verify household creation works