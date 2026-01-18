using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.Survey
{
    public interface ISurveyCampaignService
    {
        Task<SurveyCampaignRequest> GetById(GetByIdRequest request);
        Task<ModelSurveyCampaign> Insert(SurveyCampaignRequest request);
        Task<ModelSurveyCampaign> Update(SurveyCampaignRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelSurveyCampaignGetListPaging>> GetList(SurveyCampaignGetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
        Task<string> SendSurvey(int? type);
    }
}
