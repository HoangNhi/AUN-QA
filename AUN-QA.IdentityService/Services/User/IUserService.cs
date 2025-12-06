using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.User.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.User.Requests;

namespace AUN_QA.IdentityService.Services.User
{
    public interface IUserService
    {
        MODELUser GetById(GetByIdRequest request);
        MODELUser Insert(UserRequest request);
        MODELUser Update(UserRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<MODELUser>> GetList(GetListPagingRequest request);
    }
}
