using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.Menu.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Menu.Requests;

namespace AUN_QA.IdentityService.Services.Menu
{
    public interface IMenuService
    {
        ModelMenu GetById(GetByIdRequest request);
        ModelMenu Insert(MenuRequest request);
        ModelMenu Update(MenuRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelMenu>> GetList(GetListPagingRequest request);
    }
}
