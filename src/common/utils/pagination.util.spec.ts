import { parsePagination } from './pagination.util';

describe('parsePagination', () => {
  it('should return default values when no params provided', () => {
    const result = parsePagination({});

    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('should compute skip from page and limit', () => {
    const result = parsePagination({ page: 3, limit: 10 });

    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('should handle page 1 correctly', () => {
    const result = parsePagination({ page: 1, limit: 5 });

    expect(result).toEqual({ page: 1, limit: 5, skip: 0 });
  });

  it('should use default limit when only page is given', () => {
    const result = parsePagination({ page: 2 });

    expect(result).toEqual({ page: 2, limit: 20, skip: 20 });
  });

  it('should use default page when only limit is given', () => {
    const result = parsePagination({ limit: 50 });

    expect(result).toEqual({ page: 1, limit: 50, skip: 0 });
  });
});
