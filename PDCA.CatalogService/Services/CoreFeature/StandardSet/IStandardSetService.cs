using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.StandardSet
{
    public interface IStandardSetService
    {
        Task<ModelStandardSet> GetById(GetByIdRequest request);
        Task Insert(StandardSetRequest request);
        Task Update(StandardSetRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelStandardSetGetListPaging>> GetList(StandardSetGetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
    }
}
