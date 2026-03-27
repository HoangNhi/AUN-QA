using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;

namespace AUN_QA.BusinessService.Services.CoreFeature.Survey
{
    public interface ISurveyCampaignService
    {
        #region SurveyCampaign
        Task<SurveyCampaignRequest> GetById(GetByIdRequest request);
        Task Insert(SurveyCampaignRequest request);
        Task Update(SurveyCampaignRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelSurveyCampaignGetListPaging>> GetList(SurveyCampaignGetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
        Task ChangeStatus(GetByIdRequest request);
        Task<ModelDoSurvey> GetSurveyByToken(GetSurveyByTokenRequest request);
        Task SubmitSurvey(SurveySubmissionRequest request);
        Task<AggregatedSurveyResultsDto> GetAggregatedResults(Guid campaignId);
        #endregion

        #region Session
        Task<GetListPagingResponse<ModelSurveySession>> GetListSession(SurveySessionGetListPagingRequest request);
        Task<GetListPagingResponse<StakeholderDto>> GetStakeholdersNotInCampaign(GetStakeholdersNotInCampaignRequest request);
        Task AddListStakeholderToCampaign(AddListStakeholderToCampaignRequest request);
        Task AddAllStakeholderToCampaign(AddAllStakeholderToCampaignRequest request);
        Task DeleteListSession(DeleteListRequest request);
        Task SendSurveyInvitation(GetByIdRequest request);
        #endregion
    }
}
