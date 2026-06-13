import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import type {
  API_SUCCESS,
  BOARD,
  BOARD_DETAILS,
  CREATE_BOARD_PAYLOAD,
  UPDATE_BOARD_PAYLOAD,
} from "@/lib/types";

export default function useBoards() {
  const queryClient = useQueryClient();
  const params = useParams({ strict: false });
  const boardId = params.boardId as string | undefined;

  const useGetBoards = () =>
    useQuery({
      queryKey: ["get-boards"],
      queryFn: async () => {
        const { data } = await api.get<API_SUCCESS<BOARD[]>>("/boards");
        return data.data;
      },
    });

  const useGetStarredBoards = () =>
    useQuery({
      queryKey: ["get-starred-boards"],
      queryFn: async () => {
        const { data } = await api.get<API_SUCCESS<BOARD[]>>("/boards/starred");
        return data.data;
      },
    });

  const useGetBoardDetails = (id: string) =>
    useSuspenseQuery({
      queryKey: ["get-board-details", id],
      queryFn: async () => {
        const { data } = await api.get<API_SUCCESS<BOARD_DETAILS>>(
          `/boards/${id}`,
        );
        return data.data;
      },
    });

  const useCreateBoard = () =>
    useMutation({
      mutationKey: ["create-board"],
      mutationFn: async (payload: CREATE_BOARD_PAYLOAD) => {
        const { data } = await api.post<API_SUCCESS<BOARD>>("/boards", payload);
        return data.data;
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["get-boards"] });
        void queryClient.invalidateQueries({ queryKey: ["get-workspaces"] });
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });

  const useUpdateBoard = (id: string) =>
    useMutation({
      mutationKey: ["update-board", id],
      mutationFn: async (payload: UPDATE_BOARD_PAYLOAD) => {
        const { data } = await api.patch<API_SUCCESS<BOARD>>(
          `/boards/${id}`,
          payload,
        );
        return data.data;
      },
      onSuccess: (board) => {
        queryClient.setQueryData<BOARD_DETAILS>(["get-board-details", id], (prev) =>
          prev ? { ...prev, board: { ...prev.board, ...board } } : prev,
        );
        void queryClient.invalidateQueries({ queryKey: ["get-boards"] });
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });

  const useStarBoard = (id: string) =>
    useMutation({
      mutationKey: ["star-board", id],
      mutationFn: async () => {
        await api.post(`/boards/${id}/star`);
      },
      onSuccess: () => {
        queryClient.setQueryData<BOARD_DETAILS>(["get-board-details", id], (prev) =>
          prev ? { ...prev, board: { ...prev.board, isStarred: true } } : prev,
        );
        void queryClient.invalidateQueries({ queryKey: ["get-boards"] });
        void queryClient.invalidateQueries({ queryKey: ["get-starred-boards"] });
      },
    });

  const useUnstarBoard = (id: string) =>
    useMutation({
      mutationKey: ["unstar-board", id],
      mutationFn: async () => {
        await api.delete(`/boards/${id}/star`);
      },
      onSuccess: () => {
        queryClient.setQueryData<BOARD_DETAILS>(["get-board-details", id], (prev) =>
          prev ? { ...prev, board: { ...prev.board, isStarred: false } } : prev,
        );
        void queryClient.invalidateQueries({ queryKey: ["get-boards"] });
        void queryClient.invalidateQueries({ queryKey: ["get-starred-boards"] });
      },
    });

  const invalidateBoardDetails = () => {
    if (boardId) {
      void queryClient.invalidateQueries({ queryKey: ["get-board-details", boardId] });
    }
  };

  return {
    useGetBoards,
    useGetStarredBoards,
    useGetBoardDetails,
    useCreateBoard,
    useUpdateBoard,
    useStarBoard,
    useUnstarBoard,
    invalidateBoardDetails,
  };
}
