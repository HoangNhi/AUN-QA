export interface Evidence {
    Id: string;
    Name: string;
    CreatedBy?: string;
    CreatedAt?: string;
    UpdatedBy?: string;
    UpdatedAt?: string;
    IsActived?: boolean;
    IsDeleted?: boolean;
    IsEdit?: boolean;
}

export interface EvidenceRequest {
    Id: string;
    Name: string;
    IsActived?: boolean;
}
