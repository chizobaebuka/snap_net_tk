export class PaginationHelper {
    static getPaginationMeta(total: number, page: number, limit: number) {
        return {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPreviousPage: page > 1,
        };
    }

    static paginate<T>(data: T[], total: number, page: number, limit: number) {
        return {
            data,
            meta: this.getPaginationMeta(total, page, limit),
        };
    }
}
