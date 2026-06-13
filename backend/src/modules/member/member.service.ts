import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { toMemberResponse } from "../../shared/utils/serializers.js";
import { activityService } from "../activity/activity.service.js";
import { boardService } from "../board/board.service.js";
import { cardRepository } from "../card/card.repository.js";
import { workspaceRepository } from "../workspace/workspace.repository.js";
import { memberRepository } from "./member.repository.js";
import type { AssignMemberInput, GetMembersQuery } from "./member.validator.js";

export class MemberService {
  async getMembers(query: GetMembersQuery, userId: string) {
    const membership = await workspaceRepository.findMember(query.workspaceId, userId);

    if (!membership) {
      throw new AppError("You do not have access to this workspace", HTTP_STATUS.FORBIDDEN);
    }

    const members = await memberRepository.findAllInWorkspace(query.workspaceId);
    return members.map((member) => toMemberResponse(member.user));
  }

  async assignMemberToCard(cardId: string, input: AssignMemberInput, userId: string) {
    const card = await cardRepository.findById(cardId);

    if (!card) {
      throw new AppError("Card not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(card.list.boardId, userId, "MEMBER");

    const isBoardMember = await boardService.assertBoardMember(card.list.boardId, input.memberId);

    if (!isBoardMember) {
      throw new AppError("User must be a board member to be assigned to a card", HTTP_STATUS.BAD_REQUEST);
    }

    const member = await memberRepository.findById(input.memberId);

    if (!member) {
      throw new AppError("Member not found", HTTP_STATUS.NOT_FOUND);
    }

    const assignment = await memberRepository.assignToCard(cardId, input.memberId);

    await activityService.log({
      type: "MEMBER_ASSIGNED",
      message: `${member.name} was assigned to "${card.title}"`,
      boardId: card.list.boardId,
      cardId,
      userId,
    });

    return toMemberResponse(assignment.user);
  }

  async removeMemberFromCard(cardId: string, memberId: string, userId: string) {
    const card = await cardRepository.findById(cardId);

    if (!card) {
      throw new AppError("Card not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(card.list.boardId, userId, "MEMBER");

    const member = await memberRepository.findById(memberId);

    await memberRepository.removeFromCard(cardId, memberId);

    await activityService.log({
      type: "MEMBER_UNASSIGNED",
      message: `${member?.name ?? "Member"} was unassigned from "${card.title}"`,
      boardId: card.list.boardId,
      cardId,
      userId,
    });
  }
}

export const memberService = new MemberService();
