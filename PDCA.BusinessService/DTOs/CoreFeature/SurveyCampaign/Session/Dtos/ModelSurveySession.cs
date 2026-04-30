using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Dtos
{
    public class ModelSurveySession : BaseModel
    {
        public Guid Id { get; set; }

        public Guid CampaignId { get; set; }

        public Guid StakeholderId { get; set; }

        public string StakeholderName { get; set; } = null!;

        public string StakeholderEmail { get; set; } = null!;

        public string Token { get; set; } = null!;

        /// <summary>
        /// 1. Chưa gửi, 2. Đã gửi, 3. Đã hoàn thành
        /// </summary>
        public int Status { get; set; }

        public DateTime? SentDate { get; set; }

        public DateTime? SubmittedDate { get; set; }
    }
}
