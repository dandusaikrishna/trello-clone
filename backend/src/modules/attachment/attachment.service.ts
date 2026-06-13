import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { toAttachmentResponse } from "../../shared/utils/serializers.js";
import { createSignedUploadUrl, deleteObject } from "../../shared/utils/supabase-storage.js";
import { activityService } from "../activity/activity.service.js";
import { boardService } from "../board/board.service.js";
import { cardRepository } from "../card/card.repository.js";
import { attachmentRepository } from "./attachment.repository.js";
import type { CreateAttachmentInput, SignUploadInput } from "./attachment.validator.js";

export class AttachmentService {
  async signUpload(input: SignUploadInput, userId: string) {
    const card = await cardRepository.findById(input.cardId);

    if (!card) {
      throw new AppError("Card not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(card.list.boardId, userId, "MEMBER");

    const result = await createSignedUploadUrl(input.cardId, input.filename);
    return result;
  }

  async createAttachment(cardId: string, input: CreateAttachmentInput, userId: string) {
    const card = await cardRepository.findById(cardId);

    if (!card) {
      throw new AppError("Card not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(card.list.boardId, userId, "MEMBER");

    const attachment = await attachmentRepository.create(cardId, {
      kind: input.kind,
      url: input.url,
      storagePath: input.storagePath ?? null,
      filename: input.filename ?? null,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      uploadedById: userId,
    });

    await activityService.log({
      type: "ATTACHMENT_ADDED",
      message: `An attachment was added to "${card.title}"`,
      boardId: card.list.boardId,
      cardId,
      userId,
      metadata: { attachmentId: attachment.id, kind: input.kind },
    });

    return toAttachmentResponse(attachment);
  }

  async deleteAttachment(attachmentId: string, userId: string) {
    const attachment = await attachmentRepository.findById(attachmentId);

    if (!attachment) {
      throw new AppError("Attachment not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(attachment.card.list.boardId, userId, "MEMBER");

    if (attachment.storagePath) {
      try {
        await deleteObject(attachment.storagePath);
      } catch {
        // Continue deleting DB record even if storage cleanup fails
      }
    }

    await attachmentRepository.delete(attachmentId);

    await activityService.log({
      type: "ATTACHMENT_REMOVED",
      message: `An attachment was removed from "${attachment.card.title}"`,
      boardId: attachment.card.list.boardId,
      cardId: attachment.cardId,
      userId,
      metadata: { attachmentId },
    });
  }
}

export const attachmentService = new AttachmentService();
