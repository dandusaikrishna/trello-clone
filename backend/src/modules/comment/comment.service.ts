import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { toCommentResponse } from "../../shared/utils/serializers.js";
import { activityService } from "../activity/activity.service.js";
import { boardRepository } from "../board/board.repository.js";
import { boardService } from "../board/board.service.js";
import { cardRepository } from "../card/card.repository.js";
import { commentRepository } from "./comment.repository.js";
import type { CreateCommentInput, UpdateCommentInput } from "./comment.validator.js";

export class CommentService {
  async createComment(cardId: string, input: CreateCommentInput, userId: string) {
    const card = await cardRepository.findById(cardId);

    if (!card) {
      throw new AppError("Card not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(card.list.boardId, userId, "OBSERVER");

    const comment = await commentRepository.create(cardId, userId, input.content);

    await activityService.log({
      type: "COMMENT_CREATED",
      message: `A comment was added to "${card.title}"`,
      boardId: card.list.boardId,
      cardId,
      userId,
    });

    return toCommentResponse(comment);
  }

  async updateComment(commentId: string, input: UpdateCommentInput, userId: string) {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
      throw new AppError("Comment not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(comment.card.list.boardId, userId, "OBSERVER");

    if (comment.userId !== userId) {
      throw new AppError("You can only edit your own comments", HTTP_STATUS.FORBIDDEN);
    }

    const updated = await commentRepository.update(commentId, input.content);

    await activityService.log({
      type: "COMMENT_UPDATED",
      message: `A comment on "${comment.card.title}" was updated`,
      boardId: comment.card.list.boardId,
      cardId: comment.cardId,
      userId,
    });

    return toCommentResponse(updated);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
      throw new AppError("Comment not found", HTTP_STATUS.NOT_FOUND);
    }

    const board = await boardService.assertBoardAccess(
      comment.card.list.boardId,
      userId,
      "OBSERVER",
    );

    const boardMember = await boardRepository.findBoardMember(board.id, userId);
    const isAdmin =
      board.ownerId === userId || boardMember?.role === "ADMIN";

    if (comment.userId !== userId && !isAdmin) {
      throw new AppError("You do not have permission to delete this comment", HTTP_STATUS.FORBIDDEN);
    }

    await commentRepository.delete(commentId);

    await activityService.log({
      type: "COMMENT_DELETED",
      message: `A comment on "${comment.card.title}" was deleted`,
      boardId: comment.card.list.boardId,
      cardId: comment.cardId,
      userId,
    });
  }
}

export const commentService = new CommentService();
