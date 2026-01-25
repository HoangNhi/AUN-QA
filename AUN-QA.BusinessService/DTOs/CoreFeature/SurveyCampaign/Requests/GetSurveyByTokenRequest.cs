using FluentValidation;
using System.ComponentModel.DataAnnotations;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class GetSurveyByTokenRequest
    {
        [Required(AllowEmptyStrings = false, ErrorMessage = "Đường dẫn không hợp lệ")]
        public string Token { get; set; } = string.Empty;
    }

    public class GetSurveyByTokenRequestValidator : AbstractValidator<GetSurveyByTokenRequest>
    {
        public GetSurveyByTokenRequestValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty().WithMessage("Đường dẫn không hợp lệ");
        }
    }
}
