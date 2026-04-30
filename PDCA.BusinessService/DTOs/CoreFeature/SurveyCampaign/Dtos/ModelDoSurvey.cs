using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos
{
    public class ModelDoSurvey
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public int? StakeholderType { get; set; }
        public bool IsSessionCompleted { get; set; }
        public List<TemplateTopicRequest> ListTopic { get; set; } = new();
    }
}
