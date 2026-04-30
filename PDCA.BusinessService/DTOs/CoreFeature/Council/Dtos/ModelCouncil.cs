namespace AUN_QA.BusinessService.DTOs.CoreFeature.Council
{
    public class ModelCouncil
    {
        public Guid Id { get; set; }
        public Guid CycleId { get; set; }
        public Guid UserId { get; set; }
        /// <summary>
        /// 1=Chủ tịch HĐ, 2=Phó CT HĐ, 3=Thư ký, 4=Thành viên ĐG, 5=Người cung cấp MC
        /// </summary>
        public int RoleId { get; set; }
        public List<Guid> AssignedStandardIds { get; set; } = new();
    }
}
