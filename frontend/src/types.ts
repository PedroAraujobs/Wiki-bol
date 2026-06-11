export type AuthProvider = "GOOGLE";
export type UserRole = "USER" | "ADMIN";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
};

export type PageSummary = {
  id: string;
  title: string;
  slug: string;
  keywords: string[];
  currentVersion: number;
  authorName: string;
  updatedAt: string;
};

export type PageDetails = {
  id: string;
  title: string;
  slug: string;
  content: string;
  keywords: string[];
  currentVersion: number;
  author: {
    id: string;
    name: string;
    email: string;
    provider: AuthProvider;
    avatarUrl: string | null;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ApiError = {
  timestamp: string;
  status: number;
  error: string;
  messages: string[];
};
