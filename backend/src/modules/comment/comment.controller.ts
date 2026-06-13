import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { commentService } from "./comment.service.js";
import type { CreateCommentInput, UpdateCommentInput } from "./comment.validator.js";

export class CommentController {
  createComment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateCommentInput;
    const comment = await commentService.createComment(
      getRouteParam(req, "cardId"),
      input,
      req.user.id,
    );
    sendSuccess(res, comment, HTTP_STATUS.CREATED);
  });

  updateComment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as UpdateCommentInput;
    const comment = await commentService.updateComment(
      getRouteParam(req, "commentId"),
      input,
      req.user.id,
    );
    sendSuccess(res, comment);
  });

  deleteComment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await commentService.deleteComment(getRouteParam(req, "commentId"), req.user.id);
    sendSuccess(res, { deleted: true });
  });
}

export const commentController = new CommentController();
