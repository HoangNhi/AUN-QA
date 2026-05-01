using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Dtos
{
    public class ModelTemplateTextQuestion : BaseModel
    {
        public Guid Id { get; set; }

        public Guid TopicId { get; set; }

        public string Content { get; set; } = null!;

        public int Sort { get; set; }

        public bool IsRequired { get; set; }
    }
}
