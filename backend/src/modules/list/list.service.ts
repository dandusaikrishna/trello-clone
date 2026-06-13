import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { activityService } from "../activity/activity.service.js";
import { boardService } from "../board/board.service.js";
import { listRepository } from "./list.repository.js";
import type {
  CreateListInput,
  ReorderListsInput,
  UpdateListInput,
} from "./list.validator.js";

export class ListService {
  async createList(input: CreateListInput, userId: string) {
    await boardService.assertBoardAccess(input.boardId, userId, "MEMBER");

    const maxPosition = await listRepository.findMaxPosition(input.boardId);
    const list = await listRepository.create(input.boardId, input.title, maxPosition + 1);

    await activityService.log({
      type: "LIST_CREATED",
      message: `List "${list.title}" was created`,
      boardId: input.boardId,
      userId,
    });

    return list;
  }

  async updateList(listId: string, input: UpdateListInput, userId: string) {
    const list = await this.getListWithAccess(listId, userId, "MEMBER");

    if (!input.title) {
      throw new AppError("No fields to update", HTTP_STATUS.BAD_REQUEST);
    }

    const updated = await listRepository.update(listId, input.title);

    await activityService.log({
      type: "LIST_UPDATED",
      message: `List "${updated.title}" was updated`,
      boardId: list.boardId,
      userId,
    });

    return updated;
  }

  async deleteList(listId: string, userId: string) {
    const list = await this.getListWithAccess(listId, userId, "MEMBER");
    await listRepository.delete(listId);

    await activityService.log({
      type: "LIST_DELETED",
      message: `List "${list.title}" was deleted`,
      boardId: list.boardId,
      userId,
    });
  }

  async archiveList(listId: string, userId: string) {
    const list = await this.getListWithAccess(listId, userId, "MEMBER");

    if (list.status === "ARCHIVED") {
      throw new AppError("List is already archived", HTTP_STATUS.BAD_REQUEST);
    }

    const archived = await listRepository.archive(listId);

    await activityService.log({
      type: "LIST_ARCHIVED",
      message: `List "${archived.title}" was archived`,
      boardId: list.boardId,
      userId,
    });

    return archived;
  }

  async restoreList(listId: string, userId: string) {
    const list = await listRepository.findById(listId);

    if (!list) {
      throw new AppError("List not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(list.boardId, userId, "MEMBER");

    if (list.status === "ACTIVE") {
      throw new AppError("List is not archived", HTTP_STATUS.BAD_REQUEST);
    }

    const restored = await listRepository.restore(listId);

    await activityService.log({
      type: "LIST_RESTORED",
      message: `List "${restored.title}" was restored`,
      boardId: list.boardId,
      userId,
    });

    return restored;
  }

  async reorderLists(input: ReorderListsInput, userId: string) {
    await boardService.assertBoardAccess(input.boardId, userId, "MEMBER");
    await listRepository.reorder(input.boardId, input.lists);
    return listRepository.findById(input.lists[0]!.id);
  }

  private async getListWithAccess(
    listId: string,
    userId: string,
    requiredRole: "MEMBER" | "OBSERVER" = "MEMBER",
  ) {
    const list = await listRepository.findById(listId);

    if (!list) {
      throw new AppError("List not found", HTTP_STATUS.NOT_FOUND);
    }

    await boardService.assertBoardAccess(list.boardId, userId, requiredRole);
    return list;
  }
}

export const listService = new ListService();
