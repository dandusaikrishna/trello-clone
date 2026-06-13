import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  LayoutGrid,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";
import { useEffect } from "react";
import MemberAvatar from "@/components/molecules/member-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useBoards from "@/hooks/apis/use-boards";
import useCards from "@/hooks/apis/use-cards";
import useDebounce from "@/hooks/use-debounce";
import { DEBOUNCE_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/stores/use-board-store";

type BoardHeaderProps = {
  boardId: string;
};

export default function BoardHeader({ boardId }: BoardHeaderProps) {
  const { useGetBoardDetails, useStarBoard, useUnstarBoard } = useBoards();
  const { data } = useGetBoardDetails(boardId);
  const { mutate: starBoard } = useStarBoard(boardId);
  const { mutate: unstarBoard } = useUnstarBoard(boardId);

  const searchTerm = useBoardStore((state) => state.searchTerm);
  const setSearchTerm = useBoardStore((state) => state.setSearchTerm);
  const activeFilters = useBoardStore((state) => state.activeFilters);
  const setActiveFilters = useBoardStore((state) => state.setActiveFilters);
  const clearFilters = useBoardStore((state) => state.clearFilters);
  const setFilteredCardIds = useBoardStore((state) => state.setFilteredCardIds);

  const debouncedSearch = useDebounce(searchTerm, DEBOUNCE_MS);
  const { useSearchCards, useFilterCards } = useCards(boardId);
  const { data: searchResults } = useSearchCards(debouncedSearch);
  const { data: filterResults } = useFilterCards({
    labelId: activeFilters.labelId ?? undefined,
    memberId: activeFilters.memberId ?? undefined,
    dueDate: activeFilters.dueDate ?? undefined,
  });

  useEffect(() => {
    if (debouncedSearch) {
      setFilteredCardIds(new Set(searchResults?.map((card) => card.id) ?? []));
      return;
    }

    if (activeFilters.labelId || activeFilters.memberId || activeFilters.dueDate) {
      setFilteredCardIds(new Set(filterResults?.map((card) => card.id) ?? []));
      return;
    }

    setFilteredCardIds(null);
  }, [
    debouncedSearch,
    searchResults,
    filterResults,
    activeFilters,
    setFilteredCardIds,
  ]);

  const hasFilters =
    Boolean(debouncedSearch) ||
    Boolean(activeFilters.labelId) ||
    Boolean(activeFilters.memberId) ||
    Boolean(activeFilters.dueDate);

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2 text-white">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Link
          to="/boards"
          className="flex size-8 items-center justify-center rounded-md hover:bg-[#ffffff29]"
          aria-label="Boards"
        >
          <LayoutGrid className="size-4" />
        </Link>

        <div className="flex min-w-0 items-center gap-1 rounded-md bg-[#ffffff29] px-2 py-1">
          <h1 className="truncate text-base font-bold">{data.board.title}</h1>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-white hover:bg-[#ffffff29]"
            onClick={() =>
              data.board.isStarred ? unstarBoard() : starBoard()
            }
            aria-label={data.board.isStarred ? "Unstar board" : "Star board"}
          >
            <Star
              className={cn(
                "size-4",
                data.board.isStarred && "fill-yellow-300 text-yellow-300",
              )}
            />
          </Button>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {data.members.slice(0, 4).map((member) => (
            <MemberAvatar key={member.userId} user={member.user} />
          ))}
          {data.members.length > 4 ? (
            <span className="rounded-full bg-[#dfe1e6] px-2 py-1 text-xs font-semibold text-[#172b4d]">
              +{data.members.length - 4}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-[#44546f]" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search cards..."
            className="h-8 w-44 border-none bg-[#ffffff52] pl-8 text-sm text-[#172b4d] placeholder:text-[#44546f] md:w-56"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 bg-[#ffffff29] text-white hover:bg-[#ffffff3d]"
            >
              <Users className="size-4" />
              Filter
              <ChevronDown className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <p className="text-sm font-semibold text-[#172b4d]">Filter cards</p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#44546f]">Label</label>
              <Select
                value={activeFilters.labelId ?? "all"}
                onValueChange={(value) =>
                  setActiveFilters({ labelId: value === "all" ? null : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All labels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All labels</SelectItem>
                  {data.labels.map((label) => (
                    <SelectItem key={label.id} value={label.id}>
                      <span
                        className="mr-2 inline-block size-3 rounded-sm"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#44546f]">Member</label>
              <Select
                value={activeFilters.memberId ?? "all"}
                onValueChange={(value) =>
                  setActiveFilters({ memberId: value === "all" ? null : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  {data.members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#44546f]">Due date</label>
              <Input
                type="date"
                value={activeFilters.dueDate?.slice(0, 10) ?? ""}
                onChange={(event) =>
                  setActiveFilters({
                    dueDate: event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null,
                  })
                }
              />
            </div>
          </PopoverContent>
        </Popover>

        {hasFilters ? (
          <Button
            variant="ghost"
            className="h-8 bg-[#ffffff29] text-white hover:bg-[#ffffff3d]"
            onClick={() => {
              setSearchTerm("");
              clearFilters();
            }}
          >
            <X className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>
    </header>
  );
}
