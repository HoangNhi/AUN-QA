using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.User.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.User.Requests;

namespace AUN_QA.IdentityService.Services.User
{
    public interface IUserService
    {
        ModelUser GetById(GetByIdRequest request);
        ModelUser Insert(UserRequest request);
        ModelUser Update(UserRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelUser>> GetList(GetListPagingRequest request);
    }
}
