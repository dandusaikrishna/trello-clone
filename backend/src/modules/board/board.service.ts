import type { BoardRole } from "../../generated/prisma/client.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import {
  toAttachmentResponse,
  toBoardMemberResponse,
  toCardResponse,
  toChecklistItemResponse,
  toCommentResponse,
  toLabelResponse,
  toMemberResponse,
} from "../../shared/utils/serializers.js";
import { activityService } from "../activity/activity.service.js";
import { boardRepository } from "./board.repository.js";
import type { CreateBoardInput, UpdateBoardInput } from "./board.validator.js";

const ROLE_RANK: Record<BoardRole | "OWNER", number> = {
  OBSERVER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export type RequiredBoardRole = "OBSERVER" | "MEMBER" | "ADMIN";

export class BoardService {
  async createBoard(input: CreateBoardInput, ownerId: string) {
    const workspaceMember = await boardRepository.findWorkspaceMember(
      input.workspaceId,
      ownerId,
    );

    if (!workspaceMember) {
      throw new AppError("You do not have access to this workspace", HTTP_STATUS.FORBIDDEN);
    }

    const board = await boardRepository.create(input.title, ownerId, input.workspaceId, {
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.backgroundColor !== undefined ? { backgroundColor: input.backgroundColor } : {}),
      ...(input.backgroundImageUrl !== undefined
        ? { backgroundImageUrl: input.backgroundImageUrl }
        : {}),
    });

    await activityService.log({
      type: "BOARD_CREATED",
      message: `Board "${board.title}" was created`,
      boardId: board.id,
      userId: ownerId,
    });

    return board;
  }

  async getBoards(userId: string) {
    const boards = await boardRepository.findAllForUser(userId);
    return boards.map((board) => ({
      id: board.id,
      title: board.title,
      ownerId: board.ownerId,
      workspaceId: board.workspaceId,
      visibility: board.visibility,
      isClosed: board.isClosed,
      backgroundColor: board.backgroundColor ?? undefined,
      backgroundImageUrl: board.backgroundImageUrl ?? undefined,
      isStarred: board.stars.length > 0,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    }));
  }

  async getStarredBoards(userId: string) {
    const stars = await boardRepository.findStarredBoards(userId);
    return stars.map((star) => ({
      id: star.board.id,
      title: star.board.title,
      ownerId: star.board.ownerId,
      workspaceId: star.board.workspaceId,
      visibility: star.board.visibility,
      isClosed: star.board.isClosed,
      backgroundColor: star.board.backgroundColor ?? undefined,
      backgroundImageUrl: star.board.backgroundImageUrl ?? undefined,
      isStarred: true,
      createdAt: star.board.createdAt,
      updatedAt: star.board.updatedAt,
    }));
  }

  async getBoardDetails(boardId: string, userId: string) {
    await this.assertBoardAccess(boardId, userId, "OBSERVER");

    const board = await boardRepository.findById(boardId);

    if (!board) {
      throw new AppError("Board not found", HTTP_STATUS.NOT_FOUND);
    }

    const isStarred = await boardRepository.isStarred(boardId, userId);

    const lists = board.lists.map((list) => ({
      id: list.id,
      boardId: list.boardId,
      title: list.title,
      position: list.position,
      status: list.status,
      archivedAt: list.archivedAt,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      cards: list.cards.map((card) => ({
        ...toCardResponse(card),
        labels: card.labels.map((cardLabel) => toLabelResponse(cardLabel.label)),
        members: card.members.map((member) => toMemberResponse(member.user)),
        checklists: card.checklists.map((checklist) => ({
          id: checklist.id,
          cardId: checklist.cardId,
          title: checklist.title,
          createdAt: checklist.createdAt,
          items: checklist.items.map((item) => toChecklistItemResponse(item)),
        })),
        comments: card.comments.map((comment) => toCommentResponse(comment)),
        attachments: card.attachments.map((attachment) => toAttachmentResponse(attachment)),
        coverAttachment: card.coverAttachment
          ? toAttachmentResponse(card.coverAttachment)
          : undefined,
      })),
    }));

    return {
      board: {
        id: board.id,
        title: board.title,
        ownerId: board.ownerId,
        workspaceId: board.workspaceId,
        visibility: board.visibility,
        isClosed: board.isClosed,
        backgroundColor: board.backgroundColor ?? undefined,
        backgroundImageUrl: board.backgroundImageUrl ?? undefined,
        isStarred,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      },
      members: board.members.map((member) => toBoardMemberResponse(member)),
      lists,
      labels: board.labels.map((label) => toLabelResponse(label)),
    };
  }

  async updateBoard(boardId: string, input: UpdateBoardInput, userId: string) {
    await this.assertBoardAccess(boardId, userId, "ADMIN");

    if (
      input.title === undefined &&
      input.visibility === undefined &&
      input.backgroundColor === undefined &&
      input.backgroundImageUrl === undefined
    ) {
      throw new AppError("No fields to update", HTTP_STATUS.BAD_REQUEST);
    }

    const updated = await boardRepository.update(boardId, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.backgroundColor !== undefined ? { backgroundColor: input.backgroundColor } : {}),
      ...(input.backgroundImageUrl !== undefined
        ? { backgroundImageUrl: input.backgroundImageUrl }
        : {}),
    });

    await activityService.log({
      type: "BOARD_UPDATED",
      message: `Board "${updated.title}" was updated`,
      boardId: updated.id,
      userId,
      metadata: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
        ...(input.backgroundColor !== undefined ? { backgroundColor: input.backgroundColor } : {}),
        ...(input.backgroundImageUrl !== undefined
          ? { backgroundImageUrl: input.backgroundImageUrl }
          : {}),
      },
    });

    return updated;
  }

  async closeBoard(boardId: string, userId: string) {
    await this.assertBoardAccess(boardId, userId, "ADMIN");

    const updated = await boardRepository.update(boardId, { isClosed: true });

    await activityService.log({
      type: "BOARD_CLOSED",
      message: `Board "${updated.title}" was closed`,
      boardId: updated.id,
      userId,
    });

    return updated;
  }

  async reopenBoard(boardId: string, userId: string) {
    await this.assertBoardAccess(boardId, userId, "ADMIN");

    const updated = await boardRepository.update(boardId, { isClosed: false });

    await activityService.log({
      type: "BOARD_REOPENED",
      message: `Board "${updated.title}" was reopened`,
      boardId: updated.id,
      userId,
    });

    return updated;
  }

  async deleteBoard(boardId: string, userId: string) {
    const board = await this.assertBoardAccess(boardId, userId, "ADMIN");

    if (board.ownerId !== userId) {
      throw new AppError("Only the board owner can delete this board", HTTP_STATUS.FORBIDDEN);
    }

    await boardRepository.delete(boardId);
  }

  async starBoard(boardId: string, userId: string) {
    await this.assertBoardAccess(boardId, userId, "OBSERVER");
    await boardRepository.addStar(userId, boardId);
    return { starred: true };
  }

  async unstarBoard(boardId: string, userId: string) {
    await this.assertBoardAccess(boardId, userId, "OBSERVER");

    try {
      await boardRepository.removeStar(userId, boardId);
    } catch {
      // idempotent
    }

    return { starred: false };
  }

  async assertBoardAccess(
    boardId: string,
    userId: string,
    requiredRole: RequiredBoardRole = "OBSERVER",
  ) {
    const board = await boardRepository.findByIdSimple(boardId);

    if (!board) {
      throw new AppError("Board not found", HTTP_STATUS.NOT_FOUND);
    }

    if (board.ownerId === userId) {
      return board;
    }

    const boardMember = board.members.find((member) => member.userId === userId);

    if (boardMember) {
      const memberRank = ROLE_RANK[boardMember.role];
      const requiredRank = ROLE_RANK[requiredRole];

      if (memberRank < requiredRank) {
        throw new AppError("You do not have access to this board", HTTP_STATUS.FORBIDDEN);
      }
      return board;
    }

    if (board.visibility === "WORKSPACE") {
      const workspaceMember = await boardRepository.findWorkspaceMember(
        board.workspaceId,
        userId,
      );

      if (workspaceMember) {
        if (requiredRole !== "OBSERVER") {
          throw new AppError("You do not have access to this board", HTTP_STATUS.FORBIDDEN);
        }
        return board;
      }
    }

    if (board.visibility === "PUBLIC") {
      if (requiredRole !== "OBSERVER") {
        throw new AppError("You do not have access to this board", HTTP_STATUS.FORBIDDEN);
      }
      return board;
    }

    throw new AppError("You do not have access to this board", HTTP_STATUS.FORBIDDEN);
  }

  async assertBoardMember(boardId: string, userId: string) {
    const board = await boardRepository.findByIdSimple(boardId);

    if (!board) {
      throw new AppError("Board not found", HTTP_STATUS.NOT_FOUND);
    }

    if (board.ownerId === userId) {
      return true;
    }

    const member = board.members.find((entry) => entry.userId === userId);
    return Boolean(member);
  }
}

export const boardService = new BoardService();
