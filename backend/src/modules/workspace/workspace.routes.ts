import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.js";
import { workspaceController } from "./workspace.controller.js";
import {
  addWorkspaceMemberSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdParamSchema,
  workspaceMemberParamsSchema,
} from "./workspace.validator.js";

const workspaceRoutes = Router();

workspaceRoutes.post(
  "/",
  validateRequest({ body: createWorkspaceSchema }),
  workspaceController.createWorkspace,
);
workspaceRoutes.get("/", workspaceController.getWorkspaces);
workspaceRoutes.get(
  "/:workspaceId",
  validateRequest({ params: workspaceIdParamSchema }),
  workspaceController.getWorkspaceDetails,
);
workspaceRoutes.patch(
  "/:workspaceId",
  validateRequest({ params: workspaceIdParamSchema, body: updateWorkspaceSchema }),
  workspaceController.updateWorkspace,
);
workspaceRoutes.delete(
  "/:workspaceId",
  validateRequest({ params: workspaceIdParamSchema }),
  workspaceController.deleteWorkspace,
);
workspaceRoutes.post(
  "/:workspaceId/members",
  validateRequest({ params: workspaceIdParamSchema, body: addWorkspaceMemberSchema }),
  workspaceController.addWorkspaceMember,
);
workspaceRoutes.delete(
  "/:workspaceId/members/:userId",
  validateRequest({ params: workspaceMemberParamsSchema }),
  workspaceController.removeWorkspaceMember,
);

export default workspaceRoutes;
