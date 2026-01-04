namespace AUN_QA.CatalogService.DTOs.CoreFeature.Council
{
    public class ModelCouncil
    {
        public Guid Id { get; set; }
        public Guid CycleId { get; set; }
        public Guid UserId { get; set; }
        /// <summary>
        /// 1. Trưởng hội đồng, 2. Thành viên đánh giá, 3. Người cung cấp minh chứng
        /// </summary>
        public int RoleId { get; set; }
    }
}
