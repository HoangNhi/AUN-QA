using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.Cycle
{
    public interface ICycleService
    {
        Task<ModelCycle> GetById(GetByIdRequest request);
        Task<ModelCycle> Insert(CycleRequest request);
        Task<ModelCycle> Update(CycleRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelCycleGetListPaging>> GetList(GetListPagingRequest request);
    }
}
