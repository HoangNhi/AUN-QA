using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos
{
    public class ModelSurveyCampaign : BaseModel
    {
        public Guid Id { get; set; }

        public Guid CycleId { get; set; }

        public Guid TemplateId { get; set; }

        public int StakeholderType { get; set; }

        public string Name { get; set; } = null!;

        /// <summary>
        /// 1. Chưa gửi, 2. Đã gửi, 3. Đã hoàn thành
        /// </summary>
        public int Status { get; set; }
    }
}
