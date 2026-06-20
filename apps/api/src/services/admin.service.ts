import { AdminRepository } from "../repositories/admin.repository.js";

export class AdminTargetNotFoundError extends Error {
  constructor() {
    super("not_found");
    this.name = "AdminTargetNotFoundError";
  }
}

export class AdminService {
  constructor(private readonly repo: AdminRepository) {}

  async disableUser(adminId: string, userId: string) {
    try {
      return await this.repo.disableUser(userId, adminId);
    } catch (err: unknown) {
      if (isPrismaNotFound(err)) throw new AdminTargetNotFoundError();
      throw err;
    }
  }

  async enableUser(userId: string) {
    try {
      return await this.repo.enableUser(userId);
    } catch (err: unknown) {
      if (isPrismaNotFound(err)) throw new AdminTargetNotFoundError();
      throw err;
    }
  }

  async disableListing(listingId: string) {
    try {
      return await this.repo.disableListing(listingId);
    } catch (err: unknown) {
      if (isPrismaNotFound(err)) throw new AdminTargetNotFoundError();
      throw err;
    }
  }

  async enableListing(listingId: string) {
    try {
      return await this.repo.enableListing(listingId);
    } catch (err: unknown) {
      if (isPrismaNotFound(err)) throw new AdminTargetNotFoundError();
      throw err;
    }
  }

  listUsers(page: number, limit: number) {
    return this.repo.listUsers(page, limit);
  }

  listListings(page: number, limit: number) {
    return this.repo.listListings(page, limit);
  }
}

function isPrismaNotFound(err: unknown): boolean {
  return err instanceof Error && "code" in err && (err as { code: string }).code === "P2025";
}
