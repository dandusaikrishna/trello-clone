import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ListColumn from "@/components/molecules/board/list-column";
import type { LIST_WITH_CARDS } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortableListColumnProps = {
  list: LIST_WITH_CARDS;
  boardId: string;
};

export default function SortableListColumn({ list, boardId }: SortableListColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: list.id,
      data: { type: "list", listId: list.id },
    });

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  } as DraggableAttributes & SyntheticListenerMap;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-60")}
    >
      <ListColumn list={list} boardId={boardId} dragHandleProps={dragHandleProps} />
    </div>
  );
}
