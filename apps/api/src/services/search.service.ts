import type { SearchQuery, SearchResponse } from "@nomadhome/shared";
import { SearchRepository } from "../repositories/search.repository.js";

export class SearchService {
  constructor(private readonly repo: SearchRepository) {}

  async search(query: SearchQuery): Promise<SearchResponse> {
    const { rows, total } = await this.repo.search(query);
    return {
      data: rows,
      pagination: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: query.page * query.pageSize < total,
      },
    };
  }
}
