export function getTaskStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return "Chờ thực hiện";
    case 2:
      return "Đang thực hiện";
    case 3:
      return "Hoàn thành";
    default:
      return "Không xác định";
  }
}

export function canDeleteTask(status: number): boolean {
  return status === 1;
}
