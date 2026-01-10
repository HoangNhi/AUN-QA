using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Requests
{
    public class SurveyTemplateGetListPagingRequest : GetListPagingRequest
    {
        public int? StakeholderType { get; set; }
    }
}
