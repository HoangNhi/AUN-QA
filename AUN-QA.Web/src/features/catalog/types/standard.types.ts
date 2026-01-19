export interface Standard {
    Id: string;
    Code: string;
    Name: string;
    Description: string;
    AunVersion: string;
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
    AunVersion: string;
    IsActived?: boolean;
}
