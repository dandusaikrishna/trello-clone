import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { toMemberResponse } from "../../shared/utils/serializers.js";
import { activityService } from "../activity/activity.service.js";
import { workspaceRepository } from "./workspace.repository.js";
import type {
  AddWorkspaceMemberInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "./workspace.validator.js";

export class WorkspaceService {
  async createWorkspace(input: CreateWorkspaceInput, userId: string) {
    const workspace = await workspaceRepository.create(input.name, input.slug, userId);

    await activityService.log({
      type: "WORKSPACE_CREATED",
      message: `Workspace "${workspace.name}" was created`,
      userId,
      metadata: { workspaceId: workspace.id },
    });

    return workspace;
  }

  async getWorkspaces(userId: string) {
    return workspaceRepository.findAllForUser(userId);
  }

  async getWorkspaceDetails(workspaceId: string, userId: string) {
    await this.assertWorkspaceAccess(workspaceId, userId);

    const workspace = await workspaceRepository.findById(workspaceId);

    if (!workspace) {
      throw new AppError("Workspace not found", HTTP_STATUS.NOT_FOUND);
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      members: workspace.members.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: toMemberResponse(member.user),
      })),
      boards: workspace.boards.map((board) => ({
        id: board.id,
        title: board.title,
        ownerId: board.ownerId,
        workspaceId: board.workspaceId,
        visibility: board.visibility,
        isClosed: board.isClosed,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      })),
    };
  }

  async updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput, userId: string) {
    await this.assertWorkspaceAdmin(workspaceId, userId);

    if (!input.name) {
      throw new AppError("No fields to update", HTTP_STATUS.BAD_REQUEST);
    }

    return workspaceRepository.update(workspaceId, input.name);
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    await workspaceRepository.delete(workspaceId);
  }

  async addWorkspaceMember(
    workspaceId: string,
    input: AddWorkspaceMemberInput,
    userId: string,
  ) {
    await this.assertWorkspaceAdmin(workspaceId, userId);

    const member = await workspaceRepository.addMember(
      workspaceId,
      input.userId,
      input.role,
    );

    await activityService.log({
      type: "WORKSPACE_MEMBER_ADDED",
      message: `${member.user.name} was added to the workspace`,
      userId,
      metadata: { workspaceId, memberId: input.userId, role: input.role },
    });

    return {
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: toMemberResponse(member.user),
    };
  }

  async removeWorkspaceMember(workspaceId: string, memberUserId: string, userId: string) {
    await this.assertWorkspaceAdmin(workspaceId, userId);

    const member = await workspaceRepository.findMember(workspaceId, memberUserId);

    if (!member) {
      throw new AppError("Workspace member not found", HTTP_STATUS.NOT_FOUND);
    }

    if (member.role === "OWNER") {
      const ownerCount = await workspaceRepository.countOwners(workspaceId);

      if (ownerCount <= 1) {
        throw new AppError("Cannot remove the last workspace owner", HTTP_STATUS.BAD_REQUEST);
      }
    }

    await workspaceRepository.removeMember(workspaceId, memberUserId);

    await activityService.log({
      type: "WORKSPACE_MEMBER_REMOVED",
      message: `A member was removed from the workspace`,
      userId,
      metadata: { workspaceId, memberId: memberUserId },
    });
  }

  async ensurePersonalWorkspace(userId: string, userName: string) {
    return workspaceRepository.ensurePersonalWorkspace(userId, userName);
  }

  private async assertWorkspaceAccess(workspaceId: string, userId: string) {
    const member = await workspaceRepository.findMember(workspaceId, userId);

    if (!member) {
      throw new AppError("You do not have access to this workspace", HTTP_STATUS.FORBIDDEN);
    }

    return member;
  }

  private async assertWorkspaceAdmin(workspaceId: string, userId: string) {
    const member = await this.assertWorkspaceAccess(workspaceId, userId);

    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      throw new AppError("You do not have permission to manage this workspace", HTTP_STATUS.FORBIDDEN);
    }

    return member;
  }

  private async assertWorkspaceOwner(workspaceId: string, userId: string) {
    const member = await this.assertWorkspaceAccess(workspaceId, userId);

    if (member.role !== "OWNER") {
      throw new AppError("Only the workspace owner can perform this action", HTTP_STATUS.FORBIDDEN);
    }

    return member;
  }
}

export const workspaceService = new WorkspaceService();
