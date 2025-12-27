import api, { type ApiResponse } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/constants";
import type { UploadFileRequest } from "../types/uploadfile.types";

export const fileService = {
  uploadFile: async (
    request: UploadFileRequest
  ): Promise<ApiResponse<boolean>> => {
    const formData = new FormData();
    
    request.files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("FolderName", request.folderName);

    return api.post<boolean>(API_ENDPOINTS.File.UploadFile.POST, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
