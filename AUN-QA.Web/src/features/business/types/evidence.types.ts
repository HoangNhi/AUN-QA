import type { Attachment } from "@/features/file/types/uploadfile.types";
import type { BaseRequest } from "@/types/base/base.types";

export interface Evidence extends BaseRequest {
    Id: string;
    Name: string;
    AttachmentIds?: string[];
    ListAttachment?: Attachment[];
}