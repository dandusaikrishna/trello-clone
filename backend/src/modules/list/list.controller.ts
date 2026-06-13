import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { listService } from "./list.service.js";
import type {
  CreateListInput,
  ReorderListsInput,
  UpdateListInput,
} from "./list.validator.js";

export class ListController {
  createList = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateListInput;
    const list = await listService.createList(input, req.user.id);
    sendSuccess(res, list, HTTP_STATUS.CREATED);
  });

  updateList = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as UpdateListInput;
    const list = await listService.updateList(getRouteParam(req, "listId"), input, req.user.id);
    sendSuccess(res, list);
  });

  deleteList = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await listService.deleteList(getRouteParam(req, "listId"), req.user.id);
    sendSuccess(res, { deleted: true });
  });

  reorderLists = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as ReorderListsInput;
    await listService.reorderLists(input, req.user.id);
    sendSuccess(res, { reordered: true });
  });

  archiveList = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const list = await listService.archiveList(getRouteParam(req, "listId"), req.user.id);
    sendSuccess(res, list);
  });

  restoreList = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const list = await listService.restoreList(getRouteParam(req, "listId"), req.user.id);
    sendSuccess(res, list);
  });
}

export const listController = new ListController();
