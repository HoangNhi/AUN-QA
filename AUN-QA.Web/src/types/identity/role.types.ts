export interface Role {
    Id: string;
    Name: string;
    CreatedAt: string;
    UpdatedAt: string;
    IsEdit: boolean;
}

export interface RoleGetListPaging extends Role {}

export interface Permision {
    SystemGroup: string;
    Roles: Permision_Menu[];
}

export interface Permision_Menu {
    Id: string;
    RoleId: string;
    MenuId: string;
    Name: string;
    IsViewed: boolean;
    IsAdded: boolean;
    IsUpdated: boolean;
    IsDeleted: boolean;
    IsApproved: boolean;
    IsAnalyzed: boolean;
    CanView: boolean;
    CanAdd: boolean;
    CanUpdate: boolean;
    CanDelete: boolean;
    CanApprove: boolean;
    CanAnalyze: boolean;
}