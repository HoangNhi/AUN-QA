using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests
{
    public class SurveySessionGetListPagingRequest : GetListPagingRequest
    {
        public Guid CampaignId { get; set; }

        /// <summary>
        /// 1. Chưa gửi, 2. Đã gửi, 3. Đã hoàn thành
        /// </summary>
        public int? Status { get; set; }
    }

    public class SurveySessionGetListPagingRequestValidator : AbstractValidator<SurveySessionGetListPagingRequest>
    {
        public SurveySessionGetListPagingRequestValidator()
        {
            RuleFor(x => x.CampaignId).NotEmpty().WithMessage("Chiến dịch không được để trống");
        }
    }
}
