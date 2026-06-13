export const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

export const TOKEN_LIFETIMES = {
  ACCESS_TOKEN_MS: 15 * 60 * 1000,
  REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000,
} as const;

export const LABEL_COLORS = [
  "#61bd4f",
  "#f2d600",
  "#ff9f1a",
  "#eb5a46",
  "#c377e0",
  "#0079bf",
  "#00c2e0",
  "#51e898",
] as const;
