import { fileService } from "@/features/file/api/uploadfile.api";
import { Paperclip, Trash, UploadCloud, X, FileIcon } from "lucide-react";

import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

// --- Types ---
interface Attachment {
  Id: number;
  Url: string;
  TenTapTinFull: string;
  TenMoRong: string;
}

export interface UploadFileRequest {
  files: File[];
  folderName: string;
}

export interface UploadFileProps {
  noUpload?: boolean;
  listTepDinhKem?: Attachment[];
  multiFile?: boolean;
  fileValidate?: string[];
  fileValidateText?: string;
  fileSizeLimit?: number;
  folderName?: string;
  onAttachmentsChange?: (ids: number[]) => void;
  onSuccess?: () => void;
}

export interface UploadFileRef {
  upload: () => Promise<boolean>;
  clear: () => void;
  getPendingFiles: () => File[];
}

const UploadFile = forwardRef<UploadFileRef, UploadFileProps>(
  (
    {
      noUpload = false,
      listTepDinhKem = [],
      multiFile = true,
      fileValidate = [".jpg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx"],
      fileValidateText = ".jpg, .png, .pdf, .doc, .docx, .xls, .xlsx",
      fileSizeLimit = 10,
      folderName = "DefaultFolder",
      onAttachmentsChange,
      onSuccess,
    },
    ref
  ) => {
    const [attachments, setAttachments] =
      useState<Attachment[]>(listTepDinhKem);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState<{
      type: "success" | "error" | "info";
      text: string;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastEmittedIds = useRef<string>("");

    // --- FIX 1: Prevent Prop-to-State Infinite Loop ---
    // Only update internal state if the incoming IDs have actually changed
    useEffect(() => {
      const currentIdsJson = JSON.stringify(listTepDinhKem.map((a) => a.Id));
      const internalIdsJson = JSON.stringify(attachments.map((a) => a.Id));

      if (currentIdsJson !== internalIdsJson) {
        setAttachments(listTepDinhKem);
      }
    }, [listTepDinhKem]);

    // --- FIX 2: Prevent Callback Loop ---
    // We use a separate effect for notification and track the stringified IDs
    useEffect(() => {
      const ids = attachments.map((a) => a.Id);
      const idsString = JSON.stringify(ids);

      if (onAttachmentsChange && idsString !== lastEmittedIds.current) {
        lastEmittedIds.current = idsString;
        onAttachmentsChange(ids);
      }
    }, [attachments, onAttachmentsChange]);

    useImperativeHandle(ref, () => ({
      getPendingFiles: () => selectedFiles,
      clear: () => {
        setSelectedFiles([]);
        setUploadMessage(null);
      },
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

      if (errors.length > 0) {
        setUploadMessage({ type: "error", text: errors.join(" ") });
      } else {
        setUploadMessage(null);
      }

      setSelectedFiles((prev) =>
        multiFile ? [...prev, ...validFiles] : validFiles
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const performUpload = async (): Promise<boolean> => {
      setIsUploading(true);
      setUploadMessage({ type: "info", text: "Đang tải lên..." });

      try {
        const response = await fileService.uploadFile({
          files: selectedFiles,
          folderName: folderName,
        });

        if (response.Success) {
          setUploadMessage({ type: "success", text: "Tải lên thành công" });
          setSelectedFiles([]);
          onSuccess?.();
          setTimeout(() => setUploadMessage(null), 3000);
          return true;
        } else {
          throw new Error(response.Message);
        }
      } catch (error) {
        console.error("Upload Error Details:", error);
        setUploadMessage({
          type: "error",
          text: "Lỗi tải lên: Không thể kết nối đến máy chủ (404/Network Error)",
        });
        return false; // Crucial: Stop the process here
      } finally {
        setIsUploading(false);
      }
    };

    const handleDeleteAttachment = (id: number) => {
      if (window.confirm("Xóa tệp này?")) {
        setAttachments((prev) => prev.filter((a) => a.Id !== id));
      }
    };

    return (
      <div className="w-full text-sm">
        {/* Attachment Table */}
        {attachments.length > 0 && (
          <div className="mb-3 border rounded-lg bg-white overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-3 py-2 border-b flex items-center gap-2 font-semibold text-gray-700">
              <Paperclip size={14} className="text-blue-500" /> TỆP ĐÃ TẢI LÊN
            </div>
            <table className="w-full">
              <tbody className="divide-y">
                {attachments.map((file) => (
                  <tr key={file.Id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-blue-600 truncate">
                      {file.TenTapTinFull}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDeleteAttachment(file.Id)}
                        className="text-gray-400 hover:text-red-500"
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
              disabled={isUploading}
              accept={fileValidate.join(",")}
            />
            <label
              htmlFor="file-up"
              className="flex flex-col items-center cursor-pointer"
            >
              <UploadCloud
                className={`mb-2 ${
                  isUploading ? "text-gray-300" : "text-blue-500"
                }`}
              />
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

            {/* Error/Success Messages */}
            {uploadMessage && (
              <div
                className={`mt-3 p-2 rounded text-center text-xs border ${
                  uploadMessage.type === "error"
                    ? "bg-red-50 text-red-600 border-red-100"
                    : uploadMessage.type === "success"
                    ? "bg-green-50 text-green-600 border-green-100"
                    : "bg-blue-50 text-blue-600 border-blue-100"
                }`}
              >
                {uploadMessage.text}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default UploadFile;
