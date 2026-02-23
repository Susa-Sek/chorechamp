# PROJ-3: Chore Management

> Status: Planned
> Created: 2026-02-23
> Dependencies: PROJ-1 (User Authentication), PROJ-2 (Household Management)

## Overview
Enable users to create, assign, track, and complete household chores within their household.

## User Stories

### US-3.1: Create Chore
**As a** household member
**I want to** create a new chore
**So that** it can be tracked and assigned

**Acceptance Criteria:**
- [ ] Chore name input (required, 2-100 characters)
- [ ] Description input (optional, max 500 characters)
- [ ] Assign to household member (optional, defaults to unassigned)
- [ ] Set point value (1-100, default based on difficulty)
- [ ] Set difficulty level (easy=10pts, medium=20pts, hard=50pts)
- [ ] Set due date (optional)
- [ ] Create button with loading state
- [ ] Success feedback and redirect to chore list

### US-3.2: Edit Chore
**As a** household member
**I want to** edit an existing chore
**So that** I can update its details

**Acceptance Criteria:**
- [ ] Edit accessible from chore detail view
- [ ] All fields editable (name, description, assignee, points, difficulty, due date)
- [ ] Changes saved with success feedback
- [ ] Cancel option to discard changes
- [ ] Audit log for chore changes (optional for MVP)

### US-3.3: Delete Chore
**As a** household member
**I want to** delete a chore
**So that** it's removed from the list if no longer needed

**Acceptance Criteria:**
- [ ] Delete button on chore detail/edit view
- [ ] Confirmation dialog before deletion
- [ ] Soft delete (archive) vs hard delete (MVP: hard delete)
- [ ] Success feedback after deletion
- [ ] Redirect to chore list after deletion

### US-3.4: Assign Chore
**As a** household member
**I want to** assign a chore to a member
**So that** responsibility is clear

**Acceptance Criteria:**
- [ ] Dropdown with all household members
- [ ] "Unassigned" option available
- [ ] Can reassign from one member to another
- [ ] Notification to newly assigned member (optional for MVP)
- [ ] Assignment visible on chore card and detail view

### US-3.5: View All Chores
**As a** household member
**I want to** see all chores in my household
**So that** I have an overview of what needs to be done

**Acceptance Criteria:**
- [ ] List/grid view toggle
- [ ] Filter by: status (pending/completed), assignee, difficulty
- [ ] Sort by: due date, created date, points, difficulty
- [ ] Search by chore name
- [ ] Pagination for large lists (20 per page)
- [ ] Empty state when no chores exist

### US-3.6: View Chore Details
**As a** household member
**I want to** see details of a specific chore
**So that** I understand what needs to be done

**Acceptance Criteria:**
- [ ] Display all chore information
- [ ] Show assignee with avatar
- [ ] Show due date with overdue indicator
- [ ] Show point value and difficulty
- [ ] Show completion status and history
- [ ] Edit/Delete buttons for authorized users

### US-3.7: Mark Chore as Complete
**As a** household member
**I want to** mark a chore as complete
**So that** it's tracked as done and I earn points

**Acceptance Criteria:**
- [ ] "Complete" button on assigned chore
- [ ] Optional: Add completion notes
- [ ] Points awarded to completing user
- [ ] Completion timestamp recorded
- [ ] Chore moves to "completed" section/filter
- [ ] Success feedback with points earned

### US-3.8: Undo Completion
**As a** household member
**I want to** undo a chore completion
**So that** I can correct mistakes

**Acceptance Criteria:**
- [ ] "Undo" option available for 24 hours after completion
- [ ] Points deducted from user who completed
- [ ] Chore returns to pending state
- [ ] Confirmation before undo
- [ ] Audit log entry (optional for MVP)

## Edge Cases
- Assigning chore to member who leaves household
- Deleting chore assigned to someone
- Completing chore after due date
- Editing chore while someone is completing it
- Concurrent edits to same chore
- Undo after points used for reward redemption
- Negative points from undo

## Technical Notes
- Use RLS policies to ensure household isolation
- Consider optimistic UI updates for better UX
- Index on household_id, assignee_id, due_date for queries
- Store completion history for statistics

## Database Schema

```sql
-- Chores table
CREATE TABLE chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  points INTEGER NOT NULL DEFAULT 10 CHECK (points >= 1 AND points <= 100),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'archived')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chore completion history (for undo and statistics)
CREATE TABLE chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID REFERENCES chores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  points_awarded INTEGER NOT NULL,
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX idx_chores_household ON chores(household_id);
CREATE INDEX idx_chores_assignee ON chores(assignee_id);
CREATE INDEX idx_chores_due_date ON chores(due_date);
CREATE INDEX idx_chores_status ON chores(status);
```

## API Endpoints
- `POST /api/chores` - Create chore
- `GET /api/chores` - List chores (with filters)
- `GET /api/chores/:id` - Get chore details
- `PATCH /api/chores/:id` - Update chore
- `DELETE /api/chores/:id` - Delete chore
- `POST /api/chores/:id/complete` - Mark as complete
- `POST /api/chores/:id/undo` - Undo completion

## UI Components
- Chore list component
- Chore card component
- Chore detail view
- Create/edit chore form
- Filter/sort controls
- Completion confirmation dialog