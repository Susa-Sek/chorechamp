// Shared types for chore management
// Can be reused in React Native mobile app

export type ChoreDifficulty = "easy" | "medium" | "hard";
export type ChoreStatus = "pending" | "completed" | "archived";

export interface Chore {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  createdBy: string;
  points: number;
  difficulty: ChoreDifficulty;
  dueDate: string | null;
  status: ChoreStatus;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  assignee?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  creator?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  completer?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

export interface ChoreCompletion {
  id: string;
  choreId: string;
  userId: string;
  completedAt: string;
  pointsAwarded: number;
  undoneAt: string | null;
  undoneBy: string | null;
}

export interface ChoreListFilters {
  status?: ChoreStatus | "all";
  assigneeId?: string;
  difficulty?: ChoreDifficulty | "all";
  search?: string;
}

export interface ChoreListSort {
  field: "dueDate" | "createdAt" | "points" | "difficulty" | "title";
  direction: "asc" | "desc";
}

export interface ChoreListState {
  chores: Chore[];
  isLoading: boolean;
  error: string | null;
  filters: ChoreListFilters;
  sort: ChoreListSort;
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface CreateChoreInput {
  title: string;
  description?: string;
  assigneeId?: string;
  points: number;
  difficulty: ChoreDifficulty;
  dueDate?: string;
}

export interface UpdateChoreInput {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  points?: number;
  difficulty?: ChoreDifficulty;
  dueDate?: string | null;
  status?: ChoreStatus;
}

// Point values by difficulty
export const DIFFICULTY_POINTS: Record<ChoreDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 50,
};

// Difficulty labels in German
export const DIFFICULTY_LABELS: Record<ChoreDifficulty, string> = {
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
};

// Status labels in German
export const STATUS_LABELS: Record<ChoreStatus, string> = {
  pending: "Offen",
  completed: "Erledigt",
  archived: "Archiviert",
};