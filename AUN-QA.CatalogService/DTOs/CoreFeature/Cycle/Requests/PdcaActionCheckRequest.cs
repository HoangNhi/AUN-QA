using AUN_QA.CatalogService.DTOs.Common;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Requests
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
        /// Hành động cần kiểm tra (VIEW, ADD, UPDATE, DELETE, APPROVE).
        /// </summary>
        public ActionType Action { get; set; }

        /// <summary>
        /// (Tùy chọn) ID của tiêu chuẩn cần kiểm tra phạm vi phụ trách.
        /// Dùng khi kiểm tra xem TVH/PVD có được thao tác trên tiêu chuẩn cụ thể không.
        /// Nếu null: chỉ kiểm tra vai trò chung, không lọc theo tiêu chuẩn.
        /// </summary>
        public Guid? StandardId { get; set; }

        /// <summary>
        /// (Tùy chọn) Danh sách vai trò HĐ được phép thực hiện hành động.
        /// Nếu null hoặc rỗng: áp dụng ma trận quyền mặc định (switch case).
        /// Nếu có giá trị: chỉ cho phép user có vai trò nằm trong danh sách.
        /// Lưu ý: ViceChairman vẫn cần IsDelegated = true khi nằm trong AllowedRoles.
        /// </summary>
        public List<int>? AllowedRoles { get; set; }
    }
}
