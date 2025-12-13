using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.Permission.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Permission.Requests;
using AUN_QA.IdentityService.DTOs.CoreFeature.Role.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Role.Requests;

namespace AUN_QA.IdentityService.Services.Role
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
    }
}
