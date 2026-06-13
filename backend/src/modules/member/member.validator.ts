import { z } from "zod";

export const getMembersQuerySchema = z.object({
  workspaceId: z.uuid(),
});

export const assignMemberSchema = z.object({
  memberId: z.uuid(),
});

export const cardMemberParamsSchema = z.object({
  cardId: z.uuid(),
  memberId: z.uuid(),
});

export type AssignMemberInput = z.infer<typeof assignMemberSchema>;
export type GetMembersQuery = z.infer<typeof getMembersQuerySchema>;
