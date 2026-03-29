using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.Evidence
{
    public interface IEvidenceService
    {
        Task<ModelEvidence> GetById(GetByIdRequest request);
        Task<ModelFilePreview> PreviewAttachment(Guid attachmentId, string mode);
        Task Insert(EvidenceRequest request);
        Task Update(EvidenceRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelEvidenceGetListPaging>> GetList(EvidenceGetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
        Task SubmitForReview(EvidenceSubmitToApproveRequest request);
        Task Approve(EvidenceApproveRequest request);
    }
}
