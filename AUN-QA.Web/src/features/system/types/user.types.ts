export interface User {
    Id: string;
    Username: string;
    Fullname: string;
    RoleId: string;
    IsEdit: boolean;
    Password?: string;
    IsActived: boolean;
}

export interface UserGetList extends User {
    Role: string;
}

