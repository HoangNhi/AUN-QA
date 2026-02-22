using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Dtos
{
    public class ModelTemplateCategory : BaseModel
    {
        public Guid Id { get; set; }

        public Guid TopicId { get; set; }

        public string Name { get; set; } = null!;

        public int Sort { get; set; }
    }
}
