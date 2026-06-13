import { prisma } from "../../db/prisma.js";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findRefreshTokenById(id: string) {
    return prisma.refreshToken.findUnique({ where: { id } });
  }

  async deleteRefreshToken(id: string) {
    return prisma.refreshToken.delete({ where: { id } });
  }

  async deleteRefreshTokensByUserId(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async updateRefreshToken(id: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.update({
      where: { id },
      data: { tokenHash, expiresAt },
    });
  }
}

export const authRepository = new AuthRepository();
