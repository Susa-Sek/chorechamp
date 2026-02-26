# PROJ-9: E2E User Journey Test Scenarios

> Status: In Review (Tests Need Auth Fix)
> Created: 2026-02-25
> Updated: 2026-02-26
> Dependencies: All features (PROJ-1 through PROJ-8)
> Test Run: 2026-02-26 (6 failed, 1 passed, 67 not run due to dependencies)
> Production: https://chorechamp-phi.vercel.app

## Overview
Comprehensive end-to-end test scenarios covering complete user journeys from registration through gamification. These tests validate the entire ChoreChamp experience as real users would interact with it.

## Test Environment Setup

### Test Users
| User | Email | Password | Purpose |
|------|-------|----------|---------|
| Parent Admin | parent@test.com | Test1234! | Household creator/admin |
| Child Member | child@test.com | Test1234! | Household member |
| Partner Member | partner@test.com | Test1234! | Household member |
| Solo User | solo@test.com | Test1234! | User without household |

### Test Data
- Standard chores (Bad putzen, Müll rausbringen, Geschirrspüler ausräumen)
- Recurring tasks (Wöchentlich, Monatlich)
- Rewards (Kino, Eis essen, Taschengeld)

## User Journey 1: New User Registration & Onboarding

### UJ-1.1: Complete Registration Flow
**Duration:** ~2 minutes
**Priority:** Critical

**Steps:**
1. Navigate to landing page `/`
2. Click "Registrieren" button
3. Enter display name: "Test Parent"
4. Enter email: "parent@test.com"
5. Enter password: "Test1234!"
6. Click "Konto erstellen"
7. Verify redirect to `/dashboard`
8. Verify profile created with correct display name
9. Verify point balance shows 0
10. Verify level shows 1

**Expected Results:**
- [ ] Registration successful
- [ ] Profile auto-created with display name
- [ ] Point balance record exists (0 points)
- [ ] User level record exists (Level 1)
- [ ] No 406 errors in network tab
- [ ] Dashboard loads within 2 seconds

**Edge Cases:**
- Duplicate email → Error message shown
- Weak password → Validation error shown
- Network error → Friendly error message

### UJ-1.2: Login Flow
**Duration:** ~30 seconds
**Priority:** Critical

**Steps:**
1. Navigate to `/auth/login`
2. Enter email: "parent@test.com"
3. Enter password: "Test1234!"
4. Click "Anmelden"
5. Verify redirect to `/dashboard`
6. Verify session persists on page refresh

**Expected Results:**
- [ ] Login successful
- [ ] Redirect to dashboard
- [ ] Loading state shown during auth
- [ ] Session persists after refresh
- [ ] Invalid credentials show error

## User Journey 2: Household Creation & Management

### UJ-2.1: Create New Household
**Duration:** ~1 minute
**Priority:** Critical

**Steps:**
1. Login as "parent@test.com"
2. Navigate to `/dashboard`
3. Click "Haushalt erstellen" or similar CTA
4. Enter household name: "Familie Müller"
5. Click "Erstellen"
6. Verify redirect to household page
7. Verify user is admin member
8. Verify invite code generated

**Expected Results:**
- [ ] Household created successfully
- [ ] User becomes admin automatically
- [ ] Invite code displayed
- [ ] household_members record created
- [ ] point_balances household_id updated
- [ ] user_levels household_id updated

### UJ-2.2: Join Existing Household
**Duration:** ~1 minute
**Priority:** High

**Steps:**
1. Login as "child@test.com"
2. Navigate to `/dashboard`
3. Click "Haushalt beitreten"
4. Enter invite code from UJ-2.1
5. Click "Beitreten"
6. Verify redirect to household page
7. Verify user is regular member
8. Verify household name displayed

**Expected Results:**
- [ ] Join successful with valid code
- [ ] User role is "member"
- [ ] household_members record created
- [ ] Error shown for invalid code
- [ ] Error shown for expired code

### UJ-2.3: Manage Household Members
**Duration:** ~2 minutes
**Priority:** Medium

**Steps:**
1. Login as admin (parent@test.com)
2. Navigate to household settings
3. View member list
4. Verify all members shown
5. Change member role (member → admin)
6. Remove member
7. Verify changes reflected

**Expected Results:**
- [ ] Member list shows all users
- [ ] Role changes work
- [ ] Remove member works
- [ ] Changes persist

## User Journey 3: Chore Management

### UJ-3.1: Create Chores
**Duration:** ~2 minutes
**Priority:** Critical

**Steps:**
1. Login as admin
2. Navigate to chores page
3. Click "Neue Aufgabe"
4. Enter title: "Bad putzen"
5. Set difficulty: "Mittel"
6. Set points: 20 (auto-filled)
7. Set due date: tomorrow
8. Assign to: "child@test.com"
9. Click "Speichern"
10. Verify chore appears in list

**Expected Results:**
- [ ] Chore created successfully
- [ ] Points auto-calculated based on difficulty
- [ ] Assignment shown
- [ ] Chore visible to assigned user
- [ ] Due date shown

### UJ-3.2: Complete Chore & Earn Points
**Duration:** ~1 minute
**Priority:** Critical

**Steps:**
1. Login as "child@test.com"
2. Navigate to chores page
3. Find assigned chore "Bad putzen"
4. Click "Erledigt" button
5. Verify celebration animation
6. Verify points updated (+20)
7. Verify chore marked complete
8. Check point history

**Expected Results:**
- [ ] Chore marked complete
- [ ] Points awarded immediately
- [ ] Celebration animation shown
- [ ] Point transaction logged
- [ ] Chore moves to completed section

### UJ-3.3: Recurring Tasks
**Duration:** ~1 minute
**Priority:** High

**Steps:**
1. Create recurring chore "Müll rausbringen"
2. Set recurrence: "Wöchentlich"
3. Set day: "Donnerstag"
4. Complete the chore
5. Verify new instance created for next week

**Expected Results:**
- [ ] Recurring pattern saved
- [ ] Next occurrence auto-created
- [ ] Completion doesn't affect future instances

## User Journey 4: Gamification Flow

### UJ-4.1: Point Progression
**Duration:** ~3 minutes
**Priority:** High

**Steps:**
1. Login as new user
2. Complete multiple chores:
   - Easy chore (+10 points)
   - Medium chore (+20 points)
   - Hard chore (+50 points)
3. Verify running total
4. Check leaderboard position
5. View point history

**Expected Results:**
- [ ] Points accumulate correctly
- [ ] History shows all transactions
- [ ] Leaderboard updates
- [ ] Balance matches sum of transactions

### UJ-4.2: Level Up Experience
**Duration:** ~5 minutes
**Priority:** High

**Steps:**
1. Complete chores to earn XP
2. Reach XP threshold for level 2
3. Verify level up animation
4. Verify new level displayed
5. Check XP progress bar reset

**Expected Results:**
- [ ] XP earned per chore
- [ ] Level up at correct threshold
- [ ] Celebration shown
- [ ] Progress resets for new level

### UJ-4.3: Streak Tracking
**Duration:** Multi-day
**Priority:** Medium

**Steps:**
1. Complete at least one chore today
2. Verify streak: 1 day
3. Complete chore tomorrow
4. Verify streak: 2 days
5. Skip a day
6. Verify streak reset to 0

**Expected Results:**
- [ ] Streak increments correctly
- [ ] Streak resets on skipped day
- [ ] Longest streak tracked
- [ ] Visual indicator shown

## User Journey 5: Reward Redemption

### UJ-5.1: Browse Rewards
**Duration:** ~1 minute
**Priority:** Medium

**Steps:**
1. Navigate to rewards page
2. View available rewards
3. Check point costs
4. Filter by affordable rewards

**Expected Results:**
- [ ] Rewards displayed with costs
- [ ] Insufficient points shown grayed out
- [ ] Details available

### UJ-5.2: Redeem Reward
**Duration:** ~1 minute
**Priority:** Medium

**Steps:**
1. Have sufficient points (100+)
2. Select reward "Kino"
3. Click "Einlösen"
4. Confirm redemption
5. Verify points deducted
6. Verify redemption logged

**Expected Results:**
- [ ] Redemption successful
- [ ] Points deducted
- [ ] Confirmation shown
- [ ] Transaction logged

## User Journey 6: Family Scenario (Full Integration)

### UJ-6.1: Complete Family Workflow
**Duration:** ~10 minutes
**Priority:** Critical

**Steps:**

**Setup:**
1. Parent creates household "Familie Schmidt"
2. Parent invites child via invite code
3. Child joins household
4. Partner joins household

**Chore Assignment:**
5. Parent creates chores:
   - "Geschirrspüler ausräumen" (Easy, 10 pts) → Child
   - "Wäsche aufhängen" (Medium, 20 pts) → Partner
   - "Bad putzen" (Hard, 50 pts) → Anyone
6. Parent sets recurring chore "Müll rausbringen" (Weekly)

**Execution:**
7. Child completes "Geschirrspüler ausräumen"
8. Verify child's points: +10
9. Partner completes "Wäsche aufhängen"
10. Verify partner's points: +20
11. Child claims and completes "Bad putzen"
12. Verify child's points: +60 total

**Gamification:**
13. Check leaderboard
14. Child should be #1 with 60 points
15. Verify child earned XP toward level 2
16. Check if streak started

**Reward:**
17. Parent creates reward "Eis essen" (50 points)
18. Child redeems "Eis essen"
19. Verify child's points: 10 remaining
20. Parent marks reward as fulfilled

**Expected Results:**
- [ ] All users in same household
- [ ] Chores correctly assigned
- [ ] Points awarded correctly
- [ ] Leaderboard accurate
- [ ] Redemption works
- [ ] Full audit trail

## Playwright Test Implementation

### Test File Structure
```
tests/
  journeys/
    registration.spec.ts
    household.spec.ts
    chores.spec.ts
    gamification.spec.ts
    rewards.spec.ts
    full-family-scenario.spec.ts
  fixtures/
    test-users.ts
    test-data.ts
  utils/
    auth-helpers.ts
    household-helpers.ts
```

### Test Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/journeys',
  fullyParallel: false, // Sequential for dependent tests
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Test Coverage | 100% of user journeys |
| Pass Rate | 95%+ |
| Execution Time | < 5 minutes total |
| Flaky Tests | < 5% |
| Edge Cases Covered | 20+ |

## Priority Matrix

| Journey | Priority | Effort | Dependencies |
|---------|----------|--------|--------------|
| UJ-1: Registration | Critical | Low | None |
| UJ-2: Household | Critical | Medium | UJ-1 |
| UJ-3: Chores | Critical | Medium | UJ-2 |
| UJ-4: Gamification | High | Medium | UJ-3 |
| UJ-5: Rewards | Medium | Low | UJ-4 |
| UJ-6: Full Family | Critical | High | All |

## Test Data Cleanup

After each test run:
1. Delete test users
2. Delete test households
3. Reset database state
4. Clear localStorage/cookies

## Continuous Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```