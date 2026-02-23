# PROJ-5: Gamification - Points System

> Status: Planned
> Created: 2026-02-23
> Dependencies: PROJ-2 (Household Management), PROJ-3 (Chore Management)

## Overview
Implement a points-based reward system where users earn points for completing chores, creating engagement and motivation through gamification.

## User Stories

### US-5.1: Earn Points for Completing Chores
**As a** household member
**I want to** earn points when I complete a chore
**So that** my efforts are recognized and rewarded

**Acceptance Criteria:**
- [ ] Points awarded automatically on chore completion
- [ ] Point value based on chore difficulty (easy=10, medium=20, hard=50)
- [ ] Custom point values can be set per chore
- [ ] Immediate feedback showing points earned
- [ ] Points added to user's total balance
- [ ] Transaction logged in point history

### US-5.2: View Point Balance
**As a** household member
**I want to** see my current point balance
**So that** I know how many points I have available

**Acceptance Criteria:**
- [ ] Point balance visible in navigation/header
- [ ] Balance updates in real-time after earning/spending
- [ ] Animated transition when points change
- [ ] Link to detailed point history

### US-5.3: View Point History
**As a** household member
**I want to** see a history of my point transactions
**So that** I understand how I earned and spent points

**Acceptance Criteria:**
- [ ] Chronological list of all transactions
- [ ] Filter by: earned, spent, all
- [ ] Each entry shows: date, chore/description, points (+/-)
- [ ] Running balance shown for each entry
- [ ] Pagination for long history (20 per page)
- [ ] Export to CSV (optional for MVP)

### US-5.4: View Leaderboard
**As a** household member
**I want to** see a leaderboard of all members
**So that** I can compare my performance with others

**Acceptance Criteria:**
- [ ] Rank members by total points earned (all time)
- [ ] Show avatar, name, and point total
- [ ] Current user highlighted
- [ ] Time period filter: this week, this month, all time
- [ ] Anonymous mode option (optional for MVP)

### US-5.5: View Weekly/Monthly Statistics
**As a** household member
**I want to** see my activity statistics
**So that** I can track my progress over time

**Acceptance Criteria:**
- [ ] Points earned this week/month
- [ ] Chores completed this week/month
- [ ] Comparison to previous period
- [ ] Visual chart/graph
- [ ] Streak tracking (consecutive days with completions)

### US-5.6: Bonus Points (Admin Only)
**As a** household admin
**I want to** award bonus points to members
**So that** I can recognize extra effort

**Acceptance Criteria:**
- [ ] Select member from dropdown
- [ ] Enter point amount (1-100)
- [ ] Add optional reason/note
- [ ] Confirmation before awarding
- [ ] Transaction logged with "bonus" type

## Point Values

### Default Point Values by Difficulty
| Difficulty | Points |
|------------|--------|
| Easy | 10 |
| Medium | 20 |
| Hard | 50 |

### Point Sources
- **Chore Completion:** Based on chore difficulty or custom value
- **Bonus Points:** Awarded by admin (1-100)
- **Streak Bonus:** +5 points per consecutive day (max 7 days)
- **Weekly Goal:** Bonus for meeting weekly targets (optional)

### Point Deductions
- **Undo Completion:** Points deducted when chore undone
- **Reward Redemption:** Points spent on rewards (PROJ-6)
- **Penalty:** Admin-assigned deduction (optional)

## Edge Cases
- Undo after points spent on reward (go negative?)
- User leaving household (points history retained?)
- Point balance overflow (very large numbers)
- Concurrent point transactions
- Timezone issues for streak calculation
- Negative point balance handling

## Technical Notes
- Use database transactions for point operations
- Consider decimal precision (integers for MVP)
- Store all transactions for audit trail
- Use triggers or functions for balance calculation
- Consider caching for leaderboard queries

## Database Schema

```sql
-- Point balances (denormalized for performance)
CREATE TABLE point_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  current_balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point transactions (audit trail)
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL, -- positive for earned, negative for spent
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('chore_completion', 'bonus', 'undo', 'reward_redemption', 'streak_bonus')),
  reference_id UUID, -- chore_id or reward_id
  description TEXT,
  balance_after INTEGER NOT NULL, -- snapshot of balance after transaction
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks tracking
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE point_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_household ON point_transactions(household_id);
CREATE INDEX idx_point_balances_household ON point_balances(household_id);
```

## API Endpoints
- `GET /api/points/balance` - Get current balance
- `GET /api/points/history` - Get transaction history
- `GET /api/leaderboard` - Get household leaderboard
- `GET /api/statistics` - Get user statistics
- `POST /api/points/bonus` - Award bonus points (admin only)

## UI Components
- Point balance display
- Point history list
- Leaderboard component
- Statistics dashboard
- Points animation/celebration effect
- Streak indicator