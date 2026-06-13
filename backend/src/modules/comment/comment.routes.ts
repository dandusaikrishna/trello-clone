import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.js";
import { commentController } from "./comment.controller.js";
import { commentIdParamSchema, updateCommentSchema } from "./comment.validator.js";

const commentRoutes = Router();

commentRoutes.patch(
  "/:commentId",
  validateRequest({ params: commentIdParamSchema, body: updateCommentSchema }),
  commentController.updateComment,
);
commentRoutes.delete(
  "/:commentId",
  validateRequest({ params: commentIdParamSchema }),
  commentController.deleteComment,
);

export default commentRoutes;
