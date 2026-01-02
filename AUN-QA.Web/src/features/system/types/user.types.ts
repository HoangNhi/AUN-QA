import type { BaseRequest } from "@/types/base/base.types";

export interface User extends BaseRequest {
  Id: string;
  Username: string;
  Fullname: string;
  RoleId: string;
  Email: string;
  Avatar?: string;
  Password?: string;
}

export interface UserGetList extends User {
  Role: string;
}
