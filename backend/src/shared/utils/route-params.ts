import type { Request } from "express";

export const getRouteParam = (req: Request, key: string): string => {
  const value = req.params[key];

  if (typeof value !== "string") {
    throw new Error(`Missing route parameter: ${key}`);
  }

  return value;
};
