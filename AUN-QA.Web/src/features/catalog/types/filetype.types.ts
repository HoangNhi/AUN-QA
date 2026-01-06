export interface FileType {
    Id: string;
    Code: string;
    Name: string;
    CreatedBy?: string;
    CreatedAt?: string;
    UpdatedBy?: string;
    UpdatedAt?: string;
    IsActived?: boolean;
    IsDeleted?: boolean;
    IsEdit?: boolean;
}

export interface FileTypeRequest {
    Id: string;
    Code: string;
    Name: string;
    IsActived?: boolean;
}
