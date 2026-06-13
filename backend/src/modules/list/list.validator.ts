import { z } from "zod";

export const createListSchema = z.object({
  boardId: z.uuid(),
  title: z.string().min(1).max(255),
});

export const updateListSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

export const listIdParamSchema = z.object({
  listId: z.uuid(),
});

export const reorderListsSchema = z.object({
  boardId: z.uuid(),
  lists: z
    .array(
      z.object({
        id: z.uuid(),
        position: z.number().int().min(0),
      }),
    )
    .min(1),
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type ReorderListsInput = z.infer<typeof reorderListsSchema>;
