using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.SurveyTemplate
{
    public interface ISurveyTemplateService
    {
        Task<ModelSurveyTemplate> GetById(GetByIdRequest request);
        Task<ModelSurveyTemplate> Insert(SurveyTemplateRequest request);
        Task<ModelSurveyTemplate> Update(SurveyTemplateRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelSurveyTemplateGetListPaging>> GetList(SurveyTemplateGetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox(SurveyTemplateGetComboboxRequest request);
    }
}
