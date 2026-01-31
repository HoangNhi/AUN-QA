import type { Criterion } from './criterion.types';

export interface Standard {
    Id: string;
    Code: string;
    Name: string;
    Description: string;
    Criteria?: Criterion[];
    CreatedBy?: string;
    CreatedAt?: string;
    UpdatedBy?: string;
    UpdatedAt?: string;
    IsActived?: boolean;
    IsDeleted?: boolean;
    IsEdit?: boolean;
}

export interface StandardRequest {
    Id: string;
    Code: string;
    Name: string;
    Description: string;
    Criteria: Criterion[];
    IsActived?: boolean;
}
