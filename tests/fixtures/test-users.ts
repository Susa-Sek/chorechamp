/**
 * Test Users for E2E Tests
 * These users are created fresh for each test run
 */

export const TEST_USERS = {
  parent: {
    email: 'parent@test.com',
    password: 'Test1234!',
    displayName: 'Test Parent',
  },
  child: {
    email: 'child@test.com',
    password: 'Test1234!',
    displayName: 'Test Child',
  },
  partner: {
    email: 'partner@test.com',
    password: 'Test1234!',
    displayName: 'Test Partner',
  },
  solo: {
    email: 'solo@test.com',
    password: 'Test1234!',
    displayName: 'Test Solo',
  },
};

/**
 * Generate unique test user for isolation
 */
export function generateTestUser(role: 'parent' | 'child' | 'partner' | 'solo' = 'parent') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `${role}-${timestamp}-${random}@test.com`,
    password: 'Test1234!',
    displayName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
  };
}

/**
 * Test data for chores
 */
export const TEST_CHORES = {
  easy: {
    title: 'Geschirrspüler ausräumen',
    description: 'Geschirr aus dem Geschirrspüler ausräumen',
    difficulty: 'easy' as const,
    points: 10,
  },
  medium: {
    title: 'Wäsche aufhängen',
    description: 'Frische Wäsche auf die Leine hängen',
    difficulty: 'medium' as const,
    points: 20,
  },
  hard: {
    title: 'Bad putzen',
    description: 'Badezimmer komplett reinigen',
    difficulty: 'hard' as const,
    points: 50,
  },
  recurring: {
    title: 'Müll rausbringen',
    description: 'Mülltonnen an die Straße stellen',
    difficulty: 'easy' as const,
    points: 10,
    recurrence: 'weekly' as const,
  },
};

/**
 * Test data for rewards
 */
export const TEST_REWARDS = {
  cinema: {
    title: 'Kino',
    description: 'Ins Kino gehen',
    pointsCost: 100,
  },
  iceCream: {
    title: 'Eis essen',
    description: 'Eis beim Eisladen kaufen',
    pointsCost: 50,
  },
  allowance: {
    title: 'Taschengeld',
    description: 'Extra Taschengeld',
    pointsCost: 200,
  },
};

/**
 * Test household data
 */
export const TEST_HOUSEHOLD = {
  name: 'Familie Müller',
  inviteCode: '', // Will be populated after household creation
};