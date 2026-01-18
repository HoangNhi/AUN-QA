using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Score.Dtos
{
    public class ModelSurveyScore : BaseModel
    {
        public Guid Id { get; set; }

        public Guid SessionId { get; set; }

        public Guid QuestionId { get; set; }

        public int Score { get; set; }
    }
}
