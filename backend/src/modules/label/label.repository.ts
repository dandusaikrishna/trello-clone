import { prisma } from "../../db/prisma.js";

export class LabelRepository {
  async create(boardId: string, name: string, color: string) {
    return prisma.label.create({
      data: { boardId, name, color },
    });
  }

  async findById(labelId: string) {
    return prisma.label.findUnique({ where: { id: labelId } });
  }

  async assignToCard(cardId: string, labelId: string) {
    return prisma.cardLabel.create({
      data: { cardId, labelId },
    });
  }

  async removeFromCard(cardId: string, labelId: string) {
    return prisma.cardLabel.delete({
      where: {
        cardId_labelId: { cardId, labelId },
      },
    });
  }
}

export const labelRepository = new LabelRepository();
