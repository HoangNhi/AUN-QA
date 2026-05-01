using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Dtos
{
    public class ModelSurveyTemplate : BaseModel
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public int StakeholderType { get; set; }

        public string? Description { get; set; }

        public List<TemplateTopicRequest> ListTopic { get; set; } = new();
    }
}
