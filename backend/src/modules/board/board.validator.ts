import { z } from "zod";

export const createBoardSchema = z.object({
  title: z.string().min(1).max(255),
  workspaceId: z.uuid(),
  visibility: z.enum(["PRIVATE", "WORKSPACE", "PUBLIC"]).optional(),
  backgroundColor: z.string().max(20).optional().nullable(),
  backgroundImageUrl: z.string().url().optional().nullable(),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  visibility: z.enum(["PRIVATE", "WORKSPACE", "PUBLIC"]).optional(),
  backgroundColor: z.string().max(20).optional().nullable(),
  backgroundImageUrl: z.string().url().optional().nullable(),
});

export const boardIdParamSchema = z.object({
  boardId: z.uuid(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
