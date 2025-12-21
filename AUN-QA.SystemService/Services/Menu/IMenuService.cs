using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.Menu.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Menu.Requests;

namespace AUN_QA.SystemService.Services.Menu
{
    public interface IMenuService
    {
        ModelMenu GetById(GetByIdRequest request);
        ModelMenu Insert(MenuRequest request);
        ModelMenu Update(MenuRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelMenuGetListPaging>> GetList(GetListPagingRequest request);
        Task<List<ModelMenuGetListPaging>> GetListByUser(GetByIdRequest request);
    }
}
