using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.EvidenceCycleMap
{
    public interface IEvidenceCycleMapService
    {
        Task<ModelEvidenceCycleMap> GetById(GetByIdRequest request);
        Task Insert(EvidenceCycleMapRequest request);
        Task Update(EvidenceCycleMapRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelEvidenceCycleMap>> GetList(GetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
    }
}
