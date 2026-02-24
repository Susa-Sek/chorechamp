"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChoreListFilters, ChoreListSort, DIFFICULTY_LABELS } from "@/types/chore";
import { HouseholdMember } from "@/types/household";

interface ChoreFilterBarProps {
  filters: ChoreListFilters;
  sort: ChoreListSort;
  members: HouseholdMember[];
  onFilterChange: (filters: Partial<ChoreListFilters>) => void;
  onSortChange: (sort: ChoreListSort) => void;
  onReset: () => void;
}

export function ChoreFilterBar({
  filters,
  sort,
  members,
  onFilterChange,
  onSortChange,
  onReset,
}: ChoreFilterBarProps) {
  const hasActiveFilters =
    (filters.status && filters.status !== "all") ||
    filters.assigneeId ||
    (filters.difficulty && filters.difficulty !== "all") ||
    filters.search;

  const statusOptions = [
    { value: "all", label: "Alle" },
    { value: "pending", label: "Offen" },
    { value: "completed", label: "Erledigt" },
  ];

  const difficultyOptions = [
    { value: "all", label: "Alle" },
    ...Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const sortOptions: { value: ChoreListSort["field"]; label: string }[] = [
    { value: "createdAt", label: "Erstellungsdatum" },
    { value: "dueDate", label: "Falligkeitsdatum" },
    { value: "points", label: "Punkte" },
    { value: "difficulty", label: "Schwierigkeit" },
    { value: "title", label: "Titel" },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Aufgaben suchen..."
            value={filters.search || ""}
            onChange={(e) =>
              onFilterChange({ search: e.target.value || undefined })
            }
            className="pl-9"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7"
              onClick={() => onFilterChange({ search: undefined })}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Quick Status Filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) =>
            onFilterChange({ status: value as ChoreListFilters["status"] })
          }
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    Zurucksetzen
                  </Button>
                )}
              </div>

              <Separator />

              {/* Assignee Filter */}
              <div className="space-y-2">
                <Label>Zugewiesen an</Label>
                <Select
                  value={filters.assigneeId || "all"}
                  onValueChange={(value) =>
                    onFilterChange({
                      assigneeId: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Mitglieder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Mitglieder</SelectItem>
                    <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage
                              src={member.profile.avatarUrl || undefined}
                            />
                            <AvatarFallback className="text-[10px]">
                              {member.profile.displayName
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.profile.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-2">
                <Label>Schwierigkeit</Label>
                <Select
                  value={filters.difficulty || "all"}
                  onValueChange={(value) =>
                    onFilterChange({
                      difficulty: value as ChoreListFilters["difficulty"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Schwierigkeiten" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sortieren nach:</span>
        <Select
          value={sort.field}
          onValueChange={(value) =>
            onSortChange({ ...sort, field: value as ChoreListSort["field"] })
          }
        >
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() =>
            onSortChange({
              ...sort,
              direction: sort.direction === "asc" ? "desc" : "asc",
            })
          }
        >
          {sort.direction === "asc" ? "Aufsteigend" : "Absteigend"}
        </Button>
      </div>
    </div>
  );
}