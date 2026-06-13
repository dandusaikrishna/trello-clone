import { z } from "zod";

export const addBoardMemberSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["ADMIN", "MEMBER", "OBSERVER"]).default("MEMBER"),
});

export const updateBoardMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "OBSERVER"]),
});

export const boardMemberParamsSchema = z.object({
  boardId: z.uuid(),
  userId: z.uuid(),
});

export type AddBoardMemberInput = z.infer<typeof addBoardMemberSchema>;
export type UpdateBoardMemberInput = z.infer<typeof updateBoardMemberSchema>;
