using AUN_QA.CatalogService.Protos;
using AUN_QA.CatalogService.Services.CoreFeature.FileType;
using AUN_QA.CatalogService.Services.CoreFeature.Stakeholder;
using AUN_QA.CatalogService.Services.CoreFeature.Standard;
using AUN_QA.CatalogService.Infrastructure.Data;
using Grpc.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.CatalogService.Services.gRPC
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CatalogGrpcService : CatalogProto.CatalogProtoBase
    {
        private readonly IStakeholderService _stakeholderService;
        private readonly IStandardService _standardService;
        private readonly IFileTypeService _fileTypeService;
        private readonly CatalogContext _context;

        public CatalogGrpcService(
            IStakeholderService stakeholderService,
            IStandardService standardService,
            IFileTypeService fileTypeService,
            CatalogContext context)
        {
            _stakeholderService = stakeholderService;
            _standardService = standardService;
            _fileTypeService = fileTypeService;
            _context = context;
        }

        #region Stakeholder Service
        public override async Task GetStakeholdersStream(
            GetStakeholdersStreamRequest request,
            IServerStreamWriter<StakeholderInfo> responseStream,
            ServerCallContext context)
        {
            await foreach (var item in _stakeholderService.GetStakeholdersStreamAsync(
                request,
                context.CancellationToken))
            {
                await responseStream.WriteAsync(item);
            }
        }
        #endregion

        #region Standard Service
        public override async Task GetCriterionsForEvidenceStream(
            GetCriterionsForEvidenceStreamRequest request,
            IServerStreamWriter<CriterionInfo> responseStream,
            ServerCallContext context)
        {
            await foreach (var item in _standardService.GetCriterionsForEvidenceStreamAsync(
                request,
                context.CancellationToken))
            {
                await responseStream.WriteAsync(item);
            }
        }

        public override async Task GetStandardsWithCriteriaStream(
            GetStandardsWithCriteriaStreamRequest request,
            IServerStreamWriter<StandardWithCriteriaInfo> responseStream,
            ServerCallContext context)
        {
            await foreach (var item in _standardService.GetStandardsWithCriteriaStreamAsync(
                request,
                context.CancellationToken))
            {
                await responseStream.WriteAsync(item);
            }
        }

        public override async Task GetFileTypesByCriterionStream(
            GetFileTypesByCriterionStreamRequest request,
            IServerStreamWriter<FileTypeInfo> responseStream,
            ServerCallContext context)
        {
            await foreach (var item in _standardService.GetFileTypesByCriterionStreamAsync(
                request,
                context.CancellationToken))
            {
                await responseStream.WriteAsync(item);
            }
        }
        #endregion

        #region FileType Service
        public override async Task GetFileTypesStream(
           GetFileTypesStreamRequest request,
           IServerStreamWriter<FileTypeInfo> responseStream,
           ServerCallContext context)
        {
            await foreach (var item in _fileTypeService.GetFileTypesStreamAsync(
                request,
                context.CancellationToken))
            {
                await responseStream.WriteAsync(item);
            }
        }
        #endregion

        #region StandardSet Service
        public override async Task<GetStandardSetEvaluationModeResponse> GetStandardSetEvaluationMode(
            GetStandardSetEvaluationModeRequest request,
            ServerCallContext context)
        {
            var id = Guid.Parse(request.StandardSetId);
            var standardSet = await _context.StandardSets
                .AsNoTracking()
                .Where(x => x.Id == id && !x.IsDeleted && x.IsActived)
                .Select(x => new { x.EvaluationMode })
                .FirstOrDefaultAsync(context.CancellationToken);

            return new GetStandardSetEvaluationModeResponse
            {
                EvaluationMode = standardSet?.EvaluationMode ?? 1
            };
        }
        #endregion
    }
}
