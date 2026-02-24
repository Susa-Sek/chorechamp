# PROJ-4: Recurring Tasks

> Status: In Review
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

---

## QA Test Report

**Test Date:** 2026-02-24
**Tested By:** Claude QA
**Status:** FAIL - Critical bugs found

### Test Summary

| User Story | Status | Critical | High | Medium | Low |
|------------|--------|----------|------|--------|-----|
| US-4.1: Create Recurring Chore | PARTIAL PASS | 0 | 0 | 1 | 0 |
| US-4.2: View Recurring Schedule | FAIL | 1 | 1 | 0 | 0 |
| US-4.3: Complete Recurring Chore | FAIL | 1 | 0 | 0 | 0 |
| US-4.4: Edit Recurring Pattern | PARTIAL PASS | 0 | 0 | 1 | 0 |
| US-4.5: Stop Recurrence | PASS | 0 | 0 | 0 | 0 |
| US-4.6: Due Date Reminders | PARTIAL PASS | 0 | 1 | 0 | 0 |

---

### US-4.1: Create Recurring Chore

**Status:** PARTIAL PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Recurrence pattern selection: daily, weekly, monthly, custom | PASS | All 4 types implemented in `recurrence-pattern-selector.tsx` |
| For weekly: select specific days (Mon-Sun) | PASS | Day selector buttons implemented with German labels (Mo-So) |
| For monthly: select day of month (1-31) | PASS | Input with min=1, max=31 validation |
| For custom: every X days | PASS | Input with min=1, max=365 validation |
| Set start date (defaults to today) | PASS | Defaults to today in form |
| Optional: set end date or "forever" | PASS | Optional end date input implemented |
| Preview next 5 occurrences | PASS | CalendarPreview component shows next 5 dates |
| Points and difficulty inherited from base chore | N/A | Recurring is linked to chore, no separate points/difficulty |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.1-1 | Medium | **Duplicate functionality between "daily" and "custom" types.** The "daily" type with intervalDays is functionally identical to "custom" with intervalDays. This may confuse users. Recommendation: Either remove "custom" or make it distinctly different (e.g., "every X weeks on Y days"). |

---

### US-4.2: View Recurring Schedule

**Status:** FAIL

| Criterion | Status | Notes |
|-----------|--------|-------|
| Calendar view showing upcoming occurrences | FAIL | Not implemented - only list view exists |
| List view of next 10 occurrences | PARTIAL | API returns 10 occurrences, but GET /api/chores/[id] endpoint missing recurring data |
| Show pattern (e.g., "Every Monday, Wednesday") | PASS | formatRecurrencePattern helper implemented |
| Visual indicator for recurring vs one-time chores | FAIL | Recurring badge not shown due to missing data in API response |
| Badge/icon on chore card for recurring status | FAIL | Recurring badge not shown due to missing data in API response |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.2-1 | **CRITICAL** | **Recurring data not fetched in chores list API.** The `GET /api/chores` endpoint does NOT include the `recurring:recurring_chores` join, so the recurring badge will never show on the chores list page. File: `/src/app/api/chores/route.ts` lines 117-152 |
| BUG-4.2-2 | **CRITICAL** | **Recurring data not fetched in chore detail API.** The `GET /api/chores/[id]` endpoint does NOT include the `recurring:recurring_chores` join, so recurring information won't display on the chore detail page. File: `/src/app/api/chores/[id]/route.ts` lines 68-105 |
| BUG-4.2-3 | High | **No calendar view component.** The acceptance criteria specifies a "calendar view showing upcoming occurrences" but only a list view (CalendarPreview) is implemented. A true calendar widget should be added. |

---

### US-4.3: Complete Recurring Chore

**Status:** FAIL

| Criterion | Status | Notes |
|-----------|--------|-------|
| Complete current instance only | PASS | Complete endpoint only updates current chore |
| Automatic reset to pending for next occurrence | FAIL | NOT IMPLEMENTED - chore stays completed |
| Due date updates to next scheduled date | FAIL | NOT IMPLEMENTED - due date not updated |
| Points awarded for each completion | PASS | Points system calls RPC (deferred to PROJ-5) |
| Completion history maintained per instance | PASS | chore_completions table records each completion |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.3-1 | **CRITICAL** | **Completing a recurring chore does NOT reset it for the next occurrence.** The `POST /api/chores/[id]/complete` endpoint has NO logic to handle recurring chores. After completion, the chore should: (1) Check if chore has active recurring schedule, (2) Calculate next due date, (3) Reset status to "pending", (4) Update due_date to next occurrence, (5) Update next_due_date in recurring_chores table. File: `/src/app/api/chores/[id]/complete/route.ts` |
| BUG-4.3-2 | Medium | **No "skip occurrence" feature.** Users cannot skip a recurring instance without marking it complete. The spec mentions this as an edge case but it's not implemented. |

**Steps to Reproduce BUG-4.3-1:**
1. Create a chore
2. Set up a weekly recurring schedule (e.g., every Monday)
3. Mark the chore as complete
4. Expected: Chore resets to pending with due date = next Monday
5. Actual: Chore stays in "completed" status, never resets

---

### US-4.4: Edit Recurring Pattern

**Status:** PARTIAL PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Edit pattern without affecting chore details | PASS | PATCH endpoint updates only recurring fields |
| Option to apply to future instances only | FAIL | NOT IMPLEMENTED - no such option |
| Option to apply to all instances (including history) | FAIL | NOT IMPLEMENTED - no such option |
| Confirmation dialog explaining scope of change | FAIL | NOT IMPLEMENTED - no confirmation dialog |
| Preview new schedule before saving | PASS | CalendarPreview updates in real-time |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.4-1 | Medium | **Missing scope options for pattern changes.** The spec requires "apply to future instances only" vs "apply to all instances" options. Currently, editing the pattern immediately updates the recurring record without any options. The confirmation dialog in RecurringChoreDialog only appears for "stop" action, not for pattern changes. |

---

### US-4.5: Stop Recurrence

**Status:** PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| "Stop recurring" option in chore settings | PASS | Button in RecurringChoreDialog |
| Current instance remains as-is | PASS | DELETE endpoint sets active=false, doesn't modify chore |
| No future instances created | PASS | active=false prevents future scheduling |
| Chore marked as one-time | PASS | recurring.active becomes false |
| History preserved | PASS | recurring_chores record kept (soft delete) |

**No bugs found.**

---

### US-4.6: Due Date Reminders

**Status:** PARTIAL PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Browser push notification support | FAIL | Only preferences stored, no actual push implementation |
| Reminder timing: day before, morning of, or custom | PASS | All 3 timing options implemented |
| User opt-in for notifications | PASS | pushEnabled toggle in settings |
| Only for assigned chores | N/A | Not implemented - no push logic exists |
| Quiet hours setting (no notifications at night) | PASS | Start/end time inputs implemented |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.6-1 | High | **No actual push notification implementation.** The reminder_preferences table and API are fully implemented, but there is NO code that actually sends push notifications. A cron job or scheduled function is needed to: (1) Query chores due soon, (2) Check reminder preferences, (3) Send browser push notifications, (4) Respect quiet hours. This is a significant gap - users can configure reminders but they will never receive any. |
| BUG-4.6-2 | Medium | **Missing "only for assigned chores" filter.** The spec states reminders should only fire for chores assigned to the user, but since there's no push implementation, this filtering logic doesn't exist. |

---

## Security Audit

### PASS: Authentication & Authorization
- All recurring API endpoints check authentication via `supabase.auth.getUser()`
- Household membership is verified before any operation
- RLS policies correctly restrict access to household members only

### PASS: Input Validation
- Zod schemas validate all input (recurrence type, patterns, dates)
- Weekly pattern validates days array (0-6)
- Monthly pattern validates dayOfMonth (1-31)
- Custom pattern validates intervalDays (1-365)

### PASS: SQL Injection Prevention
- All database operations use Supabase parameterized queries
- No raw SQL concatenation

### PASS: Row Level Security
- RLS policies correctly implemented for both tables
- Users can only access recurring chores in their household
- Users can only modify their own reminder preferences

### WARNING: Potential Issues
1. **No rate limiting** on recurring API endpoints - could be abused
2. **No audit logging** for recurring changes - history tracking limited
3. **Missing input sanitization** for error messages returned to client

---

## Regression Testing

### Affected Features (from features/INDEX.md):
- PROJ-3 (Chore Management): **AFFECTED** - chores list and detail endpoints missing recurring join

### Regression Bugs Found:
| ID | Severity | Description |
|----|----------|-------------|
| REG-1 | **CRITICAL** | **Chores list page regression.** The recurring badge feature from PROJ-4 has broken the visual indicator on the chores list because the API doesn't return recurring data. Users won't see which chores are recurring. |

---

## Recommendations

### Critical Fixes Required (Must fix before deployment):
1. **BUG-4.3-1**: Implement recurring chore completion logic - this is the core feature and is completely broken
2. **BUG-4.2-1 & BUG-4.2-2**: Add `recurring:recurring_chores` join to both `/api/chores` and `/api/chores/[id]` endpoints

### High Priority Fixes:
3. **BUG-4.6-1**: Implement actual push notification system (cron job + browser push API)
4. **BUG-4.2-3**: Add calendar view component for upcoming occurrences

### Medium Priority:
5. **BUG-4.4-1**: Add scope options (future only vs all) for pattern edits
6. **BUG-4.1-1**: Clarify or differentiate "daily" vs "custom" pattern types

---

## Test Environment
- Node.js: v20+
- Browser: N/A (code review only)
- Platform: Linux 6.8.0-90-generic
- Test Method: Static code analysis + API endpoint testing