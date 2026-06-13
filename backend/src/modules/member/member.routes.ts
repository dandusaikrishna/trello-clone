import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.js";
import { memberController } from "./member.controller.js";
import { getMembersQuerySchema } from "./member.validator.js";

const memberRoutes = Router();

memberRoutes.get(
  "/",
  validateRequest({ query: getMembersQuerySchema }),
  memberController.getMembers,
);

export default memberRoutes;
