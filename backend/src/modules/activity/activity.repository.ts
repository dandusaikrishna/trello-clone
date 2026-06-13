import type { ActivityType, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

type CreateActivityInput = {
  type: ActivityType;
  message: string;
  boardId?: string;
  cardId?: string;
  userId?: string;
  metadata?: Prisma.InputJsonValue;
};

export class ActivityRepository {
  async create(input: CreateActivityInput) {
    return prisma.activity.create({
      data: {
        type: input.type,
        message: input.message,
        ...(input.boardId !== undefined ? { boardId: input.boardId } : {}),
        ...(input.cardId !== undefined ? { cardId: input.cardId } : {}),
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    });
  }

  async findByBoardId(boardId: string) {
    return prisma.activity.findMany({
      where: { boardId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }
}

export const activityRepository = new ActivityRepository();
