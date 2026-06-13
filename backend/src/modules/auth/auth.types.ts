export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LoginResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
};
