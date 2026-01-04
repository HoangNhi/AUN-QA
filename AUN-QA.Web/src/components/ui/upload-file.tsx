import { fileService } from "@/features/file/api/uploadfile.api";
import type { Attachment } from "@/features/file/types/uploadfile.types";
import { getFileUrl } from "@/lib/utils";
import {
  Paperclip,
  Trash,
  UploadCloud,
  X,
  FileIcon,
  Eye,
  Download,
} from "lucide-react";

import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

export interface UploadFileProps {
  noUpload?: boolean;
  listAttachment?: Attachment[];
  setListAttachment?: (attachments: Attachment[]) => void;
  multiFile?: boolean;
  fileValidate?: string[];
  fileValidateText?: string;
  fileSizeLimit?: number;
  folderUpload?: string;
  onSuccess?: () => void;
}

export interface UploadFileRef {
  upload: () => Promise<boolean>;
  getPendingFiles: () => File[];
}

const UploadFile = forwardRef<UploadFileRef, UploadFileProps>(
  (
    {
      noUpload = false,
      listAttachment = [],
      setListAttachment,
      multiFile = true,
      fileValidate = [".jpg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx"],
      fileValidateText = ".jpg, .png, .pdf, .doc, .docx, .xls, .xlsx",
      fileSizeLimit = 10,
      folderUpload = "DefaultFolder",
      onSuccess,
    },
    ref
  ) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      getPendingFiles: () => selectedFiles,
      upload: async () => {
        if (selectedFiles.length === 0) return true; // Nothing to upload is technically success
        return await performUpload();
      },
    }));

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
        if (!fileValidate.includes(fileExt)) {
          errors.push(`Tệp "${file.name}" không hợp lệ.`);
          return;
        }
        if (file.size > fileSizeLimit * 1024 * 1024) {
          errors.push(`Tệp "${file.name}" quá lớn.`);
          return;
        }
        validFiles.push(file);
      });

      setSelectedFiles((prev) =>
        multiFile ? [...prev, ...validFiles] : validFiles
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const performUpload = async (): Promise<boolean> => {
      try {
        const response = await fileService.uploadFile({
          files: selectedFiles,
          folderUpload: folderUpload,
        });

        if (response.Success) {
          onSuccess?.();
          return true;
        } else {
          throw new Error(response.Message);
        }
      } catch (error) {
        return false; // Crucial: Stop the process here
      }
    };

    const handleDeleteAttachment = (id: string) => {
      if (window.confirm("Xóa tệp này?") && setListAttachment) {
        const newList = listAttachment.filter((a) => a.Id !== id);
        setListAttachment(newList);
      }
    };

    const handlePreview = (file: Attachment) => {
      // TODO: Add preview logic here
      console.log("Visual preview", file);
    };

    const handleDownload = async (file: Attachment) => {
      const url = getFileUrl(file.FileUrl);
      if (!url) return;
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download =
          file.FullFileName || file.FileUrl.split("/").pop() || "download";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        window.open(url, "_blank");
      }
    };

    return (
      <div className="w-full text-sm">
        {/* Attachment Table */}
        {listAttachment.length > 0 && (
          <div className="mb-3 border rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-3 py-2 border-b flex items-center gap-2 font-semibold text-gray-700">
              <Paperclip size={14} className="text-blue-500" /> TỆP ĐÃ TẢI LÊN
            </div>
            <table className="w-full">
              <tbody className="divide-y">
                {listAttachment.map((file) => (
                  <tr key={file.Id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-blue-600 truncate">
                      {file.FullFileName}
                    </td>
                    <td className="px-3 py-2 text-right flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handlePreview(file)}
                        className="text-gray-400 hover:text-blue-500"
                        title="Xem trước"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="text-gray-400 hover:text-green-500"
                        title="Tải xuống"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(file.Id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Xóa"
                      >
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dropzone Area */}
        {!noUpload && (
          <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50 transition-colors hover:border-blue-400">
            <input
              type="file"
              ref={fileInputRef}
              multiple={multiFile}
              onChange={handleFileSelect}
              className="hidden"
              id="file-up"
              accept={fileValidate.join(",")}
            />
            <label
              htmlFor="file-up"
              className="flex flex-col items-center cursor-pointer"
            >
              <UploadCloud className="mb-2 text-blue-500" />
              <span className="font-medium">Chọn tệp tin...</span>
              <span className="text-xs text-gray-400">
                ({fileValidateText})
              </span>
            </label>

            {/* Staging List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-1">
                {selectedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white p-2 border rounded"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileIcon size={14} className="text-orange-400" />
                      <span className="truncate italic text-xs">{f.name}</span>
                    </div>
                    <X
                      size={14}
                      className="cursor-pointer text-gray-400 hover:text-red-500"
                      onClick={() =>
                        setSelectedFiles((s) => s.filter((_, idx) => idx !== i))
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default UploadFile;
