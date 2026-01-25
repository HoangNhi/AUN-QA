using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.TextAnswer.Dtos
{
    public class ModelSurveyTextAnswer : BaseModel
    {
        public Guid Id { get; set; }

        public Guid SessionId { get; set; }

        public Guid TextQuestionId { get; set; }

        public string Content { get; set; } = null!;
    }
}
