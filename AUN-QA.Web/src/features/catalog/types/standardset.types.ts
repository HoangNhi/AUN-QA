import type {
  BaseRequest,
  GetListPagingRequest,
} from "@/types/base/base.types";

export interface StandardSet extends BaseRequest {
  Id: string;
  Code: string;
  Name: string;
}

export interface StandardSetGetListPagingRequest extends GetListPagingRequest {
  IsActived?: boolean;
}
