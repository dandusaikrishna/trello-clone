import type { AttachmentKind } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

export class AttachmentRepository {
  async create(
    cardId: string,
    data: {
      kind: AttachmentKind;
      url: string;
      storagePath?: string | null;
      filename?: string | null;
      mimeType?: string | null;
      sizeBytes?: number | null;
      uploadedById?: string;
    },
  ) {
    return prisma.attachment.create({
      data: {
        cardId,
        kind: data.kind,
        url: data.url,
        ...(data.storagePath !== undefined ? { storagePath: data.storagePath } : {}),
        ...(data.filename !== undefined ? { filename: data.filename } : {}),
        ...(data.mimeType !== undefined ? { mimeType: data.mimeType } : {}),
        ...(data.sizeBytes !== undefined ? { sizeBytes: data.sizeBytes } : {}),
        ...(data.uploadedById !== undefined ? { uploadedById: data.uploadedById } : {}),
      },
    });
  }

  async findById(attachmentId: string) {
    return prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        card: {
          include: { list: true },
        },
      },
    });
  }

  async delete(attachmentId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.card.updateMany({
        where: { coverAttachmentId: attachmentId },
        data: { coverAttachmentId: null },
      });

      return tx.attachment.delete({ where: { id: attachmentId } });
    });
  }
}

export const attachmentRepository = new AttachmentRepository();
