import { Link } from "@tanstack/react-router";
import { Plus, Star, AlertCircle } from "lucide-react";
import TrelloLogo from "@/components/molecules/trello-logo";
import { useState } from "react";
import { motion } from "framer-motion";
import MemberAvatar from "@/components/molecules/member-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useAuth from "@/hooks/apis/use-auth";
import useBoards from "@/hooks/apis/use-boards";
import useWorkspaces from "@/hooks/apis/use-workspaces";
import { dummyBoards } from "@/lib/dummy-data";
import { BOARD_BACKGROUNDS, TRELLO_NAV_BG } from "@/lib/constants";
import type { BOARD } from "@/lib/types";
import { cn, getBoardBackgroundStyle } from "@/lib/utils";

export default function BoardsListing() {
  const { useGetCurrentUser, useLogout } = useAuth();
  const { data: user } = useGetCurrentUser();
  const { useGetBoards, useGetStarredBoards, useCreateBoard } = useBoards();
  const { useGetWorkspaces } = useWorkspaces();
  const { data: boards = [], isLoading } = useGetBoards();
  const { data: starredBoards = [] } = useGetStarredBoards();
  const { data: workspaces = [] } = useGetWorkspaces();
  const { mutateAsync: createBoard, isPending } = useCreateBoard();
  const { mutate: logout } = useLogout();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [backgroundColor, setBackgroundColor] = useState<string>(BOARD_BACKGROUNDS[0]);

  const workspaceId = workspaces[0]?.id;
  
  // Check if dummy data is being used
  const isDummyData = boards.every((board) =>
    dummyBoards.some((dummy) => dummy.id === board.id),
  );

  const handleCreateBoard = async () => {
    if (!workspaceId) {
      return;
    }

    const title = boardTitle.trim() || "Untitled Board";
    await createBoard({ title, workspaceId, backgroundColor });
    setBoardTitle("");
    setIsCreateOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f9fafc]">
      <header
        className="sticky top-0 z-20 px-4 py-3 text-white shadow-sm"
        style={{ backgroundColor: TRELLO_NAV_BG }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TrelloLogo className="size-7 text-white" />
              <span className="text-lg font-bold">Trello</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? <MemberAvatar user={user} size="md" /> : null}
            <Button
              variant="ghost"
              className="text-white hover:bg-[#ffffff29]"
              onClick={() => logout()}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {isDummyData && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Currently displaying sample data. Connect to the backend API to see your actual boards.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#44546f]">
              {user?.name ? `${user.name}'s workspace` : "Your workspace"}
            </p>
            <h1 className="text-2xl font-bold text-[#172b4d]">Boards</h1>
          </div>
          <Button
            className="bg-[#0079bf] hover:bg-[#026aa7]"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="size-4" />
            Create new board
          </Button>
        </div>

        {starredBoards.length > 0 ? (
          <BoardSection title="Starred Boards" boards={starredBoards} starred />
        ) : null}

        <BoardSection
          title={user?.name ? `${user.name}'s boards` : "Your boards"}
          boards={boards}
          isLoading={isLoading}
        />
          isLoading={isLoading}
        />
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              autoFocus
              value={boardTitle}
              onChange={(event) => setBoardTitle(event.target.value)}
              placeholder="Board title"
            />
            <div>
              <p className="mb-2 text-sm font-semibold text-[#44546f]">Background</p>
              <div className="grid grid-cols-5 gap-2">
                {BOARD_BACKGROUNDS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-12 rounded-md",
                      backgroundColor === color && "ring-2 ring-[#0079bf] ring-offset-2",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                    aria-label={`Select background ${color}`}
                  />
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-[#0079bf] hover:bg-[#026aa7]"
              disabled={isPending || !workspaceId}
              onClick={() => void handleCreateBoard()}
            >
              Create board
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoardSection({
  title,
  boards,
  starred = false,
  isLoading = false,
}: {
  title: string;
  boards: BOARD[];
  starred?: boolean;
  isLoading?: boolean;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-2">
        {starred ? <Star className="size-4 fill-[#f2d600] text-[#f2d600]" /> : null}
        <h2 className="text-base font-semibold text-[#172b4d]">{title}</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-[#44546f]">Loading boards...</p>
      ) : boards.length === 0 ? (
        <p className="text-sm text-[#44546f]">No boards yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {boards.map((board, index) => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <BoardTile board={board} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

function BoardTile({ board }: { board: BOARD }) {
  const backgroundStyle = getBoardBackgroundStyle(
    board.backgroundColor,
    board.backgroundImageUrl,
  );

  return (
    <Link
      to="/boards/$boardId"
      params={{ boardId: board.id }}
      className="group block"
    >
      <div
        className="relative h-24 overflow-hidden rounded-md shadow-sm transition hover:brightness-95"
        style={backgroundStyle}
      >
        <div className="absolute inset-0 bg-[#00000014] opacity-0 transition group-hover:opacity-100" />
        {board.isStarred ? (
          <Star className="absolute top-2 right-2 size-4 fill-yellow-300 text-yellow-300" />
        ) : null}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-[#172b4d]">{board.title}</p>
    </Link>
  );
}
