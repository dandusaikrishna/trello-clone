import { z } from "zod";

export const signUploadSchema = z.object({
  cardId: z.uuid(),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100).optional(),
  sizeBytes: z.number().int().positive().optional(),
});

export const createAttachmentSchema = z.object({
  url: z.string().url(),
  storagePath: z.string().min(1).max(500).optional(),
  filename: z.string().min(1).max(255).optional(),
  mimeType: z.string().min(1).max(100).optional(),
  sizeBytes: z.number().int().positive().optional(),
  kind: z.enum(["FILE", "LINK"]),
});

export const cardIdParamSchema = z.object({
  cardId: z.uuid(),
});

export const attachmentIdParamSchema = z.object({
  attachmentId: z.uuid(),
});

export type SignUploadInput = z.infer<typeof signUploadSchema>;
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
