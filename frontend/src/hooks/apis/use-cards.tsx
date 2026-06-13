import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import type {
  API_SUCCESS,
  BOARD_DETAILS,
  CARD,
  CARD_SEARCH_RESULT,
  CARD_WITH_RELATIONS,
  CREATE_CARD_PAYLOAD,
  MOVE_CARD_PAYLOAD,
  UPDATE_CARD_PAYLOAD,
} from "@/lib/types";

export default function useCards(boardId: string) {
  const queryClient = useQueryClient();

  const updateBoardCache = (
    updater: (prev: BOARD_DETAILS) => BOARD_DETAILS,
  ) => {
    queryClient.setQueryData<BOARD_DETAILS>(["get-board-details", boardId], (prev) =>
      prev ? updater(prev) : prev,
    );
  };

  const useSearchCards = (query: string) =>
    useQuery({
      queryKey: ["search-cards", boardId, query],
      queryFn: async () => {
        const { data } = await api.get<API_SUCCESS<CARD_SEARCH_RESULT[]>>(
          "/cards/search",
          { params: { query, boardId } },
        );
        return data.data;
      },
      enabled: query.length > 0,
    });

  const useFilterCards = (params: Record<string, string | undefined>) =>
    useQuery({
      queryKey: ["filter-cards", boardId, params],
      queryFn: async () => {
        const { data } = await api.get<API_SUCCESS<CARD_SEARCH_RESULT[]>>(
          "/cards/filter",
          { params: { boardId, ...params } },
        );
        return data.data;
      },
      enabled: Object.values(params).some(Boolean),
    });

  const useCreateCard = () =>
    useMutation({
      mutationKey: ["create-card", boardId],
      mutationFn: async (payload: CREATE_CARD_PAYLOAD) => {
        const { data } = await api.post<API_SUCCESS<CARD>>("/cards", payload);
        return data.data;
      },
      onSuccess: (card) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) =>
            list.id === card.listId
              ? {
                  ...list,
                  cards: [
                    ...list.cards,
                    {
                      ...card,
                      labels: [],
                      members: [],
                      checklists: [],
                      comments: [],
                      attachments: [],
                    },
                  ],
                }
              : list,
          ),
        }));
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });

  const useUpdateCard = () =>
    useMutation({
      mutationKey: ["update-card", boardId],
      mutationFn: async ({
        cardId,
        payload,
      }: {
        cardId: string;
        payload: UPDATE_CARD_PAYLOAD;
      }) => {
        const { data } = await api.patch<API_SUCCESS<CARD>>(
          `/cards/${cardId}`,
          payload,
        );
        return data.data;
      },
      onMutate: async ({ cardId, payload }) => {
        const previous = queryClient.getQueryData<BOARD_DETAILS>([
          "get-board-details",
          boardId,
        ]);

        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    ...payload,
                    startDate: payload.startDate === null ? undefined : payload.startDate ?? card.startDate,
                    dueDate: payload.dueDate === null ? undefined : payload.dueDate ?? card.dueDate,
                    coverColor: payload.coverColor === null ? undefined : payload.coverColor ?? card.coverColor,
                    coverAttachmentId:
                      payload.coverAttachmentId === null
                        ? undefined
                        : payload.coverAttachmentId ?? card.coverAttachmentId,
                  }
                : card,
            ),
          })),
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

  const useDeleteCard = () =>
    useMutation({
      mutationKey: ["delete-card", boardId],
      mutationFn: async (cardId: string) => {
        await api.delete(`/cards/${cardId}`);
      },
      onMutate: async (cardId) => {
        const previous = queryClient.getQueryData<BOARD_DETAILS>([
          "get-board-details",
          boardId,
        ]);

        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.filter((card) => card.id !== cardId),
          })),
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

  const useArchiveCard = () =>
    useMutation({
      mutationKey: ["archive-card", boardId],
      mutationFn: async (cardId: string) => {
        const { data } = await api.patch<API_SUCCESS<CARD>>(
          `/cards/${cardId}/archive`,
        );
        return data.data;
      },
      onMutate: async (cardId) => {
        const previous = queryClient.getQueryData<BOARD_DETAILS>([
          "get-board-details",
          boardId,
        ]);

        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.filter((card) => card.id !== cardId),
          })),
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

  const useMoveCard = () =>
    useMutation({
      mutationKey: ["move-card", boardId],
      mutationFn: async (payload: MOVE_CARD_PAYLOAD) => {
        const { data } = await api.patch<API_SUCCESS<CARD>>("/cards/move", payload);
        return data.data;
      },
      onMutate: async (payload) => {
        const previous = queryClient.getQueryData<BOARD_DETAILS>([
          "get-board-details",
          boardId,
        ]);

        updateBoardCache((prev) => {
          let movedCard: CARD_WITH_RELATIONS | undefined;

          const listsWithoutCard = prev.lists.map((list) => {
            const card = list.cards.find((item) => item.id === payload.cardId);
            if (!card) {
              return list;
            }

            movedCard = card;
            return {
              ...list,
              cards: list.cards.filter((item) => item.id !== payload.cardId),
            };
          });

          if (!movedCard) {
            return prev;
          }

          return {
            ...prev,
            lists: listsWithoutCard.map((list) => {
              if (list.id !== payload.destinationListId) {
                return list;
              }

              const nextCards = [...list.cards];
              nextCards.splice(payload.newPosition, 0, {
                ...movedCard!,
                listId: payload.destinationListId,
              });

              return {
                ...list,
                cards: nextCards.map((card, index) => ({
                  ...card,
                  position: index + 1,
                })),
              };
            }),
          };
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

  return {
    useSearchCards,
    useFilterCards,
    useCreateCard,
    useUpdateCard,
    useDeleteCard,
    useArchiveCard,
    useMoveCard,
  };
}
