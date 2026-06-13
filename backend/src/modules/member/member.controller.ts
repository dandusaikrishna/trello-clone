import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { memberService } from "./member.service.js";
import type { AssignMemberInput, GetMembersQuery } from "./member.validator.js";

export class MemberController {
  getMembers = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const query = req.query as unknown as GetMembersQuery;
    const members = await memberService.getMembers(query, req.user.id);
    sendSuccess(res, members);
  });

  assignMemberToCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    const input = req.body as AssignMemberInput;
    const member = await memberService.assignMemberToCard(
      getRouteParam(req, "cardId"),
      input,
      req.user.id,
    );
    sendSuccess(res, member, HTTP_STATUS.CREATED);
  });

  removeMemberFromCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", HTTP_STATUS.UNAUTHORIZED);
    }

    await memberService.removeMemberFromCard(
      getRouteParam(req, "cardId"),
      getRouteParam(req, "memberId"),
      req.user.id,
    );
    sendSuccess(res, { removed: true });
  });
}

export const memberController = new MemberController();
