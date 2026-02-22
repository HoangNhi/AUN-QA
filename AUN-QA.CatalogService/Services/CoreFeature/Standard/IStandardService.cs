using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests;
using AUN_QA.CatalogService.Protos;

namespace AUN_QA.CatalogService.Services.CoreFeature.Standard
{
    public interface IStandardService
    {
        Task<StandardRequest> GetById(GetByIdRequest request);
        Task Insert(StandardRequest request);
        Task Update(StandardRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelStandardGetListPaging>> GetList(GetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
        Task<List<StandardRequest>> GetListWithCriteria(GetListStandardWithCriteriaRequest request);
        Task<List<ModelStandard>> GetByStandardSetId(Guid standardSetId);

        // gRPC Services
        IAsyncEnumerable<CriterionInfo> GetCriterionsForEvidenceStreamAsync(
            GetCriterionsForEvidenceStreamRequest request,
            CancellationToken cancellationToken = default);
    }
}
