using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Responses;

namespace AUN_QA.BusinessService.Services.CoreFeature.EvidenceCycleMap
{
    public interface IEvidenceCycleMapService
    {
        Task<EvidenceCycleMapRequest> GetById(GetByIdRequest request);
        Task InsertWithEvidence(EvidenceCycleMapRequest request);
        Task Update(EvidenceCycleMapRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelEvidenceCycleMapGetListPaging>> GetList(EvidenceCycleMapGetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
        Task SubmitToApprove(EvidenceSubmitToApproveRequest request);
        Task Approve(EvidenceCycleMapApproveRequest request);
        Task<List<VerifiedFileTypeCountResponse>> GetVerifiedFileTypeCountsAsync(Guid cycleId);
        Task<GetListPagingResponse<ModelVerifiedEvidenceForReuse>> GetVerifiedForReuseAsync(VerifiedEvidenceForReuseRequest request);
        Task ReuseVerifiedEvidenceAsync(ReuseVerifiedEvidenceRequest request);
    }
}
