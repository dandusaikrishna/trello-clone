import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import SortableCard from "@/components/molecules/board/sortable-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import useLists from "@/hooks/apis/use-lists";
import useCards from "@/hooks/apis/use-cards";
import type { LIST_WITH_CARDS } from "@/lib/types";

type ListColumnProps = {
  list: LIST_WITH_CARDS;
  boardId: string;
  dragHandleProps?: DraggableAttributes & SyntheticListenerMap;
};

export default function ListColumn({ list, boardId, dragHandleProps }: ListColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  const { useUpdateList, useDeleteList } = useLists(boardId);
  const { useCreateCard } = useCards(boardId);
  const { mutateAsync: updateList } = useUpdateList();
  const { mutateAsync: deleteList } = useDeleteList();
  const { mutateAsync: createCard, isPending: isCreatingCard } = useCreateCard();

  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: "list", listId: list.id },
  });

  const cardIds = list.cards.map((card) => card.id);

  const handleSaveTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === list.title) {
      setTitle(list.title);
      setIsEditingTitle(false);
      return;
    }

    await updateList({ listId: list.id, payload: { title: trimmed } });
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      className="flex max-h-full w-[272px] shrink-0 flex-col rounded-xl bg-[#ebecf0]"
      data-list-id={list.id}
    >
      <div className="flex items-center justify-between gap-2 px-2 py-2">
        {isEditingTitle ? (
          <Input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => void handleSaveTitle()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSaveTitle();
              }
              if (event.key === "Escape") {
                setTitle(list.title);
                setIsEditingTitle(false);
              }
            }}
            className="h-8 border-[#388bff] bg-white text-sm font-semibold text-[#172b4d] shadow-none"
          />
        ) : (
          <h3
            className="cursor-grab px-2 py-1 text-sm font-semibold text-[#172b4d] active:cursor-grabbing"
            {...dragHandleProps}
          >
            {list.title}
          </h3>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-8 text-[#44546f] hover:bg-[#091e4224]"
              aria-label="List actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <Pencil className="size-4" />
              Edit title
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void deleteList(list.id)}
            >
              <Trash2 className="size-4" />
              Delete list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        <div className="scrollbar-thin min-h-[4px] flex-1 overflow-y-auto">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {list.cards.map((card) => (
              <SortableCard key={card.id} card={card} listId={list.id} />
            ))}
          </SortableContext>
        </div>

        {isAddingCard ? (
          <div className="mt-2 space-y-2">
            <Input
              autoFocus
              value={newCardTitle}
              onChange={(event) => setNewCardTitle(event.target.value)}
              placeholder="Enter a title for this card..."
              className="border-[#388bff] bg-white text-sm shadow-none"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-[#0079bf] hover:bg-[#026aa7]"
                disabled={isCreatingCard || !newCardTitle.trim()}
                onClick={() => {
                  const trimmed = newCardTitle.trim();
                  if (!trimmed) {
                    return;
                  }
                  void createCard({ listId: list.id, title: trimmed }).then(() => {
                    setNewCardTitle("");
                  });
                }}
              >
                Add card
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingCard(true)}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#44546f] hover:bg-[#091e4224]"
          >
            <span className="text-lg leading-none">+</span>
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}
