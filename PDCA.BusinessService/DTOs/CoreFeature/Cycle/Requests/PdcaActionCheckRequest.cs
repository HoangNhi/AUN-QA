namespace AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests
{
    public class PdcaActionCheckRequest
    {
        /// <summary>
        /// ID của người dùng cần kiểm tra quyền.
        /// </summary>
        public Guid UserId { get; set; }

        /// <summary>
        /// ID của chu kỳ đánh giá (PDCA context).
        /// </summary>
        public Guid CycleId { get; set; }

        /// <summary>
        /// (Tùy chọn) ID của tiêu chuẩn cần kiểm tra phạm vi phụ trách.
        /// Dùng khi kiểm tra xem TVH/PVD có được thao tác trên tiêu chuẩn cụ thể không.
        /// Nếu null: chỉ kiểm tra vai trò chung, không lọc theo tiêu chuẩn.
        /// </summary>
        public Guid? StandardId { get; set; }

        /// <summary>
        /// Danh sách vai trò HĐ được phép thực hiện hành động (theo CouncilRole enum).
        /// Nếu null hoặc rỗng: bất kỳ thành viên HĐ đang hoạt động nào cũng được phép.
        /// </summary>
        public List<int>? AllowedRoles { get; set; }
    }
}
