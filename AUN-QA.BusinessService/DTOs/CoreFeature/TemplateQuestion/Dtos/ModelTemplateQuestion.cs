using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Dtos
{
    public class ModelTemplateQuestion : BaseModel
    {
        public Guid Id { get; set; }

        public Guid CategoryId { get; set; }

        public string Content { get; set; } = null!;

        public int Sort { get; set; }
    }
}
