import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import BoardCanvas from "@/components/molecules/board/board-canvas";
import BoardHeader from "@/components/molecules/board/board-header";
import CardModal from "@/components/molecules/board/card-modal";
import ErrorBoundary from "@/components/molecules/error-boundary";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useBoards from "@/hooks/apis/use-boards";
import { dummyBoardDetails } from "@/lib/dummy-data";
import { getBoardBackgroundStyle } from "@/lib/utils";

type BoardPageProps = {
  boardId: string;
};

export default function BoardPage({ boardId }: BoardPageProps) {
  return (
    <ErrorBoundary fallbackTitle="Unable to load board">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-[#0079bf]">
            <Spinner className="size-8 text-white" />
          </div>
        }
      >
        <BoardPageContent boardId={boardId} />
      </Suspense>
    </ErrorBoundary>
  );
}

function BoardPageContent({ boardId }: BoardPageProps) {
  const { useGetBoardDetails } = useBoards();
  const { data } = useGetBoardDetails(boardId);
  const backgroundStyle = getBoardBackgroundStyle(
    data.board.backgroundColor,
    data.board.backgroundImageUrl,
  );

  const isDummyData = data.board.id === dummyBoardDetails.board.id;

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={backgroundStyle}>
      {isDummyData && (
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
          <Alert className="mb-0 border-0 bg-transparent">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Currently displaying sample board data. Connect to the backend API to see your actual boards.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="bg-[#0000003d]">
        <BoardHeader boardId={boardId} />
      </div>
      <BoardCanvas boardId={boardId} />
      <CardModal boardId={boardId} />
    </div>
  );
}
