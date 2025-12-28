using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.SystemGroup.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.SystemGroup.Requests;

namespace AUN_QA.SystemService.Services.SystemGroup
{
    public interface ISystemGroupService
    {
        Task<ModelSystemGroup> GetById(GetByIdRequest request);
        Task<ModelSystemGroup> Insert(SystemGroupRequest request);
        Task<ModelSystemGroup> Update(SystemGroupRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelSystemGroupGetListPaging>> GetList(GetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
        Task<List<ModelSystemGroup>> GetAll();
    }
}
