using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Requests;

namespace AUN_QA.IdentityService.Services.SystemGroup
{
    public interface ISystemGroupService
    {
        ModelSystemGroup GetById(GetByIdRequest request);
        ModelSystemGroup Insert(SystemGroupRequest request);
        ModelSystemGroup Update(SystemGroupRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelSystemGroupGetListPaging>> GetList(GetListPagingRequest request);
        List<MODELCombobox> GetAllForCombobox();
    }
}
