// Shared types for rewards system
// Can be reused in React Native mobile app

export type RewardStatus = "draft" | "published" | "archived";
export type RedemptionStatus = "pending" | "fulfilled" | "cancelled";

export interface Reward {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointCost: number;
  quantityAvailable: number | null; // null = unlimited
  quantityClaimed: number;
  status: RewardStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  creator?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface Redemption {
  id: string;
  rewardId: string;
  userId: string;
  householdId: string;
  pointsSpent: number;
  status: RedemptionStatus;
  fulfilledAt: string | null;
  fulfilledBy: string | null;
  fulfillmentNotes: string | null;
  createdAt: string;
  // Joined data
  reward?: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  user?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  fulfiller?: {
    id: string;
    displayName: string;
  };
}

export interface RewardListFilters {
  status?: RewardStatus | "all";
  affordable?: boolean;
  search?: string;
}

export interface RewardListSort {
  field: "pointCost" | "name" | "createdAt";
  direction: "asc" | "desc";
}

export interface RedemptionListFilters {
  status?: RedemptionStatus | "all";
}

export interface CreateRewardInput {
  name: string;
  description?: string;
  imageUrl?: string;
  pointCost: number;
  quantityAvailable?: number | null;
  status?: RewardStatus;
}

export interface UpdateRewardInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  pointCost?: number;
  quantityAvailable?: number | null;
  status?: RewardStatus;
}

export interface FulfillRedemptionInput {
  fulfillmentNotes?: string;
}

// Status labels in German
export const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  draft: "Entwurf",
  published: "Veroeffentlicht",
  archived: "Archiviert",
};

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: "Ausstehend",
  fulfilled: "Erfuellt",
  cancelled: "Storniert",
};

// Status colors for badges
export const REDEMPTION_STATUS_COLORS: Record<RedemptionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  fulfilled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};