# PROJ-6: Gamification - Rewards System

> Status: In Review
> Created: 2026-02-23
> Dependencies: PROJ-5 (Gamification - Points)
> QA Tested: 2026-02-25

## Overview
Enable household admins to create custom rewards that members can redeem using their earned points, creating tangible motivation for chore completion.

## User Stories

### US-6.1: Create Reward (Admin Only)
**As a** household admin
**I want to** create rewards that members can earn
**So that** there's tangible motivation for completing chores

**Acceptance Criteria:**
- [x] Reward name input (required, 2-100 characters)
- [x] Description input (optional, max 500 characters)
- [x] Point cost input (required, 1-10000)
- [x] Quantity available (optional, unlimited if not set)
- [x] Image upload (optional, placeholder if none) - NOTE: URL-based, not file upload
- [x] Preview before publishing
- [x] Save as draft or publish immediately

### US-6.2: View Available Rewards
**As a** household member
**I want to** browse available rewards
**So that** I know what I can earn with my points

**Acceptance Criteria:**
- [x] Grid/list view of all published rewards
- [x] Show image, name, description, point cost
- [x] Filter by: affordable (within my balance), all
- [x] Sort by: point cost, name, newest
- [x] "Redeem" button visible if affordable
- [x] Grayed out if not enough points
- [x] Show remaining quantity if limited

### US-6.3: Redeem Reward
**As a** household member
**I want to** redeem a reward with my points
**So that** I receive the benefit I've earned

**Acceptance Criteria:**
- [x] Confirmation dialog showing points to be deducted
- [x] Point balance check before redemption
- [x] Points deducted immediately
- [x] Redemption recorded
- [x] Success feedback with remaining balance
- [ ] Notification to admin (optional for MVP) - NOT IMPLEMENTED

### US-6.4: View Redemption History
**As a** household member
**I want to** see my redemption history
**So that** I can track what I've earned

**Acceptance Criteria:**
- [x] Chronological list of redemptions
- [x] Show reward name, points spent, date
- [x] Show fulfillment status (pending/fulfilled)
- [x] Filter by status

### US-6.5: Manage Redemptions (Admin Only)
**As a** household admin
**I want to** see and manage all redemptions
**So that** I can fulfill member requests

**Acceptance Criteria:**
- [x] List of all household redemptions
- [x] Filter by: pending, fulfilled, all
- [x] Mark as fulfilled with confirmation
- [x] Add fulfillment notes (optional)
- [ ] Contact member option (optional for MVP) - NOT IMPLEMENTED

### US-6.6: Edit Reward (Admin Only)
**As a** household admin
**I want to** edit an existing reward
**So that** I can update its details or availability

**Acceptance Criteria:**
- [x] Edit all fields except redemption history
- [x] Change point cost (doesn't affect past redemptions)
- [x] Update quantity (add/remove available)
- [x] Archive reward (hide from list but keep history)
- [x] Changes saved with success feedback

### US-6.7: Delete Reward (Admin Only)
**As a** household admin
**I want to** delete a reward
**So that** it's no longer available

**Acceptance Criteria:**
- [x] Cannot delete if pending redemptions exist
- [x] Must archive instead if redemptions exist
- [x] Can delete if never redeemed
- [x] Confirmation dialog before deletion
- [ ] Points refunded if pending redemptions (optional) - NOT IMPLEMENTED

## Reward Categories (Optional for MVP)
- **Privileges:** Extra screen time, choose dinner, etc.
- **Activities:** Movie night, game night, outing
- **Items:** Small treats, stickers, etc.
- **Money:** Cash equivalent (handled outside app)

## Edge Cases
- Redeeming reward when points just spent elsewhere
- Editing point cost while someone is viewing
- Quantity reaching zero during redemption
- User leaving household with pending redemptions
- Admin leaving household (transfer redemptions to new admin)
- Redeeming same reward multiple times
- Cancellation of redemption (refund points?)

## Technical Notes
- Use database transactions for redemption
- Consider locking mechanism for quantity-limited rewards
- Store redemption status separately from reward
- Archive instead of delete for audit trail
- Consider expiration dates for rewards (optional)

## Database Schema

```sql
-- Rewards catalog
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  image_url TEXT,
  point_cost INTEGER NOT NULL CHECK (point_cost >= 1),
  quantity_available INTEGER CHECK (quantity_available >= 0),
  quantity_claimed INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES auth.users(id),
  fulfillment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_rewards_household ON rewards(household_id);
CREATE INDEX idx_rewards_status ON rewards(status);
CREATE INDEX idx_redemptions_user ON redemptions(user_id);
CREATE INDEX idx_redemptions_household ON redemptions(household_id);
CREATE INDEX idx_redemptions_status ON redemptions(status);
```

## API Endpoints
- `POST /api/rewards` - Create reward (admin)
- `GET /api/rewards` - List available rewards
- `GET /api/rewards/:id` - Get reward details
- `PATCH /api/rewards/:id` - Update reward (admin)
- `DELETE /api/rewards/:id` - Delete reward (admin)
- `POST /api/rewards/:id/redeem` - Redeem reward
- `GET /api/redemptions` - Get my redemptions
- `GET /api/redemptions/all` - Get all household redemptions (admin)
- `PATCH /api/redemptions/:id/fulfill` - Mark as fulfilled (admin)

## UI Components
- Reward card component
- Reward catalog grid
- Create/edit reward form
- Redemption confirmation dialog
- Redemption history list
- Admin redemption management panel

---

## QA Test Results (2026-02-25)

### Build Status
- **Build:** PASSED (npm run build succeeded)
- **TypeScript:** PASSED (no type errors)

### Acceptance Criteria Summary
| User Story | Status | Notes |
|------------|--------|-------|
| US-6.1: Create Reward | PASS | All criteria met. Image is URL-based (not file upload) |
| US-6.2: View Available Rewards | PASS | All criteria met |
| US-6.3: Redeem Reward | PASS | Notification to admin not implemented (optional for MVP) |
| US-6.4: View Redemption History | PASS | All criteria met |
| US-6.5: Manage Redemptions | PASS | Contact member not implemented (optional for MVP) |
| US-6.6: Edit Reward | PASS | All criteria met |
| US-6.7: Delete Reward | PASS | Points refund not implemented (optional for MVP) |

### Security Audit Results

#### Authentication & Authorization
- [x] All API routes verify user authentication
- [x] Admin role properly checked for admin-only operations
- [x] Household membership verified before data access
- [x] Cross-household data access prevented

#### Row Level Security (RLS)
- [x] RLS enabled on `rewards` table
- [x] RLS enabled on `redemptions` table
- [x] SELECT policies restrict access to household members
- [x] INSERT policies enforce admin role for rewards
- [x] UPDATE policies enforce admin role for rewards and redemptions
- [x] DELETE policy prevents direct deletion of redemptions (audit trail)
- [x] `created_by` field enforced in INSERT policy for rewards

#### Input Validation
- [x] Zod schemas validate all input fields
- [x] Point cost validated (1-10000 range)
- [x] Name length validated (2-100 characters)
- [x] Description length validated (max 500 characters)
- [x] Quantity validated as non-negative integer
- [x] Status enum validated

#### SQL Injection Prevention
- [x] Using Supabase client with parameterized queries
- [x] No raw SQL in API routes
- [x] RPC functions use parameterized queries

### Bugs Found

#### BUG-1: Duplicate Validation Files (Low Priority)
- **File:** `/root/ai-coding-starter-kit/chorechamp/src/lib/validations/reward.ts` and `/root/ai-coding-starter-kit/chorechamp/src/lib/validations/rewards.ts`
- **Description:** Two identical validation files exist (`reward.ts` and `rewards.ts`). The API imports from `reward.ts` while the form imports from `rewards.ts`.
- **Severity:** Low
- **Impact:** Code duplication, potential confusion, maintenance burden
- **Recommendation:** Remove one file and consolidate imports

#### BUG-2: Validation Schema Inconsistency (Low Priority)
- **File:** `/root/ai-coding-starter-kit/chorechamp/src/lib/validations/reward.ts` (line 35)
- **Description:** `createRewardSchema` requires `quantityAvailable` to be at least 1, but the intent is to allow `null` for unlimited quantity. The API handles this correctly by accepting `null`, but the schema validation contradicts this.
- **Severity:** Low
- **Impact:** Confusion, potential validation errors if schema is strictly followed
- **Recommendation:** The schema allows `nullable()` so it works, but the `.min(1)` constraint is misleading when null is allowed

#### BUG-3: Form Uses Wrong Schema (Low Priority)
- **File:** `/root/ai-coding-starter-kit/chorechamp/src/components/rewards/reward-form.tsx` (line 29)
- **Description:** Form imports `updateRewardSchema` but uses `createRewardSchema` for validation. The form should dynamically use the appropriate schema based on `isEditing` prop.
- **Severity:** Low
- **Impact:** Minor validation inconsistency between create and edit modes
- **Recommendation:** Use `isEditing ? updateRewardSchema : createRewardSchema`

#### BUG-4: Missing Quantity Claimed Validation (Low Priority)
- **File:** `/root/ai-coding-starter-kit/chorechamp/src/app/api/rewards/[id]/route.ts` (PATCH)
- **Description:** When updating `quantityAvailable`, there's no validation to ensure it's not less than `quantityClaimed`. This could show negative remaining quantities.
- **Severity:** Low
- **Impact:** Could display negative quantities to users
- **Recommendation:** Add validation: `quantityAvailable >= quantityClaimed`

#### BUG-5: Fallback Redemption Race Condition (Medium Priority)
- **File:** `/root/ai-coding-starter-kit/chorechamp/src/app/api/rewards/[id]/redeem/route.ts` (fallback function)
- **Description:** The fallback implementation doesn't use a database transaction. If redemption creation fails after point deduction, the points are rolled back but the transaction record may already exist.
- **Severity:** Medium
- **Impact:** Potential data inconsistency in edge cases
- **Recommendation:** The RPC function `redeem_reward` handles this correctly. Ensure migration is applied so fallback is rarely used.

### Security Issues Found

#### SEC-1: Image URL Not Sanitized (Low Severity)
- **File:** Multiple components display `imageUrl` directly in `<img src>` tags
- **Description:** Image URLs are validated as URLs but not sanitized. While XSS via `javascript:` URLs is generally blocked by browsers in `src` attributes, other protocols could be used.
- **Severity:** Low
- **Impact:** Potential for malicious URLs to be displayed
- **Recommendation:** Consider validating that URLs use only `http:` or `https:` protocols

### Edge Cases NOT Handled

1. **Concurrent Redemption:** Two users redeeming the last quantity simultaneously - the RPC function doesn't use explicit locking
2. **User Leaving Household:** No handling for pending redemptions when a user leaves a household
3. **Admin Transfer:** No logic to transfer pending redemptions to new admin when admin leaves

### Overall Status: PASS (with minor issues)

The implementation meets all acceptance criteria for MVP. The bugs found are low priority and do not block deployment. The security audit confirms proper authentication, authorization, and RLS policies are in place. The RPC functions provide proper transactional guarantees for redemptions.

**Recommendation:** Ready for deployment after applying database migration. Minor bugs can be addressed in follow-up iteration.