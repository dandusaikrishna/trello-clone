import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import SortableListColumn from "@/components/molecules/board/sortable-list-column";
import CardPreview from "@/components/molecules/board/card-preview";
import AddListButton from "@/components/molecules/board/add-list-button";
import useBoards from "@/hooks/apis/use-boards";
import useLists from "@/hooks/apis/use-lists";
import useCards from "@/hooks/apis/use-cards";
import type { CARD_WITH_RELATIONS } from "@/lib/types";
import { useBoardStore } from "@/stores/use-board-store";

type BoardCanvasProps = {
  boardId: string;
};

export default function BoardCanvas({ boardId }: BoardCanvasProps) {
  const { useGetBoardDetails } = useBoards();
  const { data } = useGetBoardDetails(boardId);
  const { useReorderLists } = useLists(boardId);
  const { useMoveCard } = useCards(boardId);
  const { mutateAsync: reorderLists } = useReorderLists();
  const { mutateAsync: moveCard } = useMoveCard();

  const setDraggingCardId = useBoardStore((state) => state.setDraggingCardId);
  const setDraggingListId = useBoardStore((state) => state.setDraggingListId);

  const [activeCard, setActiveCard] = useState<CARD_WITH_RELATIONS | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const listIds = useMemo(() => data.lists.map((list) => list.id), [data.lists]);

  const findCardListId = (cardId: string) => {
    for (const list of data.lists) {
      if (list.cards.some((card) => card.id === cardId)) {
        return list.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type as string | undefined;

    if (type === "card") {
      const card = active.data.current?.card as CARD_WITH_RELATIONS;
      setActiveCard(card);
      setDraggingCardId(card.id);
      return;
    }

    if (type === "list") {
      setDraggingListId(active.id as string);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setDraggingCardId(null);
    setDraggingListId(null);

    if (!over) {
      return;
    }

    const activeType = active.data.current?.type as string | undefined;

    if (activeType === "list") {
      const oldIndex = data.lists.findIndex((list) => list.id === active.id);
      const newIndex = data.lists.findIndex((list) => list.id === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return;
      }

      const reordered = arrayMove(data.lists, oldIndex, newIndex);
      await reorderLists({
        boardId,
        lists: reordered.map((list, index) => ({ id: list.id, position: index })),
      });
      return;
    }

    if (activeType === "card") {
      const cardId = active.id as string;
      const sourceListId = findCardListId(cardId);
      if (!sourceListId) {
        return;
      }

      let destinationListId = over.data.current?.listId as string | undefined;
      let destinationIndex = 0;

      if (over.data.current?.type === "card") {
        destinationListId = findCardListId(over.id as string) ?? undefined;
        const destinationList = data.lists.find((list) => list.id === destinationListId);
        destinationIndex =
          destinationList?.cards.findIndex((card) => card.id === over.id) ?? 0;
      } else {
        destinationListId = over.id as string;
        const destinationList = data.lists.find((list) => list.id === destinationListId);
        destinationIndex = destinationList?.cards.length ?? 0;
      }

      if (!destinationListId) {
        return;
      }

      const sourceList = data.lists.find((list) => list.id === sourceListId);
      const sourceIndex = sourceList?.cards.findIndex((card) => card.id === cardId) ?? -1;

      if (sourceListId === destinationListId && sourceIndex === destinationIndex) {
        return;
      }

      await moveCard({
        cardId,
        sourceListId,
        destinationListId,
        newPosition: destinationIndex,
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-3 pb-3 pt-2"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
            <div className="flex h-full items-start gap-3">
              {data.lists.map((list) => (
                <SortableListColumn key={list.id} list={list} boardId={boardId} />
              ))}
              <AddListButton boardId={boardId} />
            </div>
          </SortableContext>

          <DragOverlay>
            {activeCard ? (
              <div className="w-[272px]">
                <CardPreview card={activeCard} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </motion.div>
    </div>
  );
}
