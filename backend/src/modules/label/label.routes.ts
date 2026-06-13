import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.js";
import { labelController } from "./label.controller.js";
import { createLabelSchema } from "./label.validator.js";

const labelRoutes = Router();

labelRoutes.post("/", validateRequest({ body: createLabelSchema }), labelController.createLabel);

export default labelRoutes;
