using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.Services.CoreFeature.Sar
{
    public interface ISarService
    {
        Task<GetListPagingResponse<SarGetListItemDto>> GetList(SarGetListPagingRequest request);

        Task<SarDraftDto?> GetByCycle(GetSarByCycleRequest request);

        Task SaveDraft(SaveSarDraftRequest request);

        Task Submit(SubmitSarRequest request);

        Task RequestRevision(RequestSarRevisionRequest request);

        Task Approve(ApproveSarRequest request);

        Task<SarAutofillPayloadDto> GetAutofillPayload(GetSarAutofillPayloadRequest request);

        Task<byte[]> ExportDocx(ExportSarDocxRequest request);
    }
}
