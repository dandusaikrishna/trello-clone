import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { TOKEN_LIFETIMES } from "../constants/index.js";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string;
};

export type RefreshTokenPayload = {
  sub: string;
  tokenId: string;
};

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: TOKEN_LIFETIMES.ACCESS_TOKEN_MS / 1000,
  });
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: TOKEN_LIFETIMES.REFRESH_TOKEN_MS / 1000,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

export const getRefreshTokenExpiry = (): Date => {
  return new Date(Date.now() + TOKEN_LIFETIMES.REFRESH_TOKEN_MS);
};
