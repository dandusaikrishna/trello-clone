import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import type {
  API_SUCCESS,
  ASSIGN_LABEL_PAYLOAD,
  ASSIGN_MEMBER_PAYLOAD,
  BOARD_DETAILS,
  CREATE_CHECKLIST_ITEM_PAYLOAD,
  CREATE_CHECKLIST_PAYLOAD,
  CREATE_COMMENT_PAYLOAD,
  CREATE_LABEL_PAYLOAD,
  CHECKLIST,
  CHECKLIST_ITEM,
  COMMENT,
  LABEL,
  UPDATE_CHECKLIST_ITEM_PAYLOAD,
  USER,
} from "@/lib/types";

export default function useCardExtras(boardId: string) {
  const queryClient = useQueryClient();

  const updateBoardCache = (
    updater: (prev: BOARD_DETAILS) => BOARD_DETAILS,
  ) => {
    queryClient.setQueryData<BOARD_DETAILS>(["get-board-details", boardId], (prev) =>
      prev ? updater(prev) : prev,
    );
  };

  const useCreateLabel = () =>
    useMutation({
      mutationKey: ["create-label", boardId],
      mutationFn: async (payload: CREATE_LABEL_PAYLOAD) => {
        const { data } = await api.post<API_SUCCESS<LABEL>>("/labels", payload);
        return data.data;
      },
      onSuccess: (label) => {
        updateBoardCache((prev) => ({
          ...prev,
          labels: [...prev.labels, label],
        }));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const useAssignLabel = () =>
    useMutation({
      mutationKey: ["assign-label", boardId],
      mutationFn: async ({
        cardId,
        payload,
      }: {
        cardId: string;
        payload: ASSIGN_LABEL_PAYLOAD;
      }) => {
        await api.post(`/cards/${cardId}/labels`, payload);
        return payload.labelId;
      },
      onSuccess: (labelId, { cardId }) => {
        updateBoardCache((prev) => {
          const label = prev.labels.find((item) => item.id === labelId);
          if (!label) {
            return prev;
          }

          return {
            ...prev,
            lists: prev.lists.map((list) => ({
              ...list,
              cards: list.cards.map((card) =>
                card.id === cardId && !card.labels.some((item) => item.id === labelId)
                  ? { ...card, labels: [...card.labels, label] }
                  : card,
              ),
            })),
          };
        });
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const useRemoveLabel = () =>
    useMutation({
      mutationKey: ["remove-label", boardId],
      mutationFn: async ({
        cardId,
        labelId,
      }: {
        cardId: string;
        labelId: string;
      }) => {
        await api.delete(`/cards/${cardId}/labels/${labelId}`);
      },
      onSuccess: (_data, { cardId, labelId }) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    labels: card.labels.filter((label) => label.id !== labelId),
                  }
                : card,
            ),
          })),
        }));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const useAssignMember = () =>
    useMutation({
      mutationKey: ["assign-member", boardId],
      mutationFn: async ({
        cardId,
        payload,
      }: {
        cardId: string;
        payload: ASSIGN_MEMBER_PAYLOAD;
      }) => {
        const { data } = await api.post<API_SUCCESS<USER>>(
          `/cards/${cardId}/members`,
          payload,
        );
        return data.data;
      },
      onSuccess: (member, { cardId }) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId && !card.members.some((item) => item.id === member.id)
                ? { ...card, members: [...card.members, member] }
                : card,
            ),
          })),
        }));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const useRemoveMember = () =>
    useMutation({
      mutationKey: ["remove-member", boardId],
      mutationFn: async ({
        cardId,
        memberId,
      }: {
        cardId: string;
        memberId: string;
      }) => {
        await api.delete(`/cards/${cardId}/members/${memberId}`);
      },
      onSuccess: (_data, { cardId, memberId }) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    members: card.members.filter((member) => member.id !== memberId),
                  }
                : card,
            ),
          })),
        }));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const useCreateChecklist = () =>
    useMutation({
      mutationKey: ["create-checklist", boardId],
      mutationFn: async ({
        cardId,
        payload,
      }: {
        cardId: string;
        payload: CREATE_CHECKLIST_PAYLOAD;
      }) => {
        const { data } = await api.post<API_SUCCESS<CHECKLIST>>(
          `/cards/${cardId}/checklists`,
          payload,
        );
        return data.data;
      },
      onSuccess: (checklist, { cardId }) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    checklists: [...card.checklists, { ...checklist, items: [] }],
                  }
                : card,
            ),
          })),
        }));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const useCreateChecklistItem = () =>
    useMutation({
      mutationKey: ["create-checklist-item", boardId],
      mutationFn: async (payload: CREATE_CHECKLIST_ITEM_PAYLOAD) => {
        const { data } = await api.post<API_SUCCESS<CHECKLIST_ITEM>>(
          "/checklist-items",
          payload,
        );
        return data.data;
      },
      onSuccess: (item) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) => ({
              ...card,
              checklists: card.checklists.map((checklist) =>
                checklist.id === item.checklistId
                  ? { ...checklist, items: [...checklist.items, item] }
                  : checklist,
              ),
            })),
          })),
        }));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const useUpdateChecklistItem = () =>
    useMutation({
      mutationKey: ["update-checklist-item", boardId],
      mutationFn: async ({
        itemId,
        payload,
      }: {
        itemId: string;
        payload: UPDATE_CHECKLIST_ITEM_PAYLOAD;
      }) => {
        const { data } = await api.patch<API_SUCCESS<CHECKLIST_ITEM>>(
          `/checklist-items/${itemId}`,
          payload,
        );
        return data.data;
      },
      onSuccess: (item) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) => ({
              ...card,
              checklists: card.checklists.map((checklist) =>
                checklist.id === item.checklistId
                  ? {
                      ...checklist,
                      items: checklist.items.map((existing) =>
                        existing.id === item.id ? item : existing,
                      ),
                    }
                  : checklist,
              ),
            })),
          })),
        }));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  const useCreateComment = () =>
    useMutation({
      mutationKey: ["create-comment", boardId],
      mutationFn: async ({
        cardId,
        payload,
      }: {
        cardId: string;
        payload: CREATE_COMMENT_PAYLOAD;
      }) => {
        const { data } = await api.post<API_SUCCESS<COMMENT>>(
          `/cards/${cardId}/comments`,
          payload,
        );
        return data.data;
      },
      onSuccess: (comment, { cardId }) => {
        updateBoardCache((prev) => ({
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card.id === cardId
                ? { ...card, comments: [...(card.comments ?? []), comment] }
                : card,
            ),
          })),
        }));
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  return {
    useCreateLabel,
    useAssignLabel,
    useRemoveLabel,
    useAssignMember,
    useRemoveMember,
    useCreateChecklist,
    useCreateChecklistItem,
    useUpdateChecklistItem,
    useCreateComment,
  };
}
