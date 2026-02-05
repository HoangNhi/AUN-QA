import type { ModelCombobox } from "@/types/base/base.types";

// Centralized stakeholder type options from catalog service
export const STAKEHOLDER_TYPES: ModelCombobox[] = [
  { Value: "1", Text: "Sinh viên" },
  { Value: "2", Text: "Cựu sinh viên" },
  { Value: "3", Text: "Nhà tuyển dụng" },
  { Value: "4", Text: "Giảng viên" },
];

// Active status options for filtering
export const ACTIVE_STATUS_OPTIONS: ModelCombobox[] = [
  { Value: "true", Text: "Hoạt động" },
  { Value: "false", Text: "Không hoạt động" },
];

// Evaluation mode options for StandardSet
export const EVALUATION_MODE_OPTIONS: ModelCombobox[] = [
  { Value: "1", Text: "Thang điểm 7" },
  { Value: "2", Text: "Đạt / không đạt" },
];

// Cycle status options for filtering and form
export const CYCLE_STATUS_OPTIONS: ModelCombobox[] = [
  { Value: "1", Text: "Lập kế hoạch" },
  { Value: "2", Text: "Đang diễn ra" },
  { Value: "3", Text: "Đã kết thúc" },
];

// Cycle scope options for filtering and form
export const CYCLE_SCOPE_OPTIONS: ModelCombobox[] = [
  { Value: "1", Text: "Cấp chương trình" },
  { Value: "2", Text: "Cấp cơ sở" },
];
