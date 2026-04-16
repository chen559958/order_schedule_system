import { useEffect } from "react";
import { useLocation } from "wouter";

const TOKEN_KEY = "auth_token";

export function useAuthToken() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Check if token is in URL (from OAuth callback)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      // Save token to localStorage
      localStorage.setItem(TOKEN_KEY, tokenFromUrl);
      // Remove token from URL for cleaner appearance
      setLocation("/");
    }
  }, [setLocation]);
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.warn("Failed to save auth token to localStorage");
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    console.warn("Failed to clear auth token from localStorage");
  }
}
