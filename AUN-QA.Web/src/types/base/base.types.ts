export interface GetListPagingRequest {
    PageIndex: number | 1;
    PageSize: number | 10;
    TextSearch: string | null;
}

export interface GetListPagingResponse<T> {
    Data: T[];
    PageIndex: number;
    PageSize: number;
    TotalRow: number;
}