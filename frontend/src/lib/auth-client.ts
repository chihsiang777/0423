import { createAuthClient } from "better-auth/react";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const authClient = createAuthClient({
  baseURL: apiBaseUrl || window.location.origin,
});

export const { signIn, signOut, getSession, useSession } = authClient;
