import { Router } from "express";
import { authenticateUser } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validate-request.js";
import { authController } from "./auth.controller.js";
import { loginSchema } from "./auth.validator.js";

const authRoutes = Router();

authRoutes.post(
  "/login",
  validateRequest({ body: loginSchema }),
  authController.login,
);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", authenticateUser, authController.me);

export default authRoutes;
