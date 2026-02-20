import { PaginationQueryDto } from '../dto/pagination-query.dto';

export function parsePagination(query: PaginationQueryDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
