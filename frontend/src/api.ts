import { ApiRequestError } from "./types";
import type {
  ApiError,
  CurrentUser,
  ImageUploadResponse,
  PageDetails,
  PageHistoryEntry,
  PagePayload,
  PageSummary,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

async function parseError(response: Response) {
  try {
    const error = (await response.json()) as ApiError;
    return new ApiRequestError(response.status, error.messages?.length ? error.messages : [error.error]);
  } catch {
    return new ApiRequestError(response.status, [`HTTP ${response.status}`]);
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const init: RequestInit = {
    credentials: "include",
  };

  if (options.method) {
    init.method = options.method;
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(options.body);
  }

  if (Array.from(headers.keys()).length > 0) {
    init.headers = headers;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getGoogleLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}

export function logout() {
  return request<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await request<CurrentUser>("/api/users/me");
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function listPages() {
  return request<PageSummary[]>("/api/pages");
}

export function searchPages(query: string) {
  const params = new URLSearchParams({ q: query, limit: "20" });
  return request<PageSummary[]>(`/api/pages/search?${params.toString()}`);
}

export function getPageBySlug(slug: string) {
  return request<PageDetails>(`/api/pages/${slug}`);
}

export function getPageHistory(pageId: string) {
  return request<PageHistoryEntry[]>(`/api/pages/${pageId}/history`);
}

export function createPage(payload: PagePayload) {
  return request<PageDetails>("/api/pages", {
    method: "POST",
    body: payload,
  });
}

export function updatePage(id: string, payload: PagePayload) {
  return request<PageDetails>(`/api/pages/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deletePage(id: string) {
  return request<void>(`/api/pages/${id}`, {
    method: "DELETE",
  });
}

export async function uploadImage(file: File, alt: string, pageId?: string) {
  const formData = new FormData();
  formData.append("file", file);

  if (alt.trim()) {
    formData.append("alt", alt.trim());
  }

  if (pageId) {
    formData.append("pageId", pageId);
  }

  const response = await fetch(`${API_BASE_URL}/api/uploads/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json() as Promise<ImageUploadResponse>;
}
