import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

export class CardRepository {
  async create(listId: string, title: string, position: number) {
    return prisma.card.create({
      data: { listId, title, position },
    });
  }

  async findById(cardId: string) {
    return prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: true,
      },
    });
  }

  async findMaxPosition(listId: string) {
    const result = await prisma.card.aggregate({
      where: { listId, status: "ACTIVE" },
      _max: { position: true },
    });
    return result._max.position ?? 0;
  }

  async update(cardId: string, data: Prisma.CardUpdateInput) {
    return prisma.card.update({
      where: { id: cardId },
      data,
    });
  }

  async delete(cardId: string) {
    return prisma.card.delete({ where: { id: cardId } });
  }

  async findAttachment(attachmentId: string) {
    return prisma.attachment.findUnique({ where: { id: attachmentId } });
  }

  async findActiveCardsInList(listId: string) {
    return prisma.card.findMany({
      where: { listId, status: "ACTIVE" },
      orderBy: { position: "asc" },
    });
  }

  async moveCard(
    cardId: string,
    sourceListId: string,
    destinationListId: string,
    newPosition: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({ where: { id: cardId } });

      if (!card) {
        return null;
      }

      if (sourceListId === destinationListId) {
        const cards = await tx.card.findMany({
          where: { listId: sourceListId, status: "ACTIVE" },
          orderBy: { position: "asc" },
        });

        const filtered = cards.filter((item) => item.id !== cardId);
        filtered.splice(newPosition, 0, card);

        await Promise.all(
          filtered.map((item, index) =>
            tx.card.update({
              where: { id: item.id },
              data: { position: index + 1 },
            }),
          ),
        );

        return tx.card.findUnique({ where: { id: cardId } });
      }

      const sourceCards = await tx.card.findMany({
        where: { listId: sourceListId, status: "ACTIVE", id: { not: cardId } },
        orderBy: { position: "asc" },
      });

      await Promise.all(
        sourceCards.map((item, index) =>
          tx.card.update({
            where: { id: item.id },
            data: { position: index + 1 },
          }),
        ),
      );

      const destinationCards = await tx.card.findMany({
        where: { listId: destinationListId, status: "ACTIVE" },
        orderBy: { position: "asc" },
      });

      destinationCards.splice(newPosition, 0, {
        ...card,
        listId: destinationListId,
      });

      await tx.card.update({
        where: { id: cardId },
        data: { listId: destinationListId },
      });

      await Promise.all(
        destinationCards.map((item, index) =>
          tx.card.update({
            where: { id: item.id },
            data: { position: index + 1 },
          }),
        ),
      );

      return tx.card.findUnique({ where: { id: cardId } });
    });
  }

  async search(query: string, boardId?: string) {
    return prisma.card.findMany({
      where: {
        status: "ACTIVE",
        title: { contains: query, mode: "insensitive" },
        ...(boardId
          ? {
              list: { boardId },
            }
          : {}),
      },
      include: {
        list: { select: { id: true, boardId: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async filter(filters: {
    labelId?: string;
    memberId?: string;
    dueDate?: Date;
    boardId?: string;
  }) {
    return prisma.card.findMany({
      where: {
        status: "ACTIVE",
        ...(filters.labelId
          ? {
              labels: {
                some: { labelId: filters.labelId },
              },
            }
          : {}),
        ...(filters.memberId
          ? {
              members: {
                some: { userId: filters.memberId },
              },
            }
          : {}),
        ...(filters.dueDate
          ? {
              dueDate: filters.dueDate,
            }
          : {}),
        ...(filters.boardId
          ? {
              list: { boardId: filters.boardId },
            }
          : {}),
      },
      include: {
        list: { select: { id: true, boardId: true, title: true } },
        labels: { include: { label: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}

export const cardRepository = new CardRepository();
