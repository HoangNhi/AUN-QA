using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.CatalogService.Protos;

namespace AUN_QA.CatalogService.Services.CoreFeature.Cycle
{
    public interface ICycleService
    {
        #region Chức năng chính
        Task<ModelCycle> GetById(GetByIdRequest request);
        Task<ModelCycle> Insert(CycleRequest request);
        Task<ModelCycle> Update(CycleRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelCycleGetListPaging>> GetList(CycleGetListPagingRequest request);
        Task<List<ModelCombobox>> GetComboboxByUser();
        #endregion

        #region GRPC Services
        IAsyncEnumerable<CycleInfo> GetCyclesStreamAsync(GetCyclesStreamRequest request, CancellationToken cancellationToken = default);
        Task<bool> IsUserInRoleAsync(IsUserInRoleRequest request);
        Task<int?> GetUserRoleAsync(GetUserRoleRequest request);
        #endregion
    }
}
