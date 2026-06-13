import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.js";
import { checklistController } from "./checklist.controller.js";
import {
  checklistItemIdParamSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from "./checklist.validator.js";

const checklistItemRoutes = Router();

checklistItemRoutes.post(
  "/",
  validateRequest({ body: createChecklistItemSchema }),
  checklistController.createChecklistItem,
);
checklistItemRoutes.patch(
  "/:itemId",
  validateRequest({ params: checklistItemIdParamSchema, body: updateChecklistItemSchema }),
  checklistController.updateChecklistItem,
);
checklistItemRoutes.delete(
  "/:itemId",
  validateRequest({ params: checklistItemIdParamSchema }),
  checklistController.deleteChecklistItem,
);

export { checklistItemRoutes };
