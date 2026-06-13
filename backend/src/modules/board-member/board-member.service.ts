import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { toBoardMemberResponse } from "../../shared/utils/serializers.js";
import { activityService } from "../activity/activity.service.js";
import { boardRepository } from "../board/board.repository.js";
import { boardService } from "../board/board.service.js";
import type { AddBoardMemberInput, UpdateBoardMemberInput } from "./board-member.validator.js";

export class BoardMemberService {
  async listBoardMembers(boardId: string, userId: string) {
    await boardService.assertBoardAccess(boardId, userId, "OBSERVER");
    const members = await boardRepository.listBoardMembers(boardId);
    return members.map((member) => toBoardMemberResponse(member));
  }

  async addBoardMember(boardId: string, input: AddBoardMemberInput, userId: string) {
    const board = await boardService.assertBoardAccess(boardId, userId, "ADMIN");

    const workspaceMember = await boardRepository.findWorkspaceMember(
      board.workspaceId,
      input.userId,
    );

    if (!workspaceMember) {
      throw new AppError("User is not a member of this workspace", HTTP_STATUS.BAD_REQUEST);
    }

    const member = await boardRepository.addBoardMember(boardId, input.userId, input.role);

    await activityService.log({
      type: "BOARD_MEMBER_ADDED",
      message: `${member.user.name} was added to the board`,
      boardId,
      userId,
      metadata: { memberId: input.userId, role: input.role },
    });

    return toBoardMemberResponse(member);
  }

  async updateBoardMember(
    boardId: string,
    memberUserId: string,
    input: UpdateBoardMemberInput,
    userId: string,
  ) {
    const board = await boardService.assertBoardAccess(boardId, userId, "ADMIN");

    if (board.ownerId === memberUserId) {
      throw new AppError("Cannot change the board owner's role", HTTP_STATUS.BAD_REQUEST);
    }

    const member = await boardRepository.updateBoardMemberRole(
      boardId,
      memberUserId,
      input.role,
    );

    return toBoardMemberResponse(member);
  }

  async removeBoardMember(boardId: string, memberUserId: string, userId: string) {
    const board = await boardService.assertBoardAccess(boardId, userId, "ADMIN");

    if (board.ownerId === memberUserId) {
      throw new AppError("Cannot remove the board owner", HTTP_STATUS.BAD_REQUEST);
    }

    await boardRepository.removeBoardMember(boardId, memberUserId);

    await activityService.log({
      type: "BOARD_MEMBER_REMOVED",
      message: `A member was removed from the board`,
      boardId,
      userId,
      metadata: { memberId: memberUserId },
    });
  }
}

export const boardMemberService = new BoardMemberService();
