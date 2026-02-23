# PROJ-4: Recurring Tasks

> Status: Planned
> Created: 2026-02-23
> Dependencies: PROJ-3 (Chore Management)

## Overview
Enable chores to automatically reset on a schedule, creating recurring tasks for routine household activities.

## User Stories

### US-4.1: Create Recurring Chore
**As a** household member
**I want to** create a chore that repeats automatically
**So that** routine tasks are tracked consistently

**Acceptance Criteria:**
- [ ] Recurrence pattern selection: daily, weekly, monthly, custom
- [ ] For weekly: select specific days (Mon-Sun)
- [ ] For monthly: select day of month (1-31)
- [ ] For custom: every X days
- [ ] Set start date (defaults to today)
- [ ] Optional: set end date or "forever"
- [ ] Preview next 5 occurrences
- [ ] Points and difficulty inherited from base chore

### US-4.2: View Recurring Schedule
**As a** household member
**I want to** see the schedule for a recurring chore
**So that** I know when it's due next

**Acceptance Criteria:**
- [ ] Calendar view showing upcoming occurrences
- [ ] List view of next 10 occurrences
- [ ] Show pattern (e.g., "Every Monday, Wednesday")
- [ ] Visual indicator for recurring vs one-time chores
- [ ] Badge/icon on chore card for recurring status

### US-4.3: Complete Recurring Chore
**As a** household member
**I want to** complete a recurring chore instance
**So that** it resets for the next occurrence

**Acceptance Criteria:**
- [ ] Complete current instance only
- [ ] Automatic reset to pending for next occurrence
- [ ] Due date updates to next scheduled date
- [ ] Points awarded for each completion
- [ ] Completion history maintained per instance

### US-4.4: Edit Recurring Pattern
**As a** household member
**I want to** change the recurrence pattern
**So that** the schedule reflects current needs

**Acceptance Criteria:**
- [ ] Edit pattern without affecting chore details
- [ ] Option to apply to future instances only
- [ ] Option to apply to all instances (including history)
- [ ] Confirmation dialog explaining scope of change
- [ ] Preview new schedule before saving

### US-4.5: Stop Recurrence
**As a** household member
**I want to** stop a chore from recurring
**So that** it becomes a one-time task

**Acceptance Criteria:**
- [ ] "Stop recurring" option in chore settings
- [ ] Current instance remains as-is
- [ ] No future instances created
- [ ] Chore marked as one-time
- [ ] History preserved

### US-4.6: Due Date Reminders
**As a** household member
**I want to** receive reminders for upcoming chores
**So that** I don't forget to complete them

**Acceptance Criteria:**
- [ ] Browser push notification support
- [ ] Reminder timing: day before, morning of, or custom
- [ ] User opt-in for notifications
- [ ] Only for assigned chores
- [ ] Quiet hours setting (no notifications at night)

## Recurrence Patterns

### Daily
- Every day at specified time
- Option: every X days

### Weekly
- Select days: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Example: "Every Monday, Wednesday, Friday"

### Monthly
- Day of month: 1-31
- Handle months with fewer days (use last day of month)

### Custom (Future)
- Every X weeks on specific days
- Custom cron expression (advanced users)

## Edge Cases
- Timezone handling for due dates
- Daylight saving time transitions
- Month with fewer days than selected (Feb 30)
- Completing chore early (before next due date)
- Skipping an occurrence
- Changing assignee mid-recurrence
- Deleting chore with pending completions

## Technical Notes
- Store recurrence rules in separate table
- Use cron job or scheduled function to create instances
- Consider using rrule library for recurrence calculations
- Store completed instances separately from pending
- Index on next_due_date for efficient queries

## Database Schema

```sql
-- Recurring chore templates
CREATE TABLE recurring_chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE NOT NULL,
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_pattern JSONB NOT NULL, -- {"days": [1,3,5]} or {"dayOfMonth": 15} or {"intervalDays": 3}
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  next_due_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder preferences
CREATE TABLE reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'day_before' CHECK (reminder_type IN ('day_before', 'morning_of', 'custom_hours_before')),
  custom_hours INTEGER CHECK (custom_hours > 0),
  push_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE recurring_chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_recurring_chores_next_due ON recurring_chores(next_due_date);
CREATE INDEX idx_recurring_chores_household ON recurring_chores(household_id);
```

## API Endpoints
- `POST /api/chores/:id/recurring` - Create recurring schedule
- `GET /api/chores/:id/recurring` - Get recurrence details
- `PATCH /api/chores/:id/recurring` - Update recurrence
- `DELETE /api/chores/:id/recurring` - Stop recurrence
- `GET /api/chores/upcoming` - Get upcoming due chores
- `GET /api/reminders/preferences` - Get reminder settings
- `PATCH /api/reminders/preferences` - Update reminder settings

## UI Components
- Recurrence pattern selector
- Calendar preview component
- Upcoming chores list
- Reminder settings form
- Recurring badge/icon