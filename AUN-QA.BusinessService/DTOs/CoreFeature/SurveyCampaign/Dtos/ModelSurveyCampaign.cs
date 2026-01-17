using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos
{
    public class ModelSurveyCampaign : BaseModel
    {
        public Guid Id { get; set; }

        public Guid CycleId { get; set; }

        public Guid TemplateId { get; set; }

        public int StakeholderType { get; set; }

        public string Name { get; set; } = null!;

        public int Status { get; set; }
    }
}
