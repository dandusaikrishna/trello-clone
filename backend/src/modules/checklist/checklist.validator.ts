import { z } from "zod";

export const createChecklistSchema = z.object({
  title: z.string().min(1).max(255),
});

export const createChecklistItemSchema = z.object({
  checklistId: z.uuid(),
  title: z.string().min(1).max(255),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  isCompleted: z.boolean().optional(),
  assignedToId: z.uuid().optional().nullable(),
  dueDate: z.iso.datetime().optional().nullable(),
});

export const cardIdParamSchema = z.object({
  cardId: z.uuid(),
});

export const checklistItemIdParamSchema = z.object({
  itemId: z.uuid(),
});

export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
