import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  Clock3,
  Tag,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import MemberAvatar from "@/components/molecules/member-avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import useBoards from "@/hooks/apis/use-boards";
import useCards from "@/hooks/apis/use-cards";
import useCardExtras from "@/hooks/apis/use-card-extras";
import { LABEL_COLORS } from "@/lib/constants";
import type { CARD_WITH_RELATIONS } from "@/lib/types";
import { cn, formatDueDate, getChecklistProgress } from "@/lib/utils";
import { useBoardStore } from "@/stores/use-board-store";

type CardModalProps = {
  boardId: string;
};

export default function CardModal({ boardId }: CardModalProps) {
  const selectedCardId = useBoardStore((state) => state.selectedCardId);
  const isOpen = useBoardStore((state) => state.isCardModalOpen);
  const closeCardModal = useBoardStore((state) => state.closeCardModal);

  const { useGetBoardDetails } = useBoards();
  const { data } = useGetBoardDetails(boardId);

  const card = useMemo(() => {
    if (!selectedCardId) {
      return null;
    }

    for (const list of data.lists) {
      const found = list.cards.find((item) => item.id === selectedCardId);
      if (found) {
        return found;
      }
    }

    return null;
  }, [data.lists, selectedCardId]);

  if (!card) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeCardModal()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] max-w-4xl overflow-y-auto border-none bg-[#f4f5f7] p-0 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">{card.title}</DialogTitle>
        <CardModalContent boardId={boardId} card={card} onClose={closeCardModal} />
      </DialogContent>
    </Dialog>
  );
}

function CardModalContent({
  boardId,
  card,
  onClose,
}: {
  boardId: string;
  card: CARD_WITH_RELATIONS;
  onClose: () => void;
}) {
  const { useGetBoardDetails } = useBoards();
  const { data } = useGetBoardDetails(boardId);
  const { useUpdateCard, useDeleteCard, useArchiveCard } = useCards(boardId);
  const {
    useAssignLabel,
    useRemoveLabel,
    useAssignMember,
    useRemoveMember,
    useCreateChecklist,
    useCreateChecklistItem,
    useUpdateChecklistItem,
    useCreateComment,
  } = useCardExtras(boardId);

  const { mutateAsync: updateCard } = useUpdateCard();
  const { mutateAsync: deleteCard } = useDeleteCard();
  const { mutateAsync: archiveCard } = useArchiveCard();
  const { mutateAsync: assignLabel } = useAssignLabel();
  const { mutateAsync: removeLabel } = useRemoveLabel();
  const { mutateAsync: assignMember } = useAssignMember();
  const { mutateAsync: removeMember } = useRemoveMember();
  const { mutateAsync: createChecklist } = useCreateChecklist();
  const { mutateAsync: createChecklistItem } = useCreateChecklistItem();
  const { mutateAsync: updateChecklistItem } = useUpdateChecklistItem();
  const { mutateAsync: createComment } = useCreateComment();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [commentText, setCommentText] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("Checklist");
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? "");
  }, [card.id, card.title, card.description]);

  const checklistProgress = getChecklistProgress(card.checklists);

  const saveTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === card.title) {
      setTitle(card.title);
      return;
    }
    await updateCard({ cardId: card.id, payload: { title: trimmed } });
  };

  const saveDescription = async () => {
    if (description === (card.description ?? "")) {
      return;
    }
    await updateCard({ cardId: card.id, payload: { description } });
  };

  const toggleDueComplete = async () => {
    await updateCard({
      cardId: card.id,
      payload: { dueComplete: !card.dueComplete },
    });
  };

  const setDueDate = async (value: string) => {
    await updateCard({
      cardId: card.id,
      payload: {
        dueDate: value ? new Date(value).toISOString() : null,
      },
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-10 rounded-md p-2 text-[#44546f] hover:bg-[#091e4224]"
        aria-label="Close card"
      >
        <X className="size-5" />
      </button>

      {card.coverColor ? (
        <div className="h-24 w-full rounded-t-lg" style={{ backgroundColor: card.coverColor }} />
      ) : null}

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <AlignLeft className="mt-1 size-5 text-[#44546f]" />
            <div className="min-w-0 flex-1 space-y-3">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => void saveTitle()}
                className="border-none bg-transparent px-0 text-xl font-semibold text-[#172b4d] shadow-none focus-visible:ring-0"
              />

              <p className="text-sm text-[#44546f]">
                in list{" "}
                <span className="underline">
                  {data.lists.find((list) => list.id === card.listId)?.title}
                </span>
              </p>

              {card.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {card.labels.map((label) => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => void removeLabel({ cardId: card.id, labelId: label.id })}
                      className="rounded-sm px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {card.dueDate ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#44546f]">Due Date</p>
                    <button
                      type="button"
                      onClick={() => void toggleDueComplete()}
                      className={cn(
                        "inline-flex items-center gap-2 rounded px-2 py-1 text-sm",
                        card.dueComplete
                          ? "bg-[#61bd4f] text-white"
                          : "bg-[#091e4214] text-[#172b4d]",
                      )}
                    >
                      <Clock3 className="size-4" />
                      {formatDueDate(card.dueDate)}
                    </button>
                  </div>
                ) : null}

                {card.members.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#44546f]">Members</p>
                    <div className="flex flex-wrap gap-1">
                      {card.members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() =>
                            void removeMember({ cardId: card.id, memberId: member.id })
                          }
                        >
                          <MemberAvatar user={member} size="md" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
              <AlignLeft className="size-4 text-[#44546f]" />
              Description
            </div>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={() => void saveDescription()}
              placeholder="Add a more detailed description..."
              className="min-h-24 bg-white text-sm"
            />
          </section>

          {card.checklists.map((checklist) => (
            <section key={checklist.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
                <CheckSquare className="size-4 text-[#44546f]" />
                {checklist.title}
                <span className="text-xs font-normal text-[#44546f]">
                  {checklist.items.filter((item) => item.isCompleted).length}/
                  {checklist.items.length}
                </span>
              </div>
              <div className="space-y-2 pl-6">
                {checklist.items.map((item) => (
                  <label key={item.id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={item.isCompleted}
                      onCheckedChange={(checked) =>
                        void updateChecklistItem({
                          itemId: item.id,
                          payload: { isCompleted: checked === true },
                        })
                      }
                    />
                    <span
                      className={cn(
                        item.isCompleted && "text-[#44546f] line-through",
                      )}
                    >
                      {item.title}
                    </span>
                  </label>
                ))}
                <Input
                  value={newItemTitles[checklist.id] ?? ""}
                  onChange={(event) =>
                    setNewItemTitles((prev) => ({
                      ...prev,
                      [checklist.id]: event.target.value,
                    }))
                  }
                  placeholder="Add an item"
                  className="h-8 bg-white text-sm"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      const value = newItemTitles[checklist.id]?.trim();
                      if (!value) {
                        return;
                      }
                      void createChecklistItem({
                        checklistId: checklist.id,
                        title: value,
                      }).then(() =>
                        setNewItemTitles((prev) => ({ ...prev, [checklist.id]: "" })),
                      );
                    }
                  }}
                />
              </div>
            </section>
          ))}

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#172b4d]">
              Activity
            </div>
            <Textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment..."
              className="min-h-16 bg-white text-sm"
            />
            <Button
              size="sm"
              className="bg-[#0079bf] hover:bg-[#026aa7]"
              disabled={!commentText.trim()}
              onClick={() => {
                const content = commentText.trim();
                if (!content) {
                  return;
                }
                void createComment({
                  cardId: card.id,
                  payload: { content },
                }).then(() => setCommentText(""));
              }}
            >
              Save
            </Button>
            <div className="space-y-3">
              {(card.comments ?? []).map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <MemberAvatar user={comment.user} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#172b4d]">
                      {comment.user.name}
                    </p>
                    <p className="rounded-sm bg-white px-3 py-2 text-sm text-[#172b4d] shadow-sm">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-2">
          <p className="text-xs font-semibold text-[#44546f]">Add to card</p>

          <SidebarButton icon={Users} label="Members">
            <div className="space-y-1">
              {data.members.map((member) => {
                const assigned = card.members.some((item) => item.id === member.userId);
                return (
                  <button
                    key={member.userId}
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-[#091e4214]"
                    onClick={() =>
                      assigned
                        ? void removeMember({ cardId: card.id, memberId: member.userId })
                        : void assignMember({
                            cardId: card.id,
                            payload: { memberId: member.userId },
                          })
                    }
                  >
                    <MemberAvatar user={member.user} />
                    <span>{member.user.name}</span>
                  </button>
                );
              })}
            </div>
          </SidebarButton>

          <SidebarButton icon={Tag} label="Labels">
            <div className="grid grid-cols-2 gap-2">
              {data.labels.map((label) => {
                const assigned = card.labels.some((item) => item.id === label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    className="rounded-sm px-2 py-2 text-left text-xs font-semibold text-white"
                    style={{ backgroundColor: label.color, opacity: assigned ? 1 : 0.65 }}
                    onClick={() =>
                      assigned
                        ? void removeLabel({ cardId: card.id, labelId: label.id })
                        : void assignLabel({
                            cardId: card.id,
                            payload: { labelId: label.id },
                          })
                    }
                  >
                    {label.name}
                  </button>
                );
              })}
            </div>
          </SidebarButton>

          <SidebarButton icon={Calendar} label="Due date">
            <Input
              type="date"
              value={card.dueDate?.slice(0, 10) ?? ""}
              onChange={(event) => void setDueDate(event.target.value)}
              className="bg-white text-sm"
            />
          </SidebarButton>

          <SidebarButton icon={CheckSquare} label="Checklist">
            <div className="space-y-2">
              <Input
                value={newChecklistTitle}
                onChange={(event) => setNewChecklistTitle(event.target.value)}
                className="bg-white text-sm"
              />
              <Button
                size="sm"
                className="w-full bg-[#0079bf] hover:bg-[#026aa7]"
                onClick={() =>
                  void createChecklist({
                    cardId: card.id,
                    payload: { title: newChecklistTitle.trim() || "Checklist" },
                  })
                }
              >
                Add checklist
              </Button>
            </div>
          </SidebarButton>

          <p className="pt-2 text-xs font-semibold text-[#44546f]">Actions</p>
          <Button
            variant="secondary"
            className="w-full justify-start bg-[#091e420f] text-[#172b4d] hover:bg-[#091e4224]"
            onClick={() => void archiveCard(card.id).then(onClose)}
          >
            Archive
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start bg-[#091e420f] text-[#172b4d] hover:bg-[#091e4224]"
            onClick={() => void deleteCard(card.id).then(onClose)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>

          {checklistProgress.total > 0 ? (
            <p className="text-xs text-[#44546f]">
              Checklist {checklistProgress.completed}/{checklistProgress.total} complete
            </p>
          ) : null}

          <div className="pt-2">
            <p className="mb-2 text-xs font-semibold text-[#44546f]">Label palette</p>
            <div className="flex flex-wrap gap-1">
              {LABEL_COLORS.slice(0, 6).map((color) => (
                <span
                  key={color}
                  className="size-8 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="w-full justify-start bg-[#091e420f] text-[#172b4d] hover:bg-[#091e4224]"
        >
          <Icon className="size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        {children}
      </PopoverContent>
    </Popover>
  );
}
