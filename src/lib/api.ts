export type BlogPostRecord = {
  id: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  keywords: string[];
  schemas: unknown[];
  cover_image_url: string | null;
  og_image_url: string | null;
  content: string;
  faqs?: Array<{ q: string; a: string }>;
  published: boolean;
  created_at: string;
  updated_at: string;
  excerpt?: string;
};

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  summary: string | null;
  description: string;
  features: string[];
  specs: unknown;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  cover_image_url: string | null;
  og_image_url: string | null;
  gallery_image_urls: string[];
  faqs?: Array<{ q: string; a: string }>;
  video_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

import type { PageContent } from "@/lib/page-types";

const ADMIN_TOKEN_STORAGE_KEY = "admin_token";

const API_BASE_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\/+$/, "");
})();

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}

function getAdminToken(): string | null {
  try {
    const value = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    return value?.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const adminToken = getAdminToken();

  const res = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!res.ok) {
    let message = text || `Request failed: ${res.status}`;

    const looksLikeHtml = /text\/html/i.test(contentType) || /^\s*</.test(text);
    if (looksLikeHtml) {
      message = `Request failed: ${res.status} (received HTML instead of JSON). Check your API deployment and/or set NEXT_PUBLIC_API_BASE_URL.`;
      throw new Error(message);
    }

    if (text) {
      try {
        const parsed: unknown = JSON.parse(text);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "error" in parsed &&
          typeof (parsed as { error?: unknown }).error === "string"
        ) {
          message = (parsed as { error: string }).error;
        }
      } catch {
        // ignore JSON parsing errors
      }
    }

    throw new Error(message);
  }

  if (!text) {
    // No JSON to parse; keep behavior explicit.
    throw new Error("Unexpected empty response from API");
  }

  const looksLikeHtml = /text\/html/i.test(contentType) || /^\s*</.test(text);
  if (looksLikeHtml) {
    throw new Error(
      "Unexpected response (received HTML instead of JSON). Check your API deployment and/or set NEXT_PUBLIC_API_BASE_URL."
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      "Unexpected response (invalid JSON). Check your API deployment and/or set NEXT_PUBLIC_API_BASE_URL.",
    );
  }
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiFetch<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
  },
  blogs: {
    list: () => apiFetch<BlogPostRecord[]>("/api/blogs"),
    getBySlug: (slug: string) => apiFetch<BlogPostRecord>(`/api/blogs/slug/${encodeURIComponent(slug)}`),
    create: (payload: Partial<BlogPostRecord>) =>
      apiFetch<BlogPostRecord>("/api/blogs", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<BlogPostRecord>) =>
      apiFetch<BlogPostRecord>(`/api/blogs/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: string) => apiFetch<{ ok: true }>(`/api/blogs/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  products: {
    list: () => apiFetch<ProductRecord[]>("/api/products"),
    getBySlug: (slug: string) => apiFetch<ProductRecord>(`/api/products/slug/${encodeURIComponent(slug)}`),
    create: (payload: Partial<ProductRecord>) =>
      apiFetch<ProductRecord>("/api/products", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<ProductRecord>) =>
      apiFetch<ProductRecord>(`/api/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: string) => apiFetch<{ ok: true }>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  pages: {
    list: () => apiFetch<PageContent[]>("/api/pages"),
    update: (pageId: string, payload: Partial<PageContent>) =>
      apiFetch<PageContent>(`/api/pages/${encodeURIComponent(pageId)}`, { method: "PUT", body: JSON.stringify(payload) }),
  },
  uploads: {
    imgbb: async (file: File) => {
      const adminToken = getAdminToken();
      const form = new FormData();
      form.append("image", file);

      const res = await fetch(buildApiUrl("/api/uploads/imgbb"), {
        method: "POST",
        body: form,
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as { url: string };
    },
  },
};
