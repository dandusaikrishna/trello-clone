import { CheckSquare, Clock3 } from "lucide-react";
import type { CARD_WITH_RELATIONS } from "@/lib/types";
import {
  cn,
  formatDueDate,
  getChecklistProgress,
  isDueSoon,
  isOverdue,
} from "@/lib/utils";
import MemberAvatar from "@/components/molecules/member-avatar";

type CardPreviewProps = {
  card: CARD_WITH_RELATIONS;
  isDragging?: boolean;
};

export default function CardPreview({ card, isDragging }: CardPreviewProps) {
  const checklistProgress = getChecklistProgress(card.checklists);
  const overdue = isOverdue(card.dueDate, card.dueComplete);
  const dueSoon = isDueSoon(card.dueDate);

  return (
    <div
      className={cn(
        "group/card w-full rounded-lg bg-white px-2 py-1.5 text-left shadow-sm ring-1 ring-[#091e4221] transition hover:bg-[#f4f5f7]",
        isDragging && "rotate-2 opacity-90 shadow-lg",
        card.coverColor && "overflow-hidden p-0",
      )}
    >
      {card.coverColor ? (
        <div className="h-8 w-full rounded-t-lg" style={{ backgroundColor: card.coverColor }} />
      ) : null}

      <div className={cn("space-y-1.5", card.coverColor && "px-2 pb-2 pt-1.5")}>
        {card.labels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {card.labels.map((label) => (
              <span
                key={label.id}
                className="inline-block h-2 min-w-10 max-w-full rounded-sm px-2 text-[10px] font-bold leading-4 text-white/0"
                style={{ backgroundColor: label.color }}
                title={label.name}
              >
                {label.name}
              </span>
            ))}
          </div>
        ) : null}

        <p className="text-sm leading-5 text-[#172b4d]">{card.title}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          {card.dueDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
                card.dueComplete && "bg-[#61bd4f] text-white",
                overdue && !card.dueComplete && "bg-[#eb5a46] text-white",
                dueSoon && !overdue && !card.dueComplete && "bg-[#f2d600] text-[#172b4d]",
                !overdue && !dueSoon && !card.dueComplete && "bg-[#091e4214] text-[#172b4d]",
              )}
            >
              <Clock3 className="size-3" />
              {formatDueDate(card.dueDate)}
            </span>
          ) : null}

          {checklistProgress.total > 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
                checklistProgress.completed === checklistProgress.total
                  ? "bg-[#61bd4f] text-white"
                  : "bg-[#091e4214] text-[#172b4d]",
              )}
            >
              <CheckSquare className="size-3" />
              {checklistProgress.completed}/{checklistProgress.total}
            </span>
          ) : null}

          {card.members.length > 0 ? (
            <div className="ml-auto flex -space-x-1">
              {card.members.slice(0, 3).map((member) => (
                <MemberAvatar key={member.id} user={member} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
