import type { BoardRole, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

export class BoardRepository {
  async create(
    title: string,
    ownerId: string,
    workspaceId: string,
    data?: {
      visibility?: Prisma.BoardCreateInput["visibility"];
      backgroundColor?: string | null;
      backgroundImageUrl?: string | null;
    },
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const board = await tx.board.create({
        data: {
          title,
          ownerId,
          workspaceId,
          ...(data?.visibility !== undefined
            ? { visibility: data.visibility }
            : {}),
          ...(data?.backgroundColor !== undefined
            ? { backgroundColor: data.backgroundColor }
            : {}),
          ...(data?.backgroundImageUrl !== undefined
            ? { backgroundImageUrl: data.backgroundImageUrl }
            : {}),
        },
      });

      await tx.boardMember.create({
        data: {
          boardId: board.id,
          userId: ownerId,
          role: "ADMIN",
        },
      });

      return board;
    });
  }

  async findAllForUser(userId: string) {
    return prisma.board.findMany({
      where: {
        isClosed: false,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          {
            visibility: { in: ["WORKSPACE", "PUBLIC"] },
            workspace: { members: { some: { userId } } },
          },
          { visibility: "PUBLIC" },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        stars: {
          where: { userId },
          select: { userId: true },
        },
      },
    });
  }

  async findById(boardId: string) {
    return prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        lists: {
          where: { status: "ACTIVE" },
          orderBy: { position: "asc" },
          include: {
            cards: {
              where: { status: "ACTIVE" },
              orderBy: { position: "asc" },
              include: {
                labels: { include: { label: true } },
                members: {
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
                },
                checklists: {
                  include: {
                    items: {
                      orderBy: { position: "asc" },
                      include: {
                        assignedTo: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
                comments: {
                  orderBy: { createdAt: "asc" },
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
                },
                attachments: true,
                coverAttachment: true,
              },
            },
          },
        },
        labels: true,
      },
    });
  }

  async findByIdSimple(boardId: string) {
    return prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: true,
      },
    });
  }

  async update(boardId: string, data: Prisma.BoardUpdateInput) {
    return prisma.board.update({
      where: { id: boardId },
      data,
    });
  }

  async delete(boardId: string) {
    return prisma.board.delete({ where: { id: boardId } });
  }

  async findBoardMember(boardId: string, userId: string) {
    return prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
  }

  async findWorkspaceMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  async isStarred(boardId: string, userId: string) {
    const star = await prisma.boardStar.findUnique({
      where: { userId_boardId: { userId, boardId } },
    });
    return Boolean(star);
  }

  async findStarredBoards(userId: string) {
    return prisma.boardStar.findMany({
      where: { userId },
      include: {
        board: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async addStar(userId: string, boardId: string) {
    return prisma.boardStar.upsert({
      where: { userId_boardId: { userId, boardId } },
      create: { userId, boardId },
      update: {},
    });
  }

  async removeStar(userId: string, boardId: string) {
    return prisma.boardStar.delete({
      where: { userId_boardId: { userId, boardId } },
    });
  }

  async listBoardMembers(boardId: string) {
    return prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  }

  async addBoardMember(boardId: string, userId: string, role: BoardRole) {
    return prisma.boardMember.create({
      data: { boardId, userId, role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async updateBoardMemberRole(
    boardId: string,
    userId: string,
    role: BoardRole,
  ) {
    return prisma.boardMember.update({
      where: { boardId_userId: { boardId, userId } },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async removeBoardMember(boardId: string, userId: string) {
    return prisma.boardMember.delete({
      where: { boardId_userId: { boardId, userId } },
    });
  }
}

export const boardRepository = new BoardRepository();
