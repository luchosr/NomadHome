import { apiFetch } from "./client.js";

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  register: (email: string, password: string) =>
    apiFetch<AuthTokens>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: (refreshToken: string) =>
    apiFetch<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  refresh: (refreshToken: string) =>
    apiFetch<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  me: () => apiFetch<AuthUser>("/auth/me"),

  becomeHost: (data: { displayName: string; payoutEmail: string; acceptedTerms: true }) =>
    apiFetch<{ accessToken: string; roles: string[] }>("/users/me/become-host", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
