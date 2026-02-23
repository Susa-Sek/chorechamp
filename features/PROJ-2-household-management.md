# PROJ-2: Household Management

> Status: Planned
> Created: 2026-02-23
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