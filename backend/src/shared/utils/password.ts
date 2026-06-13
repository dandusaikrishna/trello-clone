import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};

export const hashToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, SALT_ROUNDS);
};

export const compareToken = async (token: string, tokenHash: string): Promise<boolean> => {
  return bcrypt.compare(token, tokenHash);
};
