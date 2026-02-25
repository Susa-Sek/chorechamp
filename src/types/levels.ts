// Shared types for gamification levels and badges system
// Can be reused in React Native mobile app

export type BadgeCategory = "completion" | "streak" | "points" | "special";

export interface BadgeCriteria {
  type: "chores_completed" | "streak_days" | "total_points" | "special";
  value: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  criteria: BadgeCriteria;
  icon: string;
  pointsReward: number;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  // Joined data
  badge?: BadgeDefinition;
}

export interface BadgeProgress {
  id: string;
  userId: string;
  badgeId: string;
  currentValue: number;
  updatedAt: string;
  // Joined data
  badge?: BadgeDefinition;
}

export interface UserLevel {
  id: string;
  userId: string;
  currentLevel: number;
  totalPoints: number;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  currentLevel: number;
  totalPoints: number;
  totalChoresCompleted: number;
  memberSince: string;
  badges: UserBadge[];
}

// Level definitions
export interface LevelDefinition {
  level: number;
  pointsRequired: number;
  title: string;
}

// Static level definitions based on spec
export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, pointsRequired: 0, title: "Neuling" },
  { level: 2, pointsRequired: 100, title: "Helfer" },
  { level: 3, pointsRequired: 300, title: "Mitgestalter" },
  { level: 4, pointsRequired: 600, title: "Erfolgreicher" },
  { level: 5, pointsRequired: 1000, title: "Champion" },
  { level: 6, pointsRequired: 1500, title: "Experte" },
  { level: 7, pointsRequired: 2500, title: "Meister" },
  { level: 8, pointsRequired: 4000, title: "Legende" },
  { level: 9, pointsRequired: 6000, title: "Held" },
  { level: 10, pointsRequired: 10000, title: "ChoreChamp" },
];

// Helper function to get level from points
export function getLevelFromPoints(points: number): LevelDefinition {
  let currentLevel = LEVEL_DEFINITIONS[0];

  for (const level of LEVEL_DEFINITIONS) {
    if (points >= level.pointsRequired) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
}

// Helper function to get next level
export function getNextLevel(currentLevel: number): LevelDefinition | null {
  const nextLevelIndex = LEVEL_DEFINITIONS.findIndex((l) => l.level === currentLevel) + 1;
  return LEVEL_DEFINITIONS[nextLevelIndex] || null;
}

// Helper function to calculate progress percentage to next level
export function calculateLevelProgress(
  currentPoints: number,
  currentLevelPoints: number,
  nextLevelPoints: number
): number {
  if (nextLevelPoints === currentLevelPoints) return 100;
  const progress = ((currentPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

// Badge category labels in German
export const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
  completion: "Aufgaben",
  streak: "Serie",
  points: "Punkte",
  special: "Spezial",
};

// Default badge icons (used if database icon is empty)
export const DEFAULT_BADGE_ICONS: Record<BadgeCategory, string> = {
  completion: "trophy",
  streak: "flame",
  points: "star",
  special: "sparkles",
};