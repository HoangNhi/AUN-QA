using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Criterion.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Criterion.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.Criterion
{
    public interface ICriterionService
    {
        Task<ModelCriterion> GetById(GetByIdRequest request);
        Task<ModelCriterion> Insert(CriterionRequest request);
        Task<ModelCriterion> Update(CriterionRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelCriterion>> GetList(GetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
    }
}
