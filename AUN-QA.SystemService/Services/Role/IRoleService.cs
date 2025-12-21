using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.Permission.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Permission.Requests;
using AUN_QA.SystemService.DTOs.CoreFeature.Role.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Role.Requests;

namespace AUN_QA.SystemService.Services.Role
{
    public interface IRoleService
    {
        ModelRole GetById(GetByIdRequest request);
        ModelRole Insert(RoleRequest request);
        ModelRole Update(RoleRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelRoleGetListPaging>> GetList(GetListPagingRequest request);
        Task<List<ModelPermission>> GetPermissionsByRole(GetByIdRequest request);
        bool UpdatePermissions(UpdatePermissionsRequest request);
        List<ModelCombobox> GetAllForCombobox();
        Task<List<ModelGetPermissionByUser>> GetPermissionsByUser(GetByIdRequest request);
    }
}
