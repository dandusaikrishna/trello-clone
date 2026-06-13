import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { toLabelResponse } from "../../shared/utils/serializers.js";
import { activityService } from "../activity/activity.service.js";
import { boardService } from "../board/board.service.js";
import { cardRepository } from "../card/card.repository.js";
import { labelRepository } from "./label.repository.js";
import type { AssignLabelInput, CreateLabelInput } from "./label.validator.js";

export class LabelService {
  async createLabel(input: CreateLabelInput, userId: string) {
    await boardService.assertBoardAccess(input.boardId, userId, "MEMBER");
    const label = await labelRepository.create(input.boardId, input.name, input.color);
    return toLabelResponse(label);
  }

  async assignLabelToCard(cardId: string, input: AssignLabelInput, userId: string) {
    const card = await cardRepository.findById(cardId);

    if (!card) {
      throw new AppError("Card not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(card.list.boardId, userId, "MEMBER");

    const label = await labelRepository.findById(input.labelId);

    if (!label || label.boardId !== card.list.boardId) {
      throw new AppError("Label not found on this board", HTTP_STATUS.NOT_FOUND);
    }

    const assignment = await labelRepository.assignToCard(cardId, input.labelId);

    await activityService.log({
      type: "LABEL_ADDED",
      message: `Label "${label.name}" was added to "${card.title}"`,
      boardId: card.list.boardId,
      cardId,
      userId,
      metadata: { labelId: input.labelId },
    });

    return assignment;
  }

  async removeLabelFromCard(cardId: string, labelId: string, userId: string) {
    const card = await cardRepository.findById(cardId);

    if (!card) {
      throw new AppError("Card not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(card.list.boardId, userId, "MEMBER");

    const label = await labelRepository.findById(labelId);

    await labelRepository.removeFromCard(cardId, labelId);

    await activityService.log({
      type: "LABEL_REMOVED",
      message: `Label "${label?.name ?? "Label"}" was removed from "${card.title}"`,
      boardId: card.list.boardId,
      cardId,
      userId,
      metadata: { labelId },
    });
  }
}

export const labelService = new LabelService();
