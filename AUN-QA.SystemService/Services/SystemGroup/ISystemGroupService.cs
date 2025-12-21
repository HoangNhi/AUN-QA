using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.SystemGroup.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.SystemGroup.Requests;

namespace AUN_QA.SystemService.Services.SystemGroup
{
    public interface ISystemGroupService
    {
        ModelSystemGroup GetById(GetByIdRequest request);
        ModelSystemGroup Insert(SystemGroupRequest request);
        ModelSystemGroup Update(SystemGroupRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelSystemGroupGetListPaging>> GetList(GetListPagingRequest request);
        List<ModelCombobox> GetAllForCombobox();
        List<ModelSystemGroup> GetAll();
    }
}
