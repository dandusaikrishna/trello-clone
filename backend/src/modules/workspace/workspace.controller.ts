import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { workspaceService } from "./workspace.service.js";
import type {
  AddWorkspaceMemberInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "./workspace.validator.js";

export class WorkspaceController {
  createWorkspace = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateWorkspaceInput;
    const workspace = await workspaceService.createWorkspace(input, req.user.id);
    sendSuccess(res, workspace, HTTP_STATUS.CREATED);
  });

  getWorkspaces = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const workspaces = await workspaceService.getWorkspaces(req.user.id);
    sendSuccess(res, workspaces);
  });

  getWorkspaceDetails = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const workspace = await workspaceService.getWorkspaceDetails(
      getRouteParam(req, "workspaceId"),
      req.user.id,
    );
    sendSuccess(res, workspace);
  });

  updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as UpdateWorkspaceInput;
    const workspace = await workspaceService.updateWorkspace(
      getRouteParam(req, "workspaceId"),
      input,
      req.user.id,
    );
    sendSuccess(res, workspace);
  });

  deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await workspaceService.deleteWorkspace(getRouteParam(req, "workspaceId"), req.user.id);
    sendSuccess(res, { deleted: true });
  });

  addWorkspaceMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as AddWorkspaceMemberInput;
    const member = await workspaceService.addWorkspaceMember(
      getRouteParam(req, "workspaceId"),
      input,
      req.user.id,
    );
    sendSuccess(res, member, HTTP_STATUS.CREATED);
  });

  removeWorkspaceMember = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await workspaceService.removeWorkspaceMember(
      getRouteParam(req, "workspaceId"),
      getRouteParam(req, "userId"),
      req.user.id,
    );
    sendSuccess(res, { removed: true });
  });
}

export const workspaceController = new WorkspaceController();
