export function getActionPlanStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return "Nháp";
    case 2:
      return "Chờ duyệt";
    case 3:
      return "Yêu cầu chỉnh sửa";
    case 4:
      return "Đã duyệt";
    case 5:
      return "Đã giao";
    default:
      return "Không xác định";
  }
}

export function canEditActionPlan(status: number): boolean {
  return status === 1 || status === 3;
}
