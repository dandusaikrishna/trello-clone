import type { WorkspaceRole } from "../../generated/prisma/client.js";
import { prisma } from "../../db/prisma.js";

export class WorkspaceRepository {
  async create(name: string, slug: string, ownerId: string) {
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name, slug },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: ownerId,
          role: "OWNER",
        },
      });

      return workspace;
    });
  }

  async findAllForUser(userId: string) {
    return prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(workspaceId: string) {
    return prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        boards: {
          where: { isClosed: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async findMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  async countOwners(workspaceId: string) {
    return prisma.workspaceMember.count({
      where: { workspaceId, role: "OWNER" },
    });
  }

  async update(workspaceId: string, name: string) {
    return prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  }

  async delete(workspaceId: string) {
    return prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole) {
    return prisma.workspaceMember.create({
      data: { workspaceId, userId, role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  async findAnyForUser(userId: string) {
    return prisma.workspaceMember.findFirst({
      where: { userId },
      include: { workspace: true },
    });
  }

  async ensurePersonalWorkspace(userId: string, userName: string) {
    const existing = await this.findAnyForUser(userId);

    if (existing) {
      return existing.workspace;
    }

    const slug = `personal-${userId.slice(0, 8)}`;
    return this.create(`${userName}'s Workspace`, slug, userId);
  }
}

export const workspaceRepository = new WorkspaceRepository();
