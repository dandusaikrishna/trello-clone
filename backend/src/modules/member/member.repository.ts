import { prisma } from "../../db/prisma.js";

export class MemberRepository {
  async findAllInWorkspace(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });
  }

  async findById(memberId: string) {
    return prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });
  }

  async assignToCard(cardId: string, userId: string) {
    return prisma.cardMember.create({
      data: { cardId, userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async removeFromCard(cardId: string, userId: string) {
    return prisma.cardMember.delete({
      where: {
        cardId_userId: { cardId, userId },
      },
    });
  }
}

export const memberRepository = new MemberRepository();
