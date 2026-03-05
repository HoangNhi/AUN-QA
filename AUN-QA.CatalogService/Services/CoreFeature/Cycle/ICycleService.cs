using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.CatalogService.Protos;

namespace AUN_QA.CatalogService.Services.CoreFeature.Cycle
{
    public interface ICycleService
    {
        #region Chức năng chính
        Task<ModelCycle> GetById(GetByIdRequest request);
        Task Insert(CycleRequest request);
        Task Update(CycleRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelCycleGetListPaging>> GetList(CycleGetListPagingRequest request);
        Task<List<ModelCombobox>> GetComboboxByUser();
        Task ChangeStatusAsync(CycleChangeStatusRequest request);
        #endregion

        #region GRPC Services
        IAsyncEnumerable<CycleInfo> GetCyclesStreamAsync(GetCyclesStreamRequest request, CancellationToken cancellationToken = default);
        Task<bool> IsUserInRoleAsync(IsUserInRoleRequest request);
        Task<int?> GetUserRoleAsync(GetUserRoleRequest request);
        Task<List<Guid>> GetCycleIdsByUserAsync(Guid userId);
        #endregion

        #region PDCA Permissions
        /// <summary>
        /// Kiểm tra xem người dùng có quyền thực hiện hành động trong chu kỳ PDCA hay không.
        /// Áp dụng đầy đủ quy tắc RBAC 2 tầng theo RBAC_Permission_Matrix v1.3:
        /// vai trò HĐ, ủy quyền PCT, và phạm vi tiêu chuẩn phụ trách (sc).
        /// </summary>
        Task<bool> CanUserDoActionInPdcaAsync(PdcaActionCheckRequest request);
        #endregion
    }
}
