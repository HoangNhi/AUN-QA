using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Dtos
{
    public class ModelSurveySession : BaseModel
    {
        public Guid Id { get; set; }

        public Guid CampaignId { get; set; }

        public int StakeholderId { get; set; }

        public string StakeholderName { get; set; } = null!;

        public string StakeholderEmail { get; set; } = null!;

        public string Token { get; set; } = null!;

        public int Status { get; set; }

        public DateTime? SentDate { get; set; }

        public DateTime? SubmittedDate { get; set; }
    }
}
