using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.Evidence
{
    public interface IEvidenceService
    {
        Task<ModelEvidence> GetById(GetByIdRequest request);
        Task<ModelEvidence> Insert(EvidenceRequest request);
        Task<ModelEvidence> Update(EvidenceRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelEvidence>> GetList(GetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
    }
}
