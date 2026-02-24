# PROJ-4: Recurring Tasks

> Status: Deployed
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
**Tested By:** Claude QA (Revised - Code Review)
**Test Method:** Thorough code review of all implementation files
**Status:** PARTIAL PASS - One Critical Bug Found

### IMPORTANT: Previous QA Report Corrections

The previous QA report contained **FALSE POSITIVE** claims that have been corrected:

1. **BUG-4.2-1 & BUG-4.2-2 (Previously CRITICAL)**: FALSE POSITIVE
   - The `recurring:recurring_chores` join IS present in both `/api/chores` and `/api/chores/[id]`
   - Verified at `/src/app/api/chores/route.ts` lines 172-178 and `/src/app/api/chores/[id]/route.ts` lines 111-117

2. **BUG-4.3-1 (Previously CRITICAL)**: FALSE POSITIVE
   - The recurring chore completion logic IS implemented
   - Verified at `/src/app/api/chores/[id]/complete/route.ts` lines 140-228
   - Logic correctly: checks if recurring, calculates next due date, resets to pending, updates recurring_chores table

### Test Summary

| User Story | Status | Critical | High | Medium | Low |
|------------|--------|----------|------|--------|-----|
| US-4.1: Create Recurring Chore | PASS | 0 | 0 | 1 | 0 |
| US-4.2: View Recurring Schedule | PARTIAL PASS | 1 | 0 | 0 | 0 |
| US-4.3: Complete Recurring Chore | PASS | 0 | 0 | 1 | 0 |
| US-4.4: Edit Recurring Pattern | PARTIAL PASS | 0 | 0 | 1 | 0 |
| US-4.5: Stop Recurrence | PASS | 0 | 0 | 0 | 0 |
| US-4.6: Due Date Reminders | PARTIAL PASS | 0 | 1 | 0 | 0 |

---

### US-4.1: Create Recurring Chore

**Status:** PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Recurrence pattern selection: daily, weekly, monthly, custom | PASS | All 4 types implemented in `recurrence-pattern-selector.tsx` lines 124-129 |
| For weekly: select specific days (Mon-Sun) | PASS | Day selector buttons implemented with German labels (Mo-So) at lines 176-209 |
| For monthly: select day of month (1-31) | PASS | Input with min=1, max=31 validation at lines 212-248 |
| For custom: every X days | PASS | Input with min=1, max=365 validation at lines 250-284 |
| Set start date (defaults to today) | PASS | Defaults to today in form at line 96 of `recurring-chore-dialog.tsx` |
| Optional: set end date or "forever" | PASS | Optional end date input at lines 304-327 |
| Preview next 5 occurrences | PASS | CalendarPreview component shows next 5 dates via useEffect at lines 53-61 |
| Points and difficulty inherited from base chore | PASS | Recurring is linked to chore via chore_id foreign key |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.1-1 | Medium | **UX: "Daily" and "Custom" patterns are functionally identical.** Both allow setting an interval in days. Recommendation: Either remove "custom" or differentiate it (e.g., "every X weeks on Y days"). |

---

### US-4.2: View Recurring Schedule

**Status:** PARTIAL PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Calendar view showing upcoming occurrences | PARTIAL | CalendarPreview provides list-style preview, not a full calendar widget |
| List view of next 10 occurrences | PASS | `/api/chores/[id]/recurring` returns `upcomingDates` array with 10 dates at line 84 |
| Show pattern (e.g., "Every Monday, Wednesday") | PASS | `formatRecurrencePattern` helper in `/lib/validations/recurring.ts` lines 219-253 |
| Visual indicator for recurring vs one-time chores | PARTIAL | Badge implemented but see BUG-4.2-4 |
| Badge/icon on chore card for recurring status | PARTIAL | Implemented in `chore-card.tsx` lines 183-210 but see BUG-4.2-4 |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.2-4 | **CRITICAL** | **`recurring` field not included in chore detail API response.** The GET endpoint at `/src/app/api/chores/[id]/route.ts` FETCHES the recurring data (lines 111-117) but does NOT include it in the response object (lines 135-169). The `recurring` field is missing from the return statement, causing the chore detail page to not display recurring information. |
| BUG-4.2-3 | Medium | **No true calendar view widget.** The CalendarPreview component is a list view, not a calendar widget. A full calendar view would improve UX for visualizing upcoming occurrences. |

**Steps to Reproduce BUG-4.2-4:**
1. Create a chore with recurring schedule
2. Navigate to chore detail page `/chores/[id]`
3. Observe that recurring badge does NOT appear
4. Check API response - `recurring` field is undefined despite data being fetched

**Fix for BUG-4.2-4:** Add the `recurring` field to the response object in `/api/chores/[id]/route.ts`:
```typescript
recurring: typedChore.recurring && typedChore.recurring.length > 0
  ? {
      id: typedChore.recurring[0].id,
      recurrenceType: typedChore.recurring[0].recurrence_type,
      recurrencePattern: typedChore.recurring[0].recurrence_pattern,
      nextDueDate: typedChore.recurring[0].next_due_date,
      active: typedChore.recurring[0].active,
    }
  : null,
```

---

### US-4.3: Complete Recurring Chore

**Status:** PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Complete current instance only | PASS | Complete endpoint fetches chore, records completion, handles recurring logic |
| Automatic reset to pending for next occurrence | PASS | Lines 196-204: Updates status to "pending" for recurring chores |
| Due date updates to next scheduled date | PASS | Lines 199-200: Sets `due_date: nextDueDate.toISOString()` |
| Points awarded for each completion | PASS | Lines 263-276: Calls `add_points_to_user` RPC |
| Completion history maintained per instance | PASS | Lines 249-261: Inserts into `chore_completions` table |

**Implementation Verified:** The complete endpoint at `/src/app/api/chores/[id]/complete/route.ts` correctly:
1. Fetches chore with recurring data (lines 40-62)
2. Checks if chore has active recurring schedule (lines 79-90)
3. Calculates next due date using `calculateNextOccurrences` (lines 142-151)
4. Resets status to "pending" and updates due_date (lines 196-204)
5. Updates `next_due_date` in `recurring_chores` table (lines 214-226)
6. Records completion for history (lines 249-261)

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.3-2 | Medium | **No "skip occurrence" feature.** Users cannot skip a recurring instance without marking it complete. The spec mentions this as an edge case but it's not implemented. |

---

### US-4.4: Edit Recurring Pattern

**Status:** PARTIAL PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Edit pattern without affecting chore details | PASS | PATCH endpoint at `/api/chores/[id]/recurring` lines 256-400 updates only recurring fields |
| Option to apply to future instances only | FAIL | NOT IMPLEMENTED - no such option |
| Option to apply to all instances (including history) | FAIL | NOT IMPLEMENTED - no such option |
| Confirmation dialog explaining scope of change | FAIL | Confirmation dialog only for "stop" action, not pattern edits |
| Preview new schedule before saving | PASS | CalendarPreview updates in real-time via useEffect in `recurrence-pattern-selector.tsx` |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.4-1 | Medium | **Missing scope options for pattern changes.** The spec requires options to apply changes to "future instances only" vs "all instances". Currently, pattern changes immediately update the recurring record. |

---

### US-4.5: Stop Recurrence

**Status:** PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| "Stop recurring" option in chore settings | PASS | "Stoppen" button in RecurringChoreDialog lines 189-199 |
| Current instance remains as-is | PASS | DELETE endpoint sets `active=false`, does not modify chore |
| No future instances created | PASS | `active=false` prevents future scheduling |
| Chore marked as one-time | PASS | `recurring.active` becomes false |
| History preserved | PASS | `recurring_chores` record kept (soft delete via active=false) |

**No bugs found.**

---

### US-4.6: Due Date Reminders

**Status:** PARTIAL PASS

| Criterion | Status | Notes |
|-----------|--------|-------|
| Browser push notification support | FAIL | Only preferences stored, no actual push implementation |
| Reminder timing: day before, morning of, or custom | PASS | All 3 timing options in `reminder_preferences` table |
| User opt-in for notifications | PASS | `push_enabled` toggle in settings |
| Only for assigned chores | N/A | Not implemented - no push logic exists |
| Quiet hours setting (no notifications at night) | PASS | `quiet_hours_start` and `quiet_hours_end` fields implemented |

**Bugs Found:**

| ID | Severity | Description |
|----|----------|-------------|
| BUG-4.6-1 | High | **No actual push notification implementation.** The `reminder_preferences` table and API are fully implemented, but there is NO code that actually sends push notifications. Requires: (1) Cron job or scheduled function, (2) Browser push API integration, (3) Query chores due soon, (4) Check reminder preferences, (5) Respect quiet hours. Note: This is documented as deferred functionality. |
| BUG-4.6-2 | Low | **Missing "only for assigned chores" filter.** The spec states reminders should only fire for chores assigned to the user, but this filtering logic doesn't exist since there's no push implementation. |

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

### Tested Features (from features/INDEX.md):
- PROJ-1 (User Authentication): PASS - No regressions detected
- PROJ-2 (Household Management): PASS - No regressions detected
- PROJ-3 (Chore Management): PARTIAL PASS - See BUG-4.2-4

### Regression Test Results:
| Feature | Status | Notes |
|---------|--------|-------|
| User can create chore | PASS | No changes to chore creation |
| User can complete chore | PASS | Complete endpoint handles recurring correctly |
| User can view chore list | PASS | Recurring badge renders correctly |
| User can view chore detail | FAIL | See BUG-4.2-4 - recurring field not in response |

---

## Recommendations

### Critical Fixes Required (Must fix before deployment):
1. **BUG-4.2-4**: Add `recurring` field to the response object in `/api/chores/[id]/route.ts` - this is a simple fix, just add the missing field to the return statement

### High Priority Fixes:
2. **BUG-4.6-1**: Implement actual push notification system (cron job + browser push API) - Can be deferred to a follow-up task

### Medium Priority:
3. **BUG-4.4-1**: Add scope options (future only vs all) for pattern edits
4. **BUG-4.1-1**: Clarify or differentiate "daily" vs "custom" pattern types
5. **BUG-4.2-3**: Add calendar view widget for upcoming occurrences

### Low Priority:
6. **BUG-4.3-2**: Add "skip occurrence" feature
7. **BUG-4.6-2**: Add filter for "only assigned chores" in reminders

---

## Production-Ready Decision

**Status: NOT READY**

Reason: BUG-4.2-4 is a critical bug that prevents the recurring badge from displaying on the chore detail page. This is a simple fix - the data is already being fetched, it just needs to be included in the response.

After fixing BUG-4.2-4, the feature can be considered production-ready with known limitations:
- Push notifications are not implemented (deferred)
- Calendar view is a list preview, not a full calendar widget
- Pattern edit scope options not implemented

---

## Test Environment
- Node.js: v20+
- Platform: Linux 6.8.0-90-generic
- Test Method: Thorough code review of all implementation files
- Files Reviewed:
  - `/src/app/api/chores/route.ts`
  - `/src/app/api/chores/[id]/route.ts`
  - `/src/app/api/chores/[id]/complete/route.ts`
  - `/src/app/api/chores/[id]/recurring/route.ts`
  - `/src/app/api/reminders/preferences/route.ts`
  - `/src/app/(protected)/chores/[id]/page.tsx`
  - `/src/app/(protected)/chores/page.tsx`
  - `/src/components/chore/chore-card.tsx`
  - `/src/components/recurring/recurrence-pattern-selector.tsx`
  - `/src/components/recurring/recurring-chore-dialog.tsx`
  - `/src/components/recurring/calendar-preview.tsx`
  - `/src/components/recurring/recurring-badge.tsx`
  - `/src/lib/validations/recurring.ts`