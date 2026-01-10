using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Dtos
{
    public class ModelTemplateTopic : BaseModel
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public bool HasTextQuestionPart { get; set; }

        public string? TextQuestionTitle { get; set; }

        public int Sort { get; set; }
    }
}
