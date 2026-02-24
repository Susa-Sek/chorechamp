// Shared types for household management
// Can be reused in React Native mobile app

export interface Household {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: string;
  profile: {
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface InviteCode {
  id: string;
  code: string;
  householdId: string;
  createdBy: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface HouseholdWithMembership {
  household: Household;
  membership: {
    role: "admin" | "member";
    joinedAt: string;
  };
  memberCount: number;
}

export interface HouseholdState {
  household: Household | null;
  members: HouseholdMember[];
  inviteCodes: InviteCode[];
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
}

export interface CreateHouseholdInput {
  name: string;
}

export interface JoinHouseholdInput {
  code: string;
}

export interface GenerateInviteCodeInput {
  expiresAt: string;
}

export interface TransferAdminInput {
  newAdminUserId: string;
}
