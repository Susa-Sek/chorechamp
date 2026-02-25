# PROJ-8: Database Triggers for User Onboarding

> Status: Planned
> Created: 2026-02-25
> Updated: 2026-02-25
> Dependencies: PROJ-1 (User Authentication), PROJ-5 (Gamification - Points), PROJ-7 (Levels & Badges)

## Overview
Automatically create all required user-related records when a new user signs up, eliminating 406 errors and ensuring seamless onboarding experience. This includes point_balances, user_levels, and proper profile initialization.

## Problem Statement
Currently, new users encounter HTTP 406 errors because:
1. `point_balances` table has no record for the new user
2. `user_levels` table has no record for the new user
3. Providers fail to initialize when querying these tables
4. UI gets stuck in "Laden..." loading state

## User Stories

### US-8.1: Automatic Point Balance Creation
**As a** new user
**I want to** have a point balance created automatically when I register
**So that** I can immediately see my points and the app loads without errors

**Acceptance Criteria:**
- [ ] `point_balances` record created automatically on user signup
- [ ] Default balance: 0
- [ ] Default total_earned: 0
- [ ] Default total_spent: 0
- [ ] household_id is NULL until user joins/creates a household
- [ ] No 406 errors when fetching point balance

### US-8.2: Automatic User Level Creation
**As a** new user
**I want to** have a level record created automatically when I register
**So that** I can see my starting level and progress immediately

**Acceptance Criteria:**
- [ ] `user_levels` record created automatically on user signup
- [ ] Default level: 1
- [ ] Default experience_points: 0
- [ ] Default total_xp_earned: 0
- [ ] household_id is NULL until user joins/creates a household
- [ ] No 406 errors when fetching user level

### US-8.3: Automatic User Streak Creation
**As a** new user
**I want to** have a streak record created automatically when I register
**So that** I can track my activity streaks from day one

**Acceptance Criteria:**
- [ ] `user_streaks` record created automatically on user signup
- [ ] Default current_streak: 0
- [ ] Default longest_streak: 0
- [ ] last_completion_date: NULL

### US-8.4: Profile Auto-Creation Enhancement
**As a** new user
**I want to** have my profile created automatically from signup data
**So that** I don't need to fill in additional forms

**Acceptance Criteria:**
- [ ] `profiles` record created from auth.users metadata
- [ ] display_name extracted from auth.users.raw_user_meta_data.display_name
- [ ] If no display_name, use email prefix as fallback
- [ ] created_at and updated_at set correctly

### US-8.5: Household Member Auto-Creation
**As a** user who creates a household
**I want to** automatically become a member of that household
**So that** I can immediately start using the household features

**Acceptance Criteria:**
- [ ] `household_members` record created when user creates a household
- [ ] Role is set to 'admin' for household creator
- [ ] joined_at timestamp set correctly
- [ ] household_id updated in point_balances
- [ ] household_id updated in user_levels

### US-8.6: Household Join Cascade
**As a** user who joins an existing household
**I want to** have my related records updated automatically
**So that** my points and levels are associated with the household

**Acceptance Criteria:**
- [ ] household_id updated in point_balances when joining
- [ ] household_id updated in user_levels when joining
- [ ] household_members record created with role 'member'
- [ ] joined_at timestamp set correctly

## Database Triggers

### Trigger 1: On User Creation (auth.users insert)
```sql
-- Function to handle new user setup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NOW(),
    NOW()
  );

  -- Create point balance
  INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
  VALUES (NEW.id, NULL, 0, 0, 0, NOW());

  -- Create user level
  INSERT INTO public.user_levels (user_id, household_id, level, experience_points, total_xp_earned, updated_at)
  VALUES (NEW.id, NULL, 1, 0, 0, NOW());

  -- Create user streak
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
  VALUES (NEW.id, 0, 0, NULL, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Trigger 2: On Household Creation
```sql
-- Function to handle household creation
CREATE OR REPLACE FUNCTION handle_household_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Add creator as admin member
  INSERT INTO public.household_members (household_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.created_by, 'admin', NOW());

  -- Update creator's point_balances household_id
  UPDATE public.point_balances
  SET household_id = NEW.id, updated_at = NOW()
  WHERE user_id = NEW.created_by;

  -- Update creator's user_levels household_id
  UPDATE public.user_levels
  SET household_id = NEW.id, updated_at = NOW()
  WHERE user_id = NEW.created_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on households
CREATE TRIGGER on_household_created
  AFTER INSERT ON public.households
  FOR EACH ROW EXECUTE FUNCTION handle_household_creation();
```

### Trigger 3: On Household Join
```sql
-- Function to handle household join
CREATE OR REPLACE FUNCTION handle_household_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's point_balances household_id
  UPDATE public.point_balances
  SET household_id = NEW.household_id, updated_at = NOW()
  WHERE user_id = NEW.user_id;

  -- Update user's user_levels household_id
  UPDATE public.user_levels
  SET household_id = NEW.household_id, updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on household_members
CREATE TRIGGER on_household_member_added
  AFTER INSERT ON public.household_members
  FOR EACH ROW EXECUTE FUNCTION handle_household_join();
```

### Trigger 4: Update updated_at timestamps
```sql
-- Generic function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_point_balances_updated_at
  BEFORE UPDATE ON public.point_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Edge Cases

### EC-8.1: User Deletes Account
- All related records should be deleted via CASCADE
- Verify ON DELETE CASCADE is set on all foreign keys

### EC-8.2: User Leaves Household
- household_id should be set to NULL in point_balances and user_levels
- household_members record should be deleted
- Points and level history retained

### EC-8.3: Household Deleted
- All household_members should be removed
- household_id set to NULL in related tables
- Household chores deleted

### EC-8.4: Concurrent User Creation
- Triggers must handle concurrent inserts
- No race conditions on trigger execution

### EC-8.5: Missing Display Name in Metadata
- Fallback to email prefix
- If email is NULL (OAuth), use 'User' as fallback

### EC-8.6: User Already Has Records
- Handle duplicate key errors gracefully
- Use ON CONFLICT DO NOTHING for idempotent triggers

## Technical Notes

### Security Considerations
- Use `SECURITY DEFINER` for trigger functions that need elevated privileges
- Ensure RLS policies don't block trigger operations
- Test with different user contexts

### Performance
- Keep triggers lightweight
- Avoid recursive trigger calls
- Use indexes on foreign key columns

### Testing
- Verify triggers fire correctly on insert
- Test all edge cases
- Verify rollback works correctly

## Migration Strategy

1. Create migration file with all triggers
2. Run migration on Supabase
3. Create backfill script for existing users without records
4. Test with new user registration
5. Monitor for errors

## Backfill Script for Existing Users

```sql
-- Backfill point_balances for existing users
INSERT INTO public.point_balances (user_id, household_id, current_balance, total_earned, total_spent, updated_at)
SELECT
  u.id,
  hm.household_id,
  0, 0, 0, NOW()
FROM auth.users u
LEFT JOIN public.point_balances pb ON pb.user_id = u.id
LEFT JOIN public.household_members hm ON hm.user_id = u.id
WHERE pb.id IS NULL;

-- Backfill user_levels for existing users
INSERT INTO public.user_levels (user_id, household_id, level, experience_points, total_xp_earned, updated_at)
SELECT
  u.id,
  hm.household_id,
  1, 0, 0, NOW()
FROM auth.users u
LEFT JOIN public.user_levels ul ON ul.user_id = u.id
LEFT JOIN public.household_members hm ON hm.user_id = u.id
WHERE ul.id IS NULL;

-- Backfill user_streaks for existing users
INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completion_date, updated_at)
SELECT
  u.id,
  0, 0, NULL, NOW()
FROM auth.users u
LEFT JOIN public.user_streaks us ON us.user_id = u.id
WHERE us.id IS NULL;
```

## Success Criteria

| Metric | Target |
|--------|--------|
| New user registration | 0 errors, all records created |
| Household creation | User becomes admin member |
| Household join | Records updated correctly |
| Loading time | < 500ms from registration to dashboard |
| 406 errors | 0 after implementation |

## API Endpoints
None required - all handled by database triggers

## UI Components
None required - automatic backend functionality