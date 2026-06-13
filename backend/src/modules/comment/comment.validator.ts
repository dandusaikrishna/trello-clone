import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const cardIdParamSchema = z.object({
  cardId: z.uuid(),
});

export const commentIdParamSchema = z.object({
  commentId: z.uuid(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
