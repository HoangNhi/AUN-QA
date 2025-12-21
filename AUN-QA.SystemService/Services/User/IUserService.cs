using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.User.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.User.Requests;

namespace AUN_QA.SystemService.Services.User
{
    public interface IUserService
    {
        Task<ModelUser> GetById(GetByIdRequest request);
        Task<ModelUser> Insert(UserRequest request);
        Task<ModelUser> Update(UserRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelUser>> GetList(GetListPagingRequest request);
        Task<CheckPermissionReponse> CheckPermission(CheckPermissionRequest request);
        Task<ModelUser> GetCurrentUser();
    }
}
