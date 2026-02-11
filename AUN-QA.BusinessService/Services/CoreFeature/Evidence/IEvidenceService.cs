using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.Evidence
{
    public interface IEvidenceService
    {
        Task<ModelEvidence> GetById(GetByIdRequest request);
        Task Insert(EvidenceRequest request);
        Task Update(EvidenceRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelEvidenceGetListPaging>> GetList(GetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
    }
}
