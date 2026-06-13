import { prisma } from "../../db/prisma.js";

export class CommentRepository {
  async create(cardId: string, userId: string, content: string) {
    return prisma.comment.create({
      data: { cardId, userId, content },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async findById(commentId: string) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        card: {
          include: { list: true },
        },
      },
    });
  }

  async update(commentId: string, content: string) {
    return prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async delete(commentId: string) {
    return prisma.comment.delete({ where: { id: commentId } });
  }
}

export const commentRepository = new CommentRepository();
