import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import attachmentRoutes from "../modules/attachment/attachment.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import boardRoutes from "../modules/board/board.routes.js";
import { checklistItemRoutes } from "../modules/checklist/checklist.routes.js";
import cardRoutes from "../modules/card/card.routes.js";
import commentRoutes from "../modules/comment/comment.routes.js";
import labelRoutes from "../modules/label/label.routes.js";
import listRoutes from "../modules/list/list.routes.js";
import memberRoutes from "../modules/member/member.routes.js";
import workspaceRoutes from "../modules/workspace/workspace.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);

apiRouter.use(authenticateUser);

apiRouter.use("/workspaces", workspaceRoutes);
apiRouter.use("/boards", boardRoutes);
apiRouter.use("/lists", listRoutes);
apiRouter.use("/cards", cardRoutes);
apiRouter.use("/comments", commentRoutes);
apiRouter.use("/attachments", attachmentRoutes);
apiRouter.use("/labels", labelRoutes);
apiRouter.use("/members", memberRoutes);
apiRouter.use("/checklist-items", checklistItemRoutes);

export default apiRouter;
