import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import type {
  API_SUCCESS,
  BOARD_DETAILS,
  CREATE_LIST_PAYLOAD,
  LIST,
  REORDER_LISTS_PAYLOAD,
  UPDATE_LIST_PAYLOAD,
} from "@/lib/types";

export default function useLists(boardId: string) {
  const queryClient = useQueryClient();

  const updateBoardCache = (
    updater: (prev: BOARD_DETAILS) => BOARD_DETAILS,
  ) => {
    queryClient.setQueryData<BOARD_DETAILS>(["get-board-details", boardId], (prev) =>
      prev ? updater(prev) : prev,
    );
  };

  const useCreateList = () =>
    useMutation({
      mutationKey: ["create-list", boardId],
      mutationFn: async (payload: CREATE_LIST_PAYLOAD) => {
        const { data } = await api.post<API_SUCCESS<LIST>>("/lists", payload);
        return data.data;
      },
      onSuccess: (list) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: [...prev.lists, { ...list, cards: [] }],
        }));
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });

  const useUpdateList = () =>
    useMutation({
      mutationKey: ["update-list", boardId],
      mutationFn: async ({
        listId,
        payload,
      }: {
        listId: string;
        payload: UPDATE_LIST_PAYLOAD;
      }) => {
        const { data } = await api.patch<API_SUCCESS<LIST>>(
          `/lists/${listId}`,
          payload,
        );
        return data.data;
      },
      onMutate: async ({ listId, payload }) => {
        const previous = queryClient.getQueryData<BOARD_DETAILS>([
          "get-board-details",
          boardId,
        ]);

        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) =>
            list.id === listId ? { ...list, ...payload } : list,
          ),
        }));

        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(["get-board-details", boardId], context.previous);
        }
        toast.error(getApiErrorMessage(error));
      },
    });

  const useDeleteList = () =>
    useMutation({
      mutationKey: ["delete-list", boardId],
      mutationFn: async (listId: string) => {
        await api.delete(`/lists/${listId}`);
      },
      onMutate: async (listId) => {
        const previous = queryClient.getQueryData<BOARD_DETAILS>([
          "get-board-details",
          boardId,
        ]);

        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.filter((list) => list.id !== listId),
        }));

        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(["get-board-details", boardId], context.previous);
        }
        toast.error(getApiErrorMessage(error));
      },
    });

  const useReorderLists = () =>
    useMutation({
      mutationKey: ["reorder-lists", boardId],
      mutationFn: async (payload: REORDER_LISTS_PAYLOAD) => {
        await api.patch("/lists/reorder", payload);
      },
      onMutate: async (payload) => {
        const previous = queryClient.getQueryData<BOARD_DETAILS>([
          "get-board-details",
          boardId,
        ]);

        updateBoardCache((prev) => {
          const listMap = new Map(payload.lists.map((item) => [item.id, item.position]));
          const reordered = [...prev.lists]
            .map((list) => ({
              ...list,
              position: listMap.get(list.id) ?? list.position,
            }))
            .sort((a, b) => a.position - b.position);

          return { ...prev, lists: reordered };
        });

        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(["get-board-details", boardId], context.previous);
        }
        toast.error(getApiErrorMessage(error));
      },
    });

  return { useCreateList, useUpdateList, useDeleteList, useReorderLists };
}
