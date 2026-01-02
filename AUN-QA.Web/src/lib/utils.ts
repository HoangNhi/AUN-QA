import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from "./api";
import { API_ENDPOINTS } from "@/config/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${API_BASE_URL}${API_ENDPOINTS.File.UploadFile.GET}${path}`;
}
