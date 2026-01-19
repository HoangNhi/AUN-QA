using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.Standard
{
    public interface IStandardService
    {
        Task<ModelStandard> GetById(GetByIdRequest request);
        Task<ModelStandard> Insert(StandardRequest request);
        Task<ModelStandard> Update(StandardRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelStandard>> GetList(GetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
    }
}
