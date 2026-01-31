import type {
  BaseRequest,
  GetListPagingRequest,
} from "@/types/base/base.types";

export interface FileType extends BaseRequest {
    Id: string;
    Code: string;
    Name: string;
}

export interface FileTypeGetListPagingRequest extends GetListPagingRequest {
  IsActived?: boolean;
}
