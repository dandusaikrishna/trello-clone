import { create } from "zustand";
import type { BOARD_FILTERS } from "@/lib/types";

type BoardStore = {
  selectedCardId: string | null;
  isCardModalOpen: boolean;
  searchTerm: string;
  activeFilters: BOARD_FILTERS;
  draggingCardId: string | null;
  draggingListId: string | null;
  filteredCardIds: Set<string> | null;
  setSelectedCardId: (cardId: string | null) => void;
  openCardModal: (cardId: string) => void;
  closeCardModal: () => void;
  setSearchTerm: (term: string) => void;
  setActiveFilters: (filters: Partial<BOARD_FILTERS>) => void;
  clearFilters: () => void;
  setDraggingCardId: (cardId: string | null) => void;
  setDraggingListId: (listId: string | null) => void;
  setFilteredCardIds: (ids: Set<string> | null) => void;
};

const defaultFilters: BOARD_FILTERS = {
  labelId: null,
  memberId: null,
  dueDate: null,
};

export const useBoardStore = create<BoardStore>((set) => ({
  selectedCardId: null,
  isCardModalOpen: false,
  searchTerm: "",
  activeFilters: defaultFilters,
  draggingCardId: null,
  draggingListId: null,
  filteredCardIds: null,
  setSelectedCardId: (cardId) => set({ selectedCardId: cardId }),
  openCardModal: (cardId) =>
    set({ selectedCardId: cardId, isCardModalOpen: true }),
  closeCardModal: () =>
    set({ selectedCardId: null, isCardModalOpen: false }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setActiveFilters: (filters) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, ...filters },
    })),
  clearFilters: () =>
    set({ activeFilters: defaultFilters, filteredCardIds: null }),
  setDraggingCardId: (cardId) => set({ draggingCardId: cardId }),
  setDraggingListId: (listId) => set({ draggingListId: listId }),
  setFilteredCardIds: (ids) => set({ filteredCardIds: ids }),
}));
