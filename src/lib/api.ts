"use client";

let redirecting = false;

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });

    if (res.status === 401 && !redirecting) {
      redirecting = true;
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
      return { success: false, error: "Unauthorized" };
    }

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid response from server" };
    }

    redirecting = false;
    return data as { success: boolean; data?: T; error?: string; message?: string };
  } catch {
    return { success: false, error: "Network error" };
  }
}
