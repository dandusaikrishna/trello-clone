import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CardPreview from "@/components/molecules/board/card-preview";
import type { CARD_WITH_RELATIONS } from "@/lib/types";
import { cn, cardMatchesFilters } from "@/lib/utils";
import { useBoardStore } from "@/stores/use-board-store";

type SortableCardProps = {
  card: CARD_WITH_RELATIONS;
  listId: string;
};

export default function SortableCard({ card, listId }: SortableCardProps) {
  const openCardModal = useBoardStore((state) => state.openCardModal);
  const activeFilters = useBoardStore((state) => state.activeFilters);
  const filteredCardIds = useBoardStore((state) => state.filteredCardIds);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: "card", listId, card },
    });

  if (!cardMatchesFilters(card, activeFilters, filteredCardIds)) {
    return null;
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    listeners?.onPointerDown?.(event);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current) {
      const deltaX = Math.abs(event.clientX - pointerStart.current.x);
      const deltaY = Math.abs(event.clientY - pointerStart.current.y);

      if (deltaX < 6 && deltaY < 6) {
        openCardModal(card.id);
      }
    }

    pointerStart.current = null;
    listeners?.onPointerUp?.(event);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("mb-2 cursor-pointer", isDragging && "z-20 opacity-40")}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <CardPreview card={card} isDragging={isDragging} />
    </div>
  );
}
