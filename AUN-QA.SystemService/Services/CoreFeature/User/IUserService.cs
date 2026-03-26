using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.User.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.User.Requests;

namespace AUN_QA.SystemService.Services.CoreFeature.User
{
    public interface IUserService
    {
        Task<ModelUser> GetById(GetByIdRequest request);
        Task<List<ModelUser>> GetByIds(List<Guid> ids);
        Task<ModelUser> Insert(UserRequest request);
        Task<ModelUser> Update(UserRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelUserGetListPaging>> GetList(GetListPagingRequest request);
        Task<CheckPermissionReponse> CheckPermission(CheckPermissionRequest request);
        Task<ModelUser> GetCurrentUser();
        Task<List<ModelCombobox>> GetAllForCombobox();
        Task<ModelUser> EditProfile(EditProfileRequest request);
        Task<ModelUser> ChangePassword(ChangePasswordRequest request);
    }
}
