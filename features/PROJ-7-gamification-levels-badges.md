# PROJ-7: Gamification - Levels & Badges

> Status: Planned
> Created: 2026-02-23
> Dependencies: PROJ-5 (Gamification - Points)

## Overview
Implement a leveling system and achievement badges to provide long-term progression and recognition for consistent participation.

## User Stories

### US-7.1: Level Up
**As a** household member
**I want to** level up as I earn more points
**So that** I feel a sense of progression

**Acceptance Criteria:**
- [ ] Levels based on total lifetime points
- [ ] Clear progress bar to next level
- [ ] Level up animation/celebration
- [ ] Level badge displayed on profile
- [ ] Each level requires progressively more points

### US-7.2: View Level Progress
**As a** household member
**I want to** see my progress toward the next level
**So that** I know how close I am to leveling up

**Acceptance Criteria:**
- [ ] Current level and points displayed
- [ ] Progress bar showing % to next level
- [ ] Points needed for next level
- [ ] Level history (optional for MVP)

### US-7.3: Earn Achievement Badges
**As a** household member
**I want to** earn badges for accomplishments
**So that** I'm recognized for special achievements

**Acceptance Criteria:**
- [ ] Badges automatically awarded when criteria met
- [ ] Notification when new badge earned
- [ ] Badges displayed on profile
- [ ] Badge details on hover/click
- [ ] Date earned shown

### US-7.4: View Badge Collection
**As a** household member
**I want to** see all available and earned badges
**So that** I know what achievements I can work toward

**Acceptance Criteria:**
- [ ] Grid of all possible badges
- [ ] Earned badges shown in color
- [ ] Locked badges shown in grayscale
- [ ] Progress indicator for badges in progress
- [ ] Filter by: earned, locked, in progress

### US-7.5: View Member Profile with Level & Badges
**As a** household member
**I want to** view another member's profile
**So that** I can see their level and achievements

**Acceptance Criteria:**
- [ ] Display name and avatar
- [ ] Current level with badge
- [ ] Total points earned
- [ ] Earned badges showcase
- [ ] Member since date
- [ ] Chores completed count

## Level System

### Level Requirements
| Level | Total Points Required | Title |
|-------|----------------------|-------|
| 1 | 0 | Newcomer |
| 2 | 100 | Helper |
| 3 | 300 | Contributor |
| 4 | 600 | Achiever |
| 5 | 1000 | Champion |
| 6 | 1500 | Expert |
| 7 | 2500 | Master |
| 8 | 4000 | Legend |
| 9 | 6000 | Hero |
| 10 | 10000 | ChoreChamp |

### Level Progression Formula
- Level N requires: `points = 100 * N * (N + 1) / 2` (triangular numbers)
- Or simplified exponential: `points = 100 * N^1.5`

## Badge System

### Chore Completion Badges
| Badge | Name | Criteria | Icon |
|-------|------|----------|------|
| First Step | Complete 1 chore | 🎯 |
| Getting Started | Complete 10 chores | 🌟 |
| On a Roll | Complete 50 chores | 🔄 |
| Century | Complete 100 chores | 💯 |
| Dedicated | Complete 250 chores | 🏆 |

### Streak Badges
| Badge | Name | Criteria | Icon |
|-------|------|----------|------|
| Week Warrior | 7-day streak | 🔥 |
| Two Week Champion | 14-day streak | ⚡ |
| Monthly Master | 30-day streak | 👑 |
| Unstoppable | 60-day streak | 🚀 |
| Legend | 100-day streak | 🌈 |

### Point Badges
| Badge | Name | Criteria | Icon |
|-------|------|----------|------|
| Point Collector | Earn 100 points | 💰 |
| Point Hunter | Earn 500 points | 🎯 |
| Point Master | Earn 1000 points | 💎 |
| Point Legend | Earn 5000 points | 👑 |

### Special Badges
| Badge | Name | Criteria | Icon |
|-------|------|----------|------|
| Early Bird | Complete chore before 8 AM | 🐦 |
| Night Owl | Complete chore after 10 PM | 🦉 |
| Speed Demon | Complete 5 chores in one day | ⚡ |
| Team Player | Help complete others' chores | 🤝 |
| Perfect Week | All chores completed for a week | ✨ |

## Edge Cases
- Level down when points deducted (undo)
- Multiple badges earned simultaneously
- User leaving household (preserve levels/badges?)
- Badge criteria changed mid-stream
- Timezone issues for time-based badges
- Retroactive badge awarding

## Technical Notes
- Calculate level dynamically from points
- Store earned badges with timestamp
- Use background job for badge checking
- Consider caching for frequent level queries
- Store badge definitions in database for flexibility

## Database Schema

```sql
-- User levels (denormalized for quick access)
CREATE TABLE user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_level INTEGER NOT NULL DEFAULT 1,
  total_points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badge definitions
CREATE TABLE badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('completion', 'streak', 'points', 'special')),
  criteria JSONB NOT NULL, -- {"type": "chores_completed", "value": 10}
  icon TEXT NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges (earned badges)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Badge progress (for badges in progress)
CREATE TABLE badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_badge_progress_user ON badge_progress(user_id);
CREATE INDEX idx_user_levels_user ON user_levels(user_id);

-- Seed badge definitions
INSERT INTO badge_definitions (name, description, category, criteria, icon) VALUES
-- Completion badges
('First Step', 'Complete your first chore', 'completion', '{"type": "chores_completed", "value": 1}', '🎯'),
('Getting Started', 'Complete 10 chores', 'completion', '{"type": "chores_completed", "value": 10}', '🌟'),
('On a Roll', 'Complete 50 chores', 'completion', '{"type": "chores_completed", "value": 50}', '🔄'),
('Century', 'Complete 100 chores', 'completion', '{"type": "chores_completed", "value": 100}', '💯'),
('Dedicated', 'Complete 250 chores', 'completion', '{"type": "chores_completed", "value": 250}', '🏆'),
-- Streak badges
('Week Warrior', '7-day completion streak', 'streak', '{"type": "streak_days", "value": 7}', '🔥'),
('Two Week Champion', '14-day completion streak', 'streak', '{"type": "streak_days", "value": 14}', '⚡'),
('Monthly Master', '30-day completion streak', 'streak', '{"type": "streak_days", "value": 30}', '👑'),
-- Point badges
('Point Collector', 'Earn 100 points', 'points', '{"type": "total_points", "value": 100}', '💰'),
('Point Hunter', 'Earn 500 points', 'points', '{"type": "total_points", "value": 500}', '🎯'),
('Point Master', 'Earn 1000 points', 'points', '{"type": "total_points", "value": 1000}', '💎');
```

## API Endpoints
- `GET /api/levels/me` - Get my current level
- `GET /api/badges` - List all badge definitions
- `GET /api/badges/me` - Get my earned badges
- `GET /api/badges/progress` - Get badge progress
- `GET /api/profile/:userId` - Get user profile with level/badges

## UI Components
- Level progress bar
- Level badge display
- Badge grid component
- Badge detail modal
- Level up celebration animation
- Profile header with level