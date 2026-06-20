import { apiFetch } from "./client.js";

export interface AdminUser {
  id: string;
  email: string;
  roles: string[];
  disabledAt: string | null;
  createdAt: string;
}

export interface AdminListing {
  id: string;
  title: string;
  type: "PROPERTY" | "WORKSPACE";
  city: string;
  status: "DRAFT" | "PUBLISHED" | "DISABLED";
  createdAt: string;
  host: { email: string };
}

export interface AdminPage<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const adminApi = {
  listUsers(page = 1): Promise<AdminPage<AdminUser>> {
    return apiFetch(`/admin/users?page=${page}&limit=50`);
  },
  disableUser(id: string): Promise<AdminUser> {
    return apiFetch(`/admin/users/${id}/disable`, { method: "PATCH" });
  },
  enableUser(id: string): Promise<AdminUser> {
    return apiFetch(`/admin/users/${id}/enable`, { method: "PATCH" });
  },
  listListings(page = 1): Promise<AdminPage<AdminListing>> {
    return apiFetch(`/admin/listings?page=${page}&limit=50`);
  },
  disableListing(id: string): Promise<AdminListing> {
    return apiFetch(`/admin/listings/${id}/disable`, { method: "PATCH" });
  },
  enableListing(id: string): Promise<AdminListing> {
    return apiFetch(`/admin/listings/${id}/enable`, { method: "PATCH" });
  },
};
