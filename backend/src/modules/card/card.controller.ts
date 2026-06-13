import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { cardService } from "./card.service.js";
import type {
  CreateCardInput,
  FilterCardsQuery,
  MoveCardInput,
  SearchCardsQuery,
  UpdateCardInput,
} from "./card.validator.js";

export class CardController {
  createCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as CreateCardInput;
    const card = await cardService.createCard(input, req.user.id);
    sendSuccess(res, card, HTTP_STATUS.CREATED);
  });

  updateCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as UpdateCardInput;
    const card = await cardService.updateCard(getRouteParam(req, "cardId"), input, req.user.id);
    sendSuccess(res, card);
  });

  deleteCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await cardService.deleteCard(getRouteParam(req, "cardId"), req.user.id);
    sendSuccess(res, { deleted: true });
  });

  archiveCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const card = await cardService.archiveCard(getRouteParam(req, "cardId"), req.user.id);
    sendSuccess(res, card);
  });

  moveCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as MoveCardInput;
    const card = await cardService.moveCard(input, req.user.id);
    sendSuccess(res, card);
  });

  searchCards = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const query = req.query as unknown as SearchCardsQuery;
    const cards = await cardService.searchCards(query, req.user.id);
    sendSuccess(res, cards);
  });

  filterCards = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const query = req.query as unknown as FilterCardsQuery;
    const cards = await cardService.filterCards(query, req.user.id);
    sendSuccess(res, cards);
  });
}

export const cardController = new CardController();
