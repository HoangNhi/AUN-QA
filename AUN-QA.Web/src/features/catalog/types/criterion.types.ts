export interface Criterion {
    Id: string;
    StandardId: string;
    StandardName: string;
    Code: string;
    Name: string;
    Description: string;
    FileTypeId?: string;
    FileTypeName?: string;
    CreatedBy?: string;
    CreatedAt?: string;
    UpdatedBy?: string;
    UpdatedAt?: string;
    IsActived?: boolean;
    IsDeleted?: boolean;
    IsEdit?: boolean;
}

export interface CriterionRequest {
    Id: string;
    StandardId: string;
    Code: string;
    Name: string;
    Description: string;
    FileTypeId?: string;
    IsActived?: boolean;
}
