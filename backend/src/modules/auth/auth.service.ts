import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/utils/app-error.js";
import {
  comparePassword,
  compareToken,
  hashToken,
} from "../../shared/utils/password.js";
import {
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../shared/utils/jwt.js";
import { authRepository } from "./auth.repository.js";
import type { LoginResult, RefreshResult } from "./auth.types.js";
import type { LoginInput } from "./auth.validator.js";
import { workspaceService } from "../workspace/workspace.service.js";

export class AuthService {
  async login(input: LoginInput): Promise<LoginResult> {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user) {
      throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }

    const isValidPassword = await comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
    }

    const expiresAt = getRefreshTokenExpiry();
    const refreshTokenRecord = await authRepository.createRefreshToken(
      user.id,
      await hashToken(crypto.randomUUID()),
      expiresAt,
    );
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
    const refreshToken = signRefreshToken({
      sub: user.id,
      tokenId: refreshTokenRecord.id,
    });

    await authRepository.updateRefreshToken(
      refreshTokenRecord.id,
      await hashToken(refreshToken),
      expiresAt,
    );

    await workspaceService.ensurePersonalWorkspace(user.id, user.name);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(
        "Invalid or expired refresh token",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const storedToken = await authRepository.findRefreshTokenById(
      payload.tokenId,
    );

    if (!storedToken || storedToken.userId !== payload.sub) {
      throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
    }

    if (storedToken.expiresAt < new Date()) {
      await authRepository.deleteRefreshToken(storedToken.id);
      throw new AppError("Refresh token expired", HTTP_STATUS.UNAUTHORIZED);
    }

    const isValidToken = await compareToken(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!isValidToken) {
      throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authRepository.findUserById(payload.sub);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.UNAUTHORIZED);
    }

    const newTokenHash = await hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();

    await authRepository.updateRefreshToken(
      storedToken.id,
      newTokenHash,
      expiresAt,
    );

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      await authRepository.deleteRefreshToken(payload.tokenId);
    } catch {
      // Ignore invalid tokens on logout
    }
  }

  async getCurrentUser(userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.UNAUTHORIZED);
    }

    return user;
  }
}

export const authService = new AuthService();
