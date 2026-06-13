import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LABEL_COLORS, TRELLO_BLUE } from "@/lib/constants";
import type { BOARD_FILTERS, CARD_WITH_RELATIONS, CHECKLIST_WITH_ITEMS } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getBoardBackgroundStyle(
  backgroundColor?: string,
  backgroundImageUrl?: string,
) {
  if (backgroundImageUrl) {
    return {
      backgroundImage: `url(${backgroundImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
    } as const;
  }

  return {
    backgroundColor: backgroundColor ?? TRELLO_BLUE,
  } as const;
}

export function getChecklistProgress(checklists: CHECKLIST_WITH_ITEMS[]) {
  const totals = checklists.reduce(
    (acc, checklist) => {
      acc.total += checklist.items.length;
      acc.completed += checklist.items.filter((item) => item.isCompleted).length;
      return acc;
    },
    { total: 0, completed: 0 },
  );

  return totals;
}

export function isDueSoon(dueDate?: string) {
  if (!dueDate) {
    return false;
  }

  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

export function isOverdue(dueDate?: string, dueComplete?: boolean) {
  if (!dueDate || dueComplete) {
    return false;
  }

  return new Date(dueDate).getTime() < Date.now();
}

export function formatDueDate(dueDate: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(dueDate));
}

export function cardMatchesFilters(
  card: CARD_WITH_RELATIONS,
  filters: BOARD_FILTERS,
  filteredCardIds: Set<string> | null,
) {
  if (filteredCardIds && !filteredCardIds.has(card.id)) {
    return false;
  }

  if (filters.labelId && !card.labels.some((label) => label.id === filters.labelId)) {
    return false;
  }

  if (filters.memberId && !card.members.some((member) => member.id === filters.memberId)) {
    return false;
  }

  if (filters.dueDate) {
    const cardDue = card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : null;
    const filterDue = new Date(filters.dueDate).toISOString().slice(0, 10);
    if (cardDue !== filterDue) {
      return false;
    }
  }

  return true;
}

export function getRandomLabelColor(index: number) {
  return LABEL_COLORS[index % LABEL_COLORS.length] ?? LABEL_COLORS[0];
}

export function reorder<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  if (!removed) {
    return items;
  }
  next.splice(toIndex, 0, removed);
  return next;
}
