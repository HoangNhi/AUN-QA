import type { BaseRequest, GetListPagingRequest } from "@/types/base/base.types";

export interface Standard extends BaseRequest {
    Id: string;
    Code: string;
    Name: string;
    Description?: string;
    Criterions?: Criterion[];
}

export interface Criterion extends BaseRequest {
    Id: string;
    Code: string;
    Name: string;
    Description?: string;
    FileTypeId: string;
    Order: number;
}

export interface StandardGetListPagingRequest extends GetListPagingRequest {
    IsActived?: boolean;
}
