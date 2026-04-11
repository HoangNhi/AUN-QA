using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.Cycle
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

        #region PDCA Permissions (dùng nội bộ bởi các service khác trong BusinessService)
        /// <summary>
        /// Kiểm tra xem người dùng có quyền thực hiện hành động trong chu kỳ PDCA hay không.
        /// Áp dụng đầy đủ quy tắc RBAC 2 tầng theo RBAC_Permission_Matrix v1.4.
        /// </summary>
        Task<bool> CanUserDoActionInPdcaAsync(PdcaActionCheckRequest request);
        Task<bool> IsUserInRoleAsync(Guid cycleId, Guid userId, int role);
        Task<int?> GetUserRoleAsync(Guid cycleId, Guid userId);
        Task<List<Guid>> GetCycleIdsByUserAsync(Guid userId);
        Task<(bool Found, int Status)> GetCycleStatusAsync(Guid cycleId);
        Task<bool> IsRevisionAllowedAsync(Guid cycleId);
        #endregion
    }
}
