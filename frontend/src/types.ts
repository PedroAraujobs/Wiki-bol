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

export type PageHistoryEntry = {
  id: string;
  pageId: string;
  version: number;
  title: string;
  content: string;
  keywords: string[];
  editedByName: string;
  changeSummary: string | null;
  createdAt: string;
};

export type PagePayload = {
  title: string;
  content: string;
  keywords: string[];
  changeSummary: string;
};

export type ImageUploadResponse = {
  url: string;
  markdown: string;
  path: string;
  contentType: string;
  size: number;
};

export type ApiError = {
  timestamp: string;
  status: number;
  error: string;
  messages: string[];
};

export class ApiRequestError extends Error {
  status: number;
  messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(" "));
    this.name = "ApiRequestError";
    this.status = status;
    this.messages = messages;
  }
}
