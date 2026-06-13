import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

const BoardPage = lazy(
  () => import("./components/board-page"),
);

export const Route = createFileRoute("/_authenticated/boards/$boardId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { boardId } = Route.useParams();

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0079bf]">
          <Spinner className="size-8 text-white" />
        </div>
      }
    >
      <BoardPage boardId={boardId} />
    </Suspense>
  );
}
