/**
 * ChoreChamp E2E User Journey Definitions
 *
 * Complete test coverage for all ChoreChamp features:
 * - PROJ-1: User Authentication
 * - PROJ-2: Household Management
 * - PROJ-3: Chore Management
 * - PROJ-4: Recurring Tasks
 * - PROJ-5: Gamification - Points
 * - PROJ-6: Gamification - Rewards
 * - PROJ-7: Gamification - Levels & Badges
 * - PROJ-8: User Onboarding
 */

export interface JourneyStep {
  id: string;
  name: string;
  action: 'navigate' | 'click' | 'type' | 'select' | 'verify' | 'wait' | 'fill_form' | 'screenshot' | 'evaluate' | 'hover' | 'drag';
  target?: string;
  value?: string;
  expected?: string;
  screenshot?: boolean;
  timeout?: number;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
  category: 'auth' | 'household' | 'chores' | 'gamification' | 'profile' | 'smoke';
  feature: string;
  steps: JourneyStep[];
}

/**
 * ChoreChamp User Journeys
 */
export const journeys: Journey[] = [
  // ============================================
  // UJ-CC-1: Registration & Onboarding (PROJ-1, PROJ-8)
  // ============================================
  {
    id: 'UJ-CC-1',
    name: 'Registration & Onboarding',
    description: 'Complete user registration and automatic profile setup',
    category: 'auth',
    feature: 'PROJ-1, PROJ-8',
    steps: [
      {
        id: 'UJ-CC-1.1',
        name: 'Navigate to landing page',
        action: 'navigate',
        target: '/',
        screenshot: true
      },
      {
        id: 'UJ-CC-1.2',
        name: 'Click Register button',
        action: 'click',
        target: 'Registrieren, Register, Sign Up',
        screenshot: true
      },
      {
        id: 'UJ-CC-1.3',
        name: 'Enter name',
        action: 'type',
        target: 'Name, Dein Name',
        value: 'Test Elternteil',
        screenshot: false
      },
      {
        id: 'UJ-CC-1.4',
        name: 'Enter email',
        action: 'type',
        target: 'Email, E-Mail',
        value: 'test-elternteil@example.com',
        screenshot: false
      },
      {
        id: 'UJ-CC-1.5',
        name: 'Enter password',
        action: 'type',
        target: 'Passwort, Password',
        value: 'TestPassword123!',
        screenshot: false
      },
      {
        id: 'UJ-CC-1.6',
        name: 'Confirm password',
        action: 'type',
        target: 'Passwort bestätigen, Confirm Password',
        value: 'TestPassword123!',
        screenshot: false
      },
      {
        id: 'UJ-CC-1.7',
        name: 'Submit registration',
        action: 'click',
        target: 'Registrieren, Konto erstellen, Create Account',
        screenshot: true
      },
      {
        id: 'UJ-CC-1.8',
        name: 'Wait for redirect',
        action: 'wait',
        target: 'navigation',
        timeout: 5000,
        screenshot: false
      },
      {
        id: 'UJ-CC-1.9',
        name: 'Verify redirect to dashboard or household create',
        action: 'verify',
        expected: '/dashboard or /household/create',
        screenshot: true
      },
      {
        id: 'UJ-CC-1.10',
        name: 'Verify profile was auto-created',
        action: 'evaluate',
        target: 'profile',
        value: 'exists',
        screenshot: false
      }
    ]
  },

  // ============================================
  // UJ-CC-2: Login Flow (PROJ-1)
  // ============================================
  {
    id: 'UJ-CC-2',
    name: 'Login Flow',
    description: 'User login with email and password',
    category: 'auth',
    feature: 'PROJ-1',
    steps: [
      {
        id: 'UJ-CC-2.1',
        name: 'Navigate to landing page',
        action: 'navigate',
        target: '/',
        screenshot: true
      },
      {
        id: 'UJ-CC-2.2',
        name: 'Click Login button',
        action: 'click',
        target: 'Anmelden, Login, Sign In',
        screenshot: true
      },
      {
        id: 'UJ-CC-2.3',
        name: 'Enter email',
        action: 'type',
        target: 'Email, E-Mail',
        value: 'test-elternteil@example.com',
        screenshot: false
      },
      {
        id: 'UJ-CC-2.4',
        name: 'Enter password',
        action: 'type',
        target: 'Passwort, Password',
        value: 'TestPassword123!',
        screenshot: false
      },
      {
        id: 'UJ-CC-2.5',
        name: 'Submit login',
        action: 'click',
        target: 'Anmelden, Login, Sign In',
        screenshot: true
      },
      {
        id: 'UJ-CC-2.6',
        name: 'Wait for redirect',
        action: 'wait',
        target: 'navigation',
        timeout: 5000,
        screenshot: false
      },
      {
        id: 'UJ-CC-2.7',
        name: 'Verify redirect to dashboard',
        action: 'verify',
        expected: '/dashboard',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-3: Password Reset (PROJ-1)
  // ============================================
  {
    id: 'UJ-CC-3',
    name: 'Password Reset Flow',
    description: 'Request password reset email',
    category: 'auth',
    feature: 'PROJ-1',
    steps: [
      {
        id: 'UJ-CC-3.1',
        name: 'Navigate to login page',
        action: 'navigate',
        target: '/auth/login',
        screenshot: true
      },
      {
        id: 'UJ-CC-3.2',
        name: 'Click forgot password link',
        action: 'click',
        target: 'Passwort vergessen, Forgot Password',
        screenshot: true
      },
      {
        id: 'UJ-CC-3.3',
        name: 'Enter email for reset',
        action: 'type',
        target: 'Email, E-Mail',
        value: 'test-elternteil@example.com',
        screenshot: false
      },
      {
        id: 'UJ-CC-3.4',
        name: 'Submit reset request',
        action: 'click',
        target: 'Zurücksetzen, Reset, Send',
        screenshot: true
      },
      {
        id: 'UJ-CC-3.5',
        name: 'Verify success message',
        action: 'verify',
        expected: 'email-sent-message',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-4: Household Creation (PROJ-2)
  // ============================================
  {
    id: 'UJ-CC-4',
    name: 'Household Creation',
    description: 'Create a new household and become admin',
    category: 'household',
    feature: 'PROJ-2',
    steps: [
      {
        id: 'UJ-CC-4.1',
        name: 'Login as test user',
        action: 'navigate',
        target: '/auth/login',
        screenshot: false
      },
      {
        id: 'UJ-CC-4.2',
        name: 'Navigate to create household',
        action: 'navigate',
        target: '/household/create',
        screenshot: true
      },
      {
        id: 'UJ-CC-4.3',
        name: 'Enter household name',
        action: 'type',
        target: 'Haushaltsname, Household Name, Name',
        value: 'Test Familie Müller',
        screenshot: false
      },
      {
        id: 'UJ-CC-4.4',
        name: 'Enter description (optional)',
        action: 'type',
        target: 'Beschreibung, Description',
        value: 'Unsere Test-WG für E2E Tests',
        screenshot: false
      },
      {
        id: 'UJ-CC-4.5',
        name: 'Submit household creation',
        action: 'click',
        target: 'Erstellen, Create, Speichern',
        screenshot: true
      },
      {
        id: 'UJ-CC-4.6',
        name: 'Wait for redirect',
        action: 'wait',
        target: 'navigation',
        timeout: 3000,
        screenshot: false
      },
      {
        id: 'UJ-CC-4.7',
        name: 'Verify household created',
        action: 'verify',
        expected: '/household or /dashboard',
        screenshot: true
      },
      {
        id: 'UJ-CC-4.8',
        name: 'Verify invite code visible',
        action: 'verify',
        target: 'Einladungscode, Invite Code',
        expected: 'visible',
        screenshot: true
      },
      {
        id: 'UJ-CC-4.9',
        name: 'Copy invite code',
        action: 'click',
        target: 'Kopieren, Copy',
        screenshot: false
      }
    ]
  },

  // ============================================
  // UJ-CC-5: Household Join (PROJ-2)
  // ============================================
  {
    id: 'UJ-CC-5',
    name: 'Household Join',
    description: 'Join an existing household via invite code',
    category: 'household',
    feature: 'PROJ-2',
    steps: [
      {
        id: 'UJ-CC-5.1',
        name: 'Login as different user',
        action: 'navigate',
        target: '/auth/login',
        screenshot: false
      },
      {
        id: 'UJ-CC-5.2',
        name: 'Navigate to join household',
        action: 'navigate',
        target: '/household/join',
        screenshot: true
      },
      {
        id: 'UJ-CC-5.3',
        name: 'Enter invite code',
        action: 'type',
        target: 'Einladungscode, Invite Code, Code',
        value: 'TEST-CODE-123',
        screenshot: false
      },
      {
        id: 'UJ-CC-5.4',
        name: 'Submit join request',
        action: 'click',
        target: 'Beitreten, Join',
        screenshot: true
      },
      {
        id: 'UJ-CC-5.5',
        name: 'Wait for redirect',
        action: 'wait',
        target: 'navigation',
        timeout: 3000,
        screenshot: false
      },
      {
        id: 'UJ-CC-5.6',
        name: 'Verify joined household',
        action: 'verify',
        expected: '/dashboard with household',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-6: Household Management (PROJ-2)
  // ============================================
  {
    id: 'UJ-CC-6',
    name: 'Household Management',
    description: 'View household members and manage settings',
    category: 'household',
    feature: 'PROJ-2',
    steps: [
      {
        id: 'UJ-CC-6.1',
        name: 'Navigate to household page',
        action: 'navigate',
        target: '/household',
        screenshot: true
      },
      {
        id: 'UJ-CC-6.2',
        name: 'Verify household name visible',
        action: 'verify',
        target: 'Haushaltsname',
        expected: 'visible',
        screenshot: false
      },
      {
        id: 'UJ-CC-6.3',
        name: 'Verify members list visible',
        action: 'verify',
        target: 'Mitglieder, Members',
        expected: 'visible',
        screenshot: true
      },
      {
        id: 'UJ-CC-6.4',
        name: 'Verify invite code displayed',
        action: 'verify',
        target: 'Einladungscode',
        expected: 'visible',
        screenshot: false
      },
      {
        id: 'UJ-CC-6.5',
        name: 'Click on member profile',
        action: 'click',
        target: 'member-item, member-card',
        screenshot: true
      },
      {
        id: 'UJ-CC-6.6',
        name: 'View member details',
        action: 'verify',
        expected: 'member-profile-modal-or-page',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-7: Create Chore (PROJ-3, PROJ-4)
  // ============================================
  {
    id: 'UJ-CC-7',
    name: 'Create Chore',
    description: 'Create a new chore with recurring schedule',
    category: 'chores',
    feature: 'PROJ-3, PROJ-4',
    steps: [
      {
        id: 'UJ-CC-7.1',
        name: 'Navigate to chores page',
        action: 'navigate',
        target: '/chores',
        screenshot: true
      },
      {
        id: 'UJ-CC-7.2',
        name: 'Click create new chore',
        action: 'click',
        target: 'Neue Aufgabe, New Chore, Add, +',
        screenshot: true
      },
      {
        id: 'UJ-CC-7.3',
        name: 'Enter chore title',
        action: 'type',
        target: 'Titel, Title, Name',
        value: 'Geschirrspüler ausräumen',
        screenshot: false
      },
      {
        id: 'UJ-CC-7.4',
        name: 'Enter description',
        action: 'type',
        target: 'Beschreibung, Description',
        value: 'Alle Teller und Gläser in den Schrank räumen',
        screenshot: false
      },
      {
        id: 'UJ-CC-7.5',
        name: 'Select difficulty/points',
        action: 'select',
        target: 'Schwierigkeit, Difficulty, Points',
        value: 'medium',
        screenshot: false
      },
      {
        id: 'UJ-CC-7.6',
        name: 'Set as recurring',
        action: 'click',
        target: 'Wiederkehrend, Recurring',
        screenshot: false
      },
      {
        id: 'UJ-CC-7.7',
        name: 'Select recurrence pattern',
        action: 'select',
        target: 'Wiederholung, Repeat',
        value: 'weekly',
        screenshot: true
      },
      {
        id: 'UJ-CC-7.8',
        name: 'Assign to member',
        action: 'select',
        target: 'Zugewiesen an, Assigned to',
        value: 'Test Kind',
        screenshot: false
      },
      {
        id: 'UJ-CC-7.9',
        name: 'Submit chore creation',
        action: 'click',
        target: 'Erstellen, Create, Speichern',
        screenshot: true
      },
      {
        id: 'UJ-CC-7.10',
        name: 'Verify chore appears in list',
        action: 'verify',
        expected: 'chore-in-list',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-8: View & Edit Chore (PROJ-3)
  // ============================================
  {
    id: 'UJ-CC-8',
    name: 'View & Edit Chore',
    description: 'View chore details and edit',
    category: 'chores',
    feature: 'PROJ-3',
    steps: [
      {
        id: 'UJ-CC-8.1',
        name: 'Navigate to chores page',
        action: 'navigate',
        target: '/chores',
        screenshot: true
      },
      {
        id: 'UJ-CC-8.2',
        name: 'Click on a chore',
        action: 'click',
        target: 'chore-item, chore-card',
        screenshot: true
      },
      {
        id: 'UJ-CC-8.3',
        name: 'Verify chore details visible',
        action: 'verify',
        expected: 'chore-detail-page',
        screenshot: true
      },
      {
        id: 'UJ-CC-8.4',
        name: 'Click edit button',
        action: 'click',
        target: 'Bearbeiten, Edit',
        screenshot: true
      },
      {
        id: 'UJ-CC-8.5',
        name: 'Update chore title',
        action: 'type',
        target: 'Titel, Title',
        value: 'Geschirrspüler ausräumen (aktualisiert)',
        screenshot: false
      },
      {
        id: 'UJ-CC-8.6',
        name: 'Save changes',
        action: 'click',
        target: 'Speichern, Save',
        screenshot: true
      },
      {
        id: 'UJ-CC-8.7',
        name: 'Verify changes saved',
        action: 'verify',
        expected: 'updated-chore',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-9: Complete Chore & Earn Points (PROJ-3, PROJ-5)
  // ============================================
  {
    id: 'UJ-CC-9',
    name: 'Complete Chore & Earn Points',
    description: 'Mark chore as complete and verify points earned',
    category: 'chores',
    feature: 'PROJ-3, PROJ-5',
    steps: [
      {
        id: 'UJ-CC-9.1',
        name: 'Navigate to chores page',
        action: 'navigate',
        target: '/chores',
        screenshot: true
      },
      {
        id: 'UJ-CC-9.2',
        name: 'Record initial points',
        action: 'evaluate',
        target: 'points',
        value: 'get-current',
        screenshot: false
      },
      {
        id: 'UJ-CC-9.3',
        name: 'Click complete on a chore',
        action: 'click',
        target: 'Erledigt, Complete, Done',
        screenshot: true
      },
      {
        id: 'UJ-CC-9.4',
        name: 'Verify completion confirmation',
        action: 'verify',
        expected: 'success-message-or-checkmark',
        screenshot: true
      },
      {
        id: 'UJ-CC-9.5',
        name: 'Verify points increased',
        action: 'evaluate',
        target: 'points',
        value: 'verify-increased',
        screenshot: false
      },
      {
        id: 'UJ-CC-9.6',
        name: 'Navigate to points history',
        action: 'navigate',
        target: '/points/history',
        screenshot: true
      },
      {
        id: 'UJ-CC-9.7',
        name: 'Verify point transaction recorded',
        action: 'verify',
        expected: 'new-point-entry',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-10: Delete Chore (PROJ-3)
  // ============================================
  {
    id: 'UJ-CC-10',
    name: 'Delete Chore',
    description: 'Delete a chore and verify removal',
    category: 'chores',
    feature: 'PROJ-3',
    steps: [
      {
        id: 'UJ-CC-10.1',
        name: 'Navigate to chores page',
        action: 'navigate',
        target: '/chores',
        screenshot: true
      },
      {
        id: 'UJ-CC-10.2',
        name: 'Click on a chore to delete',
        action: 'click',
        target: 'chore-item',
        screenshot: false
      },
      {
        id: 'UJ-CC-10.3',
        name: 'Click delete button',
        action: 'click',
        target: 'Löschen, Delete',
        screenshot: true
      },
      {
        id: 'UJ-CC-10.4',
        name: 'Confirm deletion',
        action: 'click',
        target: 'Bestätigen, Confirm, Ja, Yes',
        screenshot: true
      },
      {
        id: 'UJ-CC-10.5',
        name: 'Verify chore removed from list',
        action: 'verify',
        expected: 'chore-removed',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-11: Create Reward (PROJ-6)
  // ============================================
  {
    id: 'UJ-CC-11',
    name: 'Create Reward',
    description: 'Create a new reward that can be redeemed',
    category: 'gamification',
    feature: 'PROJ-6',
    steps: [
      {
        id: 'UJ-CC-11.1',
        name: 'Navigate to rewards page',
        action: 'navigate',
        target: '/rewards',
        screenshot: true
      },
      {
        id: 'UJ-CC-11.2',
        name: 'Click create new reward',
        action: 'click',
        target: 'Neue Belohnung, New Reward, Add, +',
        screenshot: true
      },
      {
        id: 'UJ-CC-11.3',
        name: 'Enter reward title',
        action: 'type',
        target: 'Titel, Title, Name',
        value: 'Kinoabend',
        screenshot: false
      },
      {
        id: 'UJ-CC-11.4',
        name: 'Enter description',
        action: 'type',
        target: 'Beschreibung, Description',
        value: 'Ein Film nach Wahl im Kino',
        screenshot: false
      },
      {
        id: 'UJ-CC-11.5',
        name: 'Set point cost',
        action: 'type',
        target: 'Punkte, Points, Kosten',
        value: '500',
        screenshot: false
      },
      {
        id: 'UJ-CC-11.6',
        name: 'Submit reward creation',
        action: 'click',
        target: 'Erstellen, Create, Speichern',
        screenshot: true
      },
      {
        id: 'UJ-CC-11.7',
        name: 'Verify reward appears in list',
        action: 'verify',
        expected: 'reward-in-list',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-12: Redeem Reward (PROJ-6)
  // ============================================
  {
    id: 'UJ-CC-12',
    name: 'Redeem Reward',
    description: 'Redeem points for a reward',
    category: 'gamification',
    feature: 'PROJ-6',
    steps: [
      {
        id: 'UJ-CC-12.1',
        name: 'Navigate to rewards page',
        action: 'navigate',
        target: '/rewards',
        screenshot: true
      },
      {
        id: 'UJ-CC-12.2',
        name: 'Record current points',
        action: 'evaluate',
        target: 'points',
        value: 'get-current',
        screenshot: false
      },
      {
        id: 'UJ-CC-12.3',
        name: 'Click on a reward',
        action: 'click',
        target: 'reward-item, reward-card',
        screenshot: true
      },
      {
        id: 'UJ-CC-12.4',
        name: 'Click redeem button',
        action: 'click',
        target: 'Einlösen, Redeem',
        screenshot: true
      },
      {
        id: 'UJ-CC-12.5',
        name: 'Confirm redemption',
        action: 'click',
        target: 'Bestätigen, Confirm',
        screenshot: true
      },
      {
        id: 'UJ-CC-12.6',
        name: 'Verify success message',
        action: 'verify',
        expected: 'success-message',
        screenshot: true
      },
      {
        id: 'UJ-CC-12.7',
        name: 'Verify points deducted',
        action: 'evaluate',
        target: 'points',
        value: 'verify-decreased',
        screenshot: false
      },
      {
        id: 'UJ-CC-12.8',
        name: 'Navigate to redemptions',
        action: 'navigate',
        target: '/redemptions',
        screenshot: true
      },
      {
        id: 'UJ-CC-12.9',
        name: 'Verify redemption recorded',
        action: 'verify',
        expected: 'redemption-in-list',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-13: Process Redemption (PROJ-6)
  // ============================================
  {
    id: 'UJ-CC-13',
    name: 'Process Redemption',
    description: 'Admin approves/completes a redemption request',
    category: 'gamification',
    feature: 'PROJ-6',
    steps: [
      {
        id: 'UJ-CC-13.1',
        name: 'Navigate to household redemptions',
        action: 'navigate',
        target: '/household/redemptions',
        screenshot: true
      },
      {
        id: 'UJ-CC-13.2',
        name: 'Verify redemption list visible',
        action: 'verify',
        expected: 'redemptions-list',
        screenshot: true
      },
      {
        id: 'UJ-CC-13.3',
        name: 'Click on pending redemption',
        action: 'click',
        target: 'pending-redemption',
        screenshot: false
      },
      {
        id: 'UJ-CC-13.4',
        name: 'Approve redemption',
        action: 'click',
        target: 'Genehmigen, Approve',
        screenshot: true
      },
      {
        id: 'UJ-CC-13.5',
        name: 'Verify status changed',
        action: 'verify',
        expected: 'approved-status',
        screenshot: true
      },
      {
        id: 'UJ-CC-13.6',
        name: 'Mark as fulfilled',
        action: 'click',
        target: 'Erfüllt, Fulfilled, Complete',
        screenshot: true
      },
      {
        id: 'UJ-CC-13.7',
        name: 'Verify final status',
        action: 'verify',
        expected: 'fulfilled-status',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-14: View Badges & Levels (PROJ-7)
  // ============================================
  {
    id: 'UJ-CC-14',
    name: 'View Badges & Levels',
    description: 'View earned badges and level progress',
    category: 'gamification',
    feature: 'PROJ-7',
    steps: [
      {
        id: 'UJ-CC-14.1',
        name: 'Navigate to badges page',
        action: 'navigate',
        target: '/badges',
        screenshot: true
      },
      {
        id: 'UJ-CC-14.2',
        name: 'Verify badges grid visible',
        action: 'verify',
        expected: 'badges-grid',
        screenshot: true
      },
      {
        id: 'UJ-CC-14.3',
        name: 'Click on a badge',
        action: 'click',
        target: 'badge-item',
        screenshot: false
      },
      {
        id: 'UJ-CC-14.4',
        name: 'View badge details',
        action: 'verify',
        expected: 'badge-details',
        screenshot: true
      },
      {
        id: 'UJ-CC-14.5',
        name: 'Navigate to profile',
        action: 'navigate',
        target: '/profile',
        screenshot: true
      },
      {
        id: 'UJ-CC-14.6',
        name: 'Verify level displayed',
        action: 'verify',
        target: 'Level',
        expected: 'visible',
        screenshot: true
      },
      {
        id: 'UJ-CC-14.7',
        name: 'Verify XP/points progress',
        action: 'verify',
        target: 'XP, Punkte, Progress',
        expected: 'visible',
        screenshot: false
      }
    ]
  },

  // ============================================
  // UJ-CC-15: Statistics Dashboard
  // ============================================
  {
    id: 'UJ-CC-15',
    name: 'Statistics Dashboard',
    description: 'View personal and household statistics',
    category: 'profile',
    feature: 'Core',
    steps: [
      {
        id: 'UJ-CC-15.1',
        name: 'Navigate to statistics page',
        action: 'navigate',
        target: '/statistics',
        screenshot: true
      },
      {
        id: 'UJ-CC-15.2',
        name: 'Verify personal stats visible',
        action: 'verify',
        expected: 'personal-statistics',
        screenshot: true
      },
      {
        id: 'UJ-CC-15.3',
        name: 'Verify household stats visible',
        action: 'verify',
        expected: 'household-statistics',
        screenshot: false
      },
      {
        id: 'UJ-CC-15.4',
        name: 'Verify leaderboard visible',
        action: 'verify',
        target: 'Leaderboard, Rangliste',
        expected: 'visible',
        screenshot: true
      },
      {
        id: 'UJ-CC-15.5',
        name: 'Check completed chores chart',
        action: 'verify',
        expected: 'chart-or-graph',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-16: Profile Management
  // ============================================
  {
    id: 'UJ-CC-16',
    name: 'Profile Management',
    description: 'View and update profile settings',
    category: 'profile',
    feature: 'Core',
    steps: [
      {
        id: 'UJ-CC-16.1',
        name: 'Navigate to profile page',
        action: 'navigate',
        target: '/profile',
        screenshot: true
      },
      {
        id: 'UJ-CC-16.2',
        name: 'Verify profile info visible',
        action: 'verify',
        expected: 'profile-details',
        screenshot: true
      },
      {
        id: 'UJ-CC-16.3',
        name: 'Click edit profile',
        action: 'click',
        target: 'Bearbeiten, Edit',
        screenshot: true
      },
      {
        id: 'UJ-CC-16.4',
        name: 'Update display name',
        action: 'type',
        target: 'Name, Display Name',
        value: 'Test Elternteil Updated',
        screenshot: false
      },
      {
        id: 'UJ-CC-16.5',
        name: 'Save changes',
        action: 'click',
        target: 'Speichern, Save',
        screenshot: true
      },
      {
        id: 'UJ-CC-16.6',
        name: 'Verify changes saved',
        action: 'verify',
        expected: 'updated-profile',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-17: Settings
  // ============================================
  {
    id: 'UJ-CC-17',
    name: 'Settings',
    description: 'View and modify app settings',
    category: 'profile',
    feature: 'Core',
    steps: [
      {
        id: 'UJ-CC-17.1',
        name: 'Navigate to settings page',
        action: 'navigate',
        target: '/settings',
        screenshot: true
      },
      {
        id: 'UJ-CC-17.2',
        name: 'Verify settings sections visible',
        action: 'verify',
        expected: 'settings-list',
        screenshot: true
      },
      {
        id: 'UJ-CC-17.3',
        name: 'Toggle notification setting',
        action: 'click',
        target: 'Benachrichtigungen, Notifications',
        screenshot: true
      },
      {
        id: 'UJ-CC-17.4',
        name: 'Verify setting saved',
        action: 'verify',
        expected: 'setting-updated',
        screenshot: false
      }
    ]
  },

  // ============================================
  // UJ-CC-18: Logout Flow (PROJ-1)
  // ============================================
  {
    id: 'UJ-CC-18',
    name: 'Logout Flow',
    description: 'Sign out of the application',
    category: 'auth',
    feature: 'PROJ-1',
    steps: [
      {
        id: 'UJ-CC-18.1',
        name: 'Navigate to dashboard',
        action: 'navigate',
        target: '/dashboard',
        screenshot: true
      },
      {
        id: 'UJ-CC-18.2',
        name: 'Click user menu or settings',
        action: 'click',
        target: 'user-menu, profile-button, avatar',
        screenshot: true
      },
      {
        id: 'UJ-CC-18.3',
        name: 'Click logout button',
        action: 'click',
        target: 'Abmelden, Logout, Sign Out',
        screenshot: true
      },
      {
        id: 'UJ-CC-18.4',
        name: 'Wait for redirect',
        action: 'wait',
        target: 'navigation',
        timeout: 3000,
        screenshot: false
      },
      {
        id: 'UJ-CC-18.5',
        name: 'Verify redirect to landing/login',
        action: 'verify',
        expected: '/ or /auth/login',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-19: Complete Family Scenario (Integration)
  // ============================================
  {
    id: 'UJ-CC-19',
    name: 'Complete Family Scenario',
    description: 'End-to-end: Parent creates household, child joins, completes chores, earns reward',
    category: 'smoke',
    feature: 'ALL',
    steps: [
      // Parent setup
      {
        id: 'UJ-CC-19.1',
        name: 'Parent: Register account',
        action: 'navigate',
        target: '/auth/register',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.2',
        name: 'Parent: Fill registration form',
        action: 'fill_form',
        target: 'register-form',
        value: 'name=Test Elternteil,email=parent-e2e@example.com,password=E2ETest123!',
        screenshot: false
      },
      {
        id: 'UJ-CC-19.3',
        name: 'Parent: Submit registration',
        action: 'click',
        target: 'Registrieren',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.4',
        name: 'Parent: Create household',
        action: 'navigate',
        target: '/household/create',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.5',
        name: 'Parent: Fill household form',
        action: 'fill_form',
        target: 'household-form',
        value: 'name=Test Familie E2E',
        screenshot: false
      },
      {
        id: 'UJ-CC-19.6',
        name: 'Parent: Submit household',
        action: 'click',
        target: 'Erstellen',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.7',
        name: 'Parent: Get invite code',
        action: 'evaluate',
        target: 'invite-code',
        value: 'get-text',
        screenshot: true
      },
      // Create chore
      {
        id: 'UJ-CC-19.8',
        name: 'Parent: Create chore',
        action: 'navigate',
        target: '/chores/new',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.9',
        name: 'Parent: Fill chore form',
        action: 'fill_form',
        target: 'chore-form',
        value: 'title=E2E Test Aufgabe,description=Test description,points=100',
        screenshot: false
      },
      {
        id: 'UJ-CC-19.10',
        name: 'Parent: Submit chore',
        action: 'click',
        target: 'Erstellen',
        screenshot: true
      },
      // Create reward
      {
        id: 'UJ-CC-19.11',
        name: 'Parent: Create reward',
        action: 'navigate',
        target: '/rewards/create',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.12',
        name: 'Parent: Fill reward form',
        action: 'fill_form',
        target: 'reward-form',
        value: 'title=E2E Belohnung,description=Test belohnung,cost=50',
        screenshot: false
      },
      {
        id: 'UJ-CC-19.13',
        name: 'Parent: Submit reward',
        action: 'click',
        target: 'Erstellen',
        screenshot: true
      },
      // Child joins and completes chore
      {
        id: 'UJ-CC-19.14',
        name: 'Child: Register (new session)',
        action: 'evaluate',
        target: 'new-session',
        value: 'register',
        screenshot: false
      },
      {
        id: 'UJ-CC-19.15',
        name: 'Child: Join household with code',
        action: 'navigate',
        target: '/household/join',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.16',
        name: 'Child: Enter invite code',
        action: 'type',
        target: 'Einladungscode',
        value: 'INVOKE_FROM_19.7',
        screenshot: false
      },
      {
        id: 'UJ-CC-19.17',
        name: 'Child: Complete chore',
        action: 'navigate',
        target: '/chores',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.18',
        name: 'Child: Click complete',
        action: 'click',
        target: 'Erledigt',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.19',
        name: 'Child: Verify points earned',
        action: 'verify',
        expected: 'points-increased',
        screenshot: true
      },
      // Redeem reward
      {
        id: 'UJ-CC-19.20',
        name: 'Child: Navigate to rewards',
        action: 'navigate',
        target: '/rewards',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.21',
        name: 'Child: Redeem reward',
        action: 'click',
        target: 'Einlösen',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.22',
        name: 'Child: Verify redemption',
        action: 'verify',
        expected: 'redemption-success',
        screenshot: true
      },
      // Parent approves
      {
        id: 'UJ-CC-19.23',
        name: 'Parent: View redemptions',
        action: 'navigate',
        target: '/household/redemptions',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.24',
        name: 'Parent: Approve redemption',
        action: 'click',
        target: 'Genehmigen',
        screenshot: true
      },
      {
        id: 'UJ-CC-19.25',
        name: 'Verify complete flow success',
        action: 'verify',
        expected: 'all-steps-completed',
        screenshot: true
      }
    ]
  },

  // ============================================
  // UJ-CC-20: Dashboard Overview
  // ============================================
  {
    id: 'UJ-CC-20',
    name: 'Dashboard Overview',
    description: 'View dashboard with all key information',
    category: 'smoke',
    feature: 'Core',
    steps: [
      {
        id: 'UJ-CC-20.1',
        name: 'Navigate to dashboard',
        action: 'navigate',
        target: '/dashboard',
        screenshot: true
      },
      {
        id: 'UJ-CC-20.2',
        name: 'Verify welcome message',
        action: 'verify',
        target: 'Willkommen, Hallo, Welcome',
        expected: 'visible',
        screenshot: false
      },
      {
        id: 'UJ-CC-20.3',
        name: 'Verify points summary',
        action: 'verify',
        target: 'Punkte, Points',
        expected: 'visible',
        screenshot: true
      },
      {
        id: 'UJ-CC-20.4',
        name: 'Verify level display',
        action: 'verify',
        target: 'Level',
        expected: 'visible',
        screenshot: false
      },
      {
        id: 'UJ-CC-20.5',
        name: 'Verify upcoming chores',
        action: 'verify',
        expected: 'chores-section',
        screenshot: true
      },
      {
        id: 'UJ-CC-20.6',
        name: 'Verify available rewards',
        action: 'verify',
        expected: 'rewards-section',
        screenshot: false
      },
      {
        id: 'UJ-CC-20.7',
        name: 'Verify leaderboard preview',
        action: 'verify',
        expected: 'leaderboard-section',
        screenshot: true
      }
    ]
  }
];

/**
 * Get journey by ID
 */
export function getJourney(id: string): Journey | undefined {
  return journeys.find(j => j.id === id);
}

/**
 * Get all journeys
 */
export function getAllJourneys(): Journey[] {
  return journeys;
}

/**
 * Get journeys by category
 */
export function getJourneysByCategory(category: Journey['category']): Journey[] {
  return journeys.filter(j => j.category === category);
}

/**
 * Get journeys by feature
 */
export function getJourneysByFeature(feature: string): Journey[] {
  return journeys.filter(j => j.feature.includes(feature));
}

/**
 * Journey execution result
 */
export interface JourneyResult {
  journeyId: string;
  journeyName: string;
  startTime: string;
  endTime: string;
  duration: string;
  totalSteps: number;
  passed: number;
  failed: number;
  skipped: number;
  steps: StepResult[];
  screenshots: string[];
  consoleErrors: string[];
}

export interface StepResult {
  stepId: string;
  stepName: string;
  action: string;
  status: 'passed' | 'failed' | 'skipped';
  screenshot?: string;
  error?: string;
  duration: number;
}

/**
 * Feature Coverage Summary
 */
export const featureCoverage = {
  'PROJ-1': ['UJ-CC-1', 'UJ-CC-2', 'UJ-CC-3', 'UJ-CC-18'],
  'PROJ-2': ['UJ-CC-4', 'UJ-CC-5', 'UJ-CC-6'],
  'PROJ-3': ['UJ-CC-7', 'UJ-CC-8', 'UJ-CC-9', 'UJ-CC-10'],
  'PROJ-4': ['UJ-CC-7'],
  'PROJ-5': ['UJ-CC-9'],
  'PROJ-6': ['UJ-CC-11', 'UJ-CC-12', 'UJ-CC-13'],
  'PROJ-7': ['UJ-CC-14'],
  'PROJ-8': ['UJ-CC-1'],
};