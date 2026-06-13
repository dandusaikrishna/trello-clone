import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { boardService } from "./board.service.js";
import type { CreateBoardInput, UpdateBoardInput } from "./board.validator.js";

export class BoardController {
  createBoard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateBoardInput;
    const board = await boardService.createBoard(input, req.user.id);
    sendSuccess(res, board, HTTP_STATUS.CREATED);
  });

  getBoards = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const boards = await boardService.getBoards(req.user.id);
    sendSuccess(res, boards);
  });

  getStarredBoards = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const boards = await boardService.getStarredBoards(req.user.id);
    sendSuccess(res, boards);
  });

  getBoardDetails = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const board = await boardService.getBoardDetails(getRouteParam(req, "boardId"), req.user.id);
    sendSuccess(res, board);
  });

  updateBoard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as UpdateBoardInput;
    const board = await boardService.updateBoard(
      getRouteParam(req, "boardId"),
      input,
      req.user.id,
    );
    sendSuccess(res, board);
  });

  deleteBoard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await boardService.deleteBoard(getRouteParam(req, "boardId"), req.user.id);
    sendSuccess(res, { deleted: true });
  });

  closeBoard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const board = await boardService.closeBoard(getRouteParam(req, "boardId"), req.user.id);
    sendSuccess(res, board);
  });

  reopenBoard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const board = await boardService.reopenBoard(getRouteParam(req, "boardId"), req.user.id);
    sendSuccess(res, board);
  });

  starBoard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await boardService.starBoard(getRouteParam(req, "boardId"), req.user.id);
    sendSuccess(res, result, HTTP_STATUS.CREATED);
  });

  unstarBoard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await boardService.unstarBoard(getRouteParam(req, "boardId"), req.user.id);
    sendSuccess(res, result);
  });
}

export const boardController = new BoardController();
