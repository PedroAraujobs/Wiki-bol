import type { CurrentUser, PageDetails, PageSummary } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function loginWithGoogle() {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await request<CurrentUser>("/api/users/me");
  } catch (error) {
    if (error instanceof Error && error.message === "HTTP 401") {
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
