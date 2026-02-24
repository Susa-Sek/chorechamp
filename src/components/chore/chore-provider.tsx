"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Chore,
  ChoreListFilters,
  ChoreListSort,
  ChoreListState,
  CreateChoreInput,
  UpdateChoreInput,
} from "@/types/chore";

interface ChoreContextType extends ChoreListState {
  fetchChores: () => Promise<void>;
  createChore: (input: CreateChoreInput) => Promise<{ error: string | null; chore?: Chore }>;
  updateChore: (id: string, input: UpdateChoreInput) => Promise<{ error: string | null; chore?: Chore }>;
  deleteChore: (id: string) => Promise<{ error: string | null }>;
  completeChore: (id: string) => Promise<{ error: string | null; pointsEarned?: number }>;
  undoChore: (id: string) => Promise<{ error: string | null }>;
  setFilters: (filters: Partial<ChoreListFilters>) => void;
  setSort: (sort: ChoreListSort) => void;
  setPage: (page: number) => void;
  clearError: () => void;
}

const ChoreContext = createContext<ChoreContextType | undefined>(undefined);

const defaultFilters: ChoreListFilters = {
  status: "all",
  assigneeId: undefined,
  difficulty: "all",
  search: undefined,
};

const defaultSort: ChoreListSort = {
  field: "createdAt",
  direction: "desc",
};

export function ChoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ChoreListState>({
    chores: [],
    isLoading: true,
    error: null,
    filters: defaultFilters,
    sort: defaultSort,
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const supabase = createClient();

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (state.filters.status && state.filters.status !== "all") {
      params.set("status", state.filters.status);
    }
    if (state.filters.assigneeId) {
      params.set("assigneeId", state.filters.assigneeId);
    }
    if (state.filters.difficulty && state.filters.difficulty !== "all") {
      params.set("difficulty", state.filters.difficulty);
    }
    if (state.filters.search) {
      params.set("search", state.filters.search);
    }

    params.set("sortField", state.sort.field);
    params.set("sortDirection", state.sort.direction);
    params.set("page", state.page.toString());

    return params.toString();
  }, [state.filters, state.sort, state.page]);

  const fetchChores = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const queryString = buildQueryString();
      const response = await fetch(`/api/chores?${queryString}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Laden der Aufgaben");
      }

      setState((prev) => ({
        ...prev,
        chores: data.chores,
        totalItems: data.pagination.totalItems,
        totalPages: data.pagination.totalPages,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching chores:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
      }));
    }
  }, [buildQueryString]);

  // Fetch chores when filters, sort, or page change
  useEffect(() => {
    fetchChores();
  }, [fetchChores]);

  const createChore = async (input: CreateChoreInput) => {
    try {
      const response = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Fehler beim Erstellen der Aufgabe" };
      }

      await fetchChores();
      return { error: null, chore: data.chore };
    } catch (error) {
      console.error("Error creating chore:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const updateChore = async (id: string, input: UpdateChoreInput) => {
    try {
      const response = await fetch(`/api/chores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Fehler beim Aktualisieren der Aufgabe" };
      }

      await fetchChores();
      return { error: null, chore: data.chore };
    } catch (error) {
      console.error("Error updating chore:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const deleteChore = async (id: string) => {
    try {
      const response = await fetch(`/api/chores/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Fehler beim Loschen der Aufgabe" };
      }

      await fetchChores();
      return { error: null };
    } catch (error) {
      console.error("Error deleting chore:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const completeChore = async (id: string) => {
    try {
      const response = await fetch(`/api/chores/${id}/complete`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Fehler beim Abschliessen der Aufgabe" };
      }

      await fetchChores();
      return { error: null, pointsEarned: data.pointsEarned };
    } catch (error) {
      console.error("Error completing chore:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const undoChore = async (id: string) => {
    try {
      const response = await fetch(`/api/chores/${id}/undo`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Fehler beim Ruckgangigmachen" };
      }

      await fetchChores();
      return { error: null };
    } catch (error) {
      console.error("Error undoing chore:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const setFilters = (filters: Partial<ChoreListFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      page: 1, // Reset to first page when filters change
    }));
  };

  const setSort = (sort: ChoreListSort) => {
    setState((prev) => ({ ...prev, sort }));
  };

  const setPage = (page: number) => {
    setState((prev) => ({ ...prev, page }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return (
    <ChoreContext.Provider
      value={{
        ...state,
        fetchChores,
        createChore,
        updateChore,
        deleteChore,
        completeChore,
        undoChore,
        setFilters,
        setSort,
        setPage,
        clearError,
      }}
    >
      {children}
    </ChoreContext.Provider>
  );
}

export function useChores() {
  const context = useContext(ChoreContext);
  if (context === undefined) {
    throw new Error("useChores must be used within a ChoreProvider");
  }
  return context;
}