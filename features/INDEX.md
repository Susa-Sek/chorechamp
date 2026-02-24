# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Planned** - Requirements written, ready for development
- **In Progress** - Currently being built
- **In Review** - QA testing in progress
- **Deployed** - Live in production

## Features

| ID | Feature | Status | Spec | Created |
|----|---------|--------|------|---------|
| PROJ-1 | User Authentication | Deployed | [PROJ-1-user-authentication.md](./PROJ-1-user-authentication.md) | 2026-02-23 |
| PROJ-2 | Household Management | Deployed | [PROJ-2-household-management.md](./PROJ-2-household-management.md) | 2026-02-23 |
| PROJ-3 | Chore Management | Deployed | [PROJ-3-chore-management.md](./PROJ-3-chore-management.md) | 2026-02-23 |
| PROJ-4 | Recurring Tasks | Deployed | [PROJ-4-recurring-tasks.md](./PROJ-4-recurring-tasks.md) | 2026-02-23 |
| PROJ-5 | Gamification - Points | Planned | [PROJ-5-gamification-points.md](./PROJ-5-gamification-points.md) | 2026-02-23 |
| PROJ-6 | Gamification - Rewards | Planned | [PROJ-6-gamification-rewards.md](./PROJ-6-gamification-rewards.md) | 2026-02-23 |
| PROJ-7 | Gamification - Levels & Badges | Planned | [PROJ-7-gamification-levels-badges.md](./PROJ-7-gamification-levels-badges.md) | 2026-02-23 |

<!-- Add features above this line -->

## Next Available ID: PROJ-8

## Build Order (Recommended)

1. **PROJ-1: User Authentication** - Foundation for all features
2. **PROJ-2: Household Management** - Required for collaborative features
3. **PROJ-3: Chore Management** - Core functionality
4. **PROJ-4: Recurring Tasks** - Extends chore management
5. **PROJ-5: Gamification - Points** - Engagement layer
6. **PROJ-6: Gamification - Rewards** (P1) - Enhanced engagement
7. **PROJ-7: Gamification - Levels & Badges** (P1) - Long-term progression

## Platform Strategy

| Phase | Platform | Tech |
|-------|----------|------|
| MVP (P0) | Responsive Web-App | Next.js + Tailwind CSS |
| P1 | Extended Features | Next.js |
| P2 | Mobile Apps | React Native (shared code with web) |

**Code Sharing Considerations:**
- Shared TypeScript types/interfaces
- Shared API client logic
- Shared business logic (points calculation, gamification rules)
- Platform-specific: UI components, navigation