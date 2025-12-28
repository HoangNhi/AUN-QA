using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.Menu.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Menu.Requests;

namespace AUN_QA.SystemService.Services.Menu
{
    public interface IMenuService
    {
        Task<ModelMenu> GetById(GetByIdRequest request);
        Task<ModelMenu> Insert(MenuRequest request);
        Task<ModelMenu> Update(MenuRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelMenuGetListPaging>> GetList(GetListPagingRequest request);
        Task<List<ModelMenuGetListPaging>> GetListByUser(GetByIdRequest request);
    }
}
