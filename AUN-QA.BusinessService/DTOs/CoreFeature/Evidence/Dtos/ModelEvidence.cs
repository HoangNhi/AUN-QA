using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos
{
    public class ModelEvidence : BaseModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;
    }
}
