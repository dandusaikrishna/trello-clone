import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.js";
import { boardMemberController } from "../board-member/board-member.controller.js";
import {
  addBoardMemberSchema,
  boardMemberParamsSchema,
  updateBoardMemberSchema,
} from "../board-member/board-member.validator.js";
import { boardController } from "./board.controller.js";
import {
  boardIdParamSchema,
  createBoardSchema,
  updateBoardSchema,
} from "./board.validator.js";

const boardRoutes = Router();

boardRoutes.get("/starred", boardController.getStarredBoards);
boardRoutes.post("/", validateRequest({ body: createBoardSchema }), boardController.createBoard);
boardRoutes.get("/", boardController.getBoards);
boardRoutes.get(
  "/:boardId",
  validateRequest({ params: boardIdParamSchema }),
  boardController.getBoardDetails,
);
boardRoutes.patch(
  "/:boardId",
  validateRequest({ params: boardIdParamSchema, body: updateBoardSchema }),
  boardController.updateBoard,
);
boardRoutes.delete(
  "/:boardId",
  validateRequest({ params: boardIdParamSchema }),
  boardController.deleteBoard,
);
boardRoutes.patch(
  "/:boardId/close",
  validateRequest({ params: boardIdParamSchema }),
  boardController.closeBoard,
);
boardRoutes.patch(
  "/:boardId/reopen",
  validateRequest({ params: boardIdParamSchema }),
  boardController.reopenBoard,
);
boardRoutes.post(
  "/:boardId/star",
  validateRequest({ params: boardIdParamSchema }),
  boardController.starBoard,
);
boardRoutes.delete(
  "/:boardId/star",
  validateRequest({ params: boardIdParamSchema }),
  boardController.unstarBoard,
);
boardRoutes.get(
  "/:boardId/members",
  validateRequest({ params: boardIdParamSchema }),
  boardMemberController.listBoardMembers,
);
boardRoutes.post(
  "/:boardId/members",
  validateRequest({ params: boardIdParamSchema, body: addBoardMemberSchema }),
  boardMemberController.addBoardMember,
);
boardRoutes.patch(
  "/:boardId/members/:userId",
  validateRequest({ params: boardMemberParamsSchema, body: updateBoardMemberSchema }),
  boardMemberController.updateBoardMember,
);
boardRoutes.delete(
  "/:boardId/members/:userId",
  validateRequest({ params: boardMemberParamsSchema }),
  boardMemberController.removeBoardMember,
);

export default boardRoutes;
