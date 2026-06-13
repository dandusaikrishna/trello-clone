import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { boardMemberService } from "./board-member.service.js";
import type { AddBoardMemberInput, UpdateBoardMemberInput } from "./board-member.validator.js";

export class BoardMemberController {
  listBoardMembers = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const members = await boardMemberService.listBoardMembers(
      getRouteParam(req, "boardId"),
      req.user.id,
    );
    sendSuccess(res, members);
  });

  addBoardMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as AddBoardMemberInput;
    const member = await boardMemberService.addBoardMember(
      getRouteParam(req, "boardId"),
      input,
      req.user.id,
    );
    sendSuccess(res, member, HTTP_STATUS.CREATED);
  });

  updateBoardMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as UpdateBoardMemberInput;
    const member = await boardMemberService.updateBoardMember(
      getRouteParam(req, "boardId"),
      getRouteParam(req, "userId"),
      input,
      req.user.id,
    );
    sendSuccess(res, member);
  });

  removeBoardMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await boardMemberService.removeBoardMember(
      getRouteParam(req, "boardId"),
      getRouteParam(req, "userId"),
      req.user.id,
    );
    sendSuccess(res, { removed: true });
  });
}

export const boardMemberController = new BoardMemberController();
