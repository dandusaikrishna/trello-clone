import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export const workspaceIdParamSchema = z.object({
  workspaceId: z.uuid(),
});

export const addWorkspaceMemberSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const workspaceMemberParamsSchema = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;
