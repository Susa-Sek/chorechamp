# PROJ-6: Gamification - Rewards System

> Status: Planned
> Created: 2026-02-23
> Dependencies: PROJ-5 (Gamification - Points)

## Overview
Enable household admins to create custom rewards that members can redeem using their earned points, creating tangible motivation for chore completion.

## User Stories

### US-6.1: Create Reward (Admin Only)
**As a** household admin
**I want to** create rewards that members can earn
**So that** there's tangible motivation for completing chores

**Acceptance Criteria:**
- [ ] Reward name input (required, 2-100 characters)
- [ ] Description input (optional, max 500 characters)
- [ ] Point cost input (required, 1-10000)
- [ ] Quantity available (optional, unlimited if not set)
- [ ] Image upload (optional, placeholder if none)
- [ ] Preview before publishing
- [ ] Save as draft or publish immediately

### US-6.2: View Available Rewards
**As a** household member
**I want to** browse available rewards
**So that** I know what I can earn with my points

**Acceptance Criteria:**
- [ ] Grid/list view of all published rewards
- [ ] Show image, name, description, point cost
- [ ] Filter by: affordable (within my balance), all
- [ ] Sort by: point cost, name, newest
- [ ] "Redeem" button visible if affordable
- [ ] Grayed out if not enough points
- [ ] Show remaining quantity if limited

### US-6.3: Redeem Reward
**As a** household member
**I want to** redeem a reward with my points
**So that** I receive the benefit I've earned

**Acceptance Criteria:**
- [ ] Confirmation dialog showing points to be deducted
- [ ] Point balance check before redemption
- [ ] Points deducted immediately
- [ ] Redemption recorded
- [ ] Success feedback with remaining balance
- [ ] Notification to admin (optional for MVP)

### US-6.4: View Redemption History
**As a** household member
**I want to** see my redemption history
**So that** I can track what I've earned

**Acceptance Criteria:**
- [ ] Chronological list of redemptions
- [ ] Show reward name, points spent, date
- [ ] Show fulfillment status (pending/fulfilled)
- [ ] Filter by status

### US-6.5: Manage Redemptions (Admin Only)
**As a** household admin
**I want to** see and manage all redemptions
**So that** I can fulfill member requests

**Acceptance Criteria:**
- [ ] List of all household redemptions
- [ ] Filter by: pending, fulfilled, all
- [ ] Mark as fulfilled with confirmation
- [ ] Add fulfillment notes (optional)
- [ ] Contact member option (optional for MVP)

### US-6.6: Edit Reward (Admin Only)
**As a** household admin
**I want to** edit an existing reward
**So that** I can update its details or availability

**Acceptance Criteria:**
- [ ] Edit all fields except redemption history
- [ ] Change point cost (doesn't affect past redemptions)
- [ ] Update quantity (add/remove available)
- [ ] Archive reward (hide from list but keep history)
- [ ] Changes saved with success feedback

### US-6.7: Delete Reward (Admin Only)
**As a** household admin
**I want to** delete a reward
**So that** it's no longer available

**Acceptance Criteria:**
- [ ] Cannot delete if pending redemptions exist
- [ ] Must archive instead if redemptions exist
- [ ] Can delete if never redeemed
- [ ] Confirmation dialog before deletion
- [ ] Points refunded if pending redemptions (optional)

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