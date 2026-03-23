using AUN_QA.CatalogService.Protos;
using AUN_QA.CatalogService.Services.CoreFeature.FileType;
using AUN_QA.CatalogService.Services.CoreFeature.Stakeholder;
using AUN_QA.CatalogService.Services.CoreFeature.Standard;
using Grpc.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

namespace AUN_QA.CatalogService.Services.gRPC
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CatalogGrpcService : CatalogProto.CatalogProtoBase
    {
        private readonly IStakeholderService _stakeholderService;
        private readonly IStandardService _standardService;
        private readonly IFileTypeService _fileTypeService;

        public CatalogGrpcService(IStakeholderService stakeholderService, IStandardService standardService, IFileTypeService fileTypeService)
        {
            _stakeholderService = stakeholderService;
            _standardService = standardService;
            _fileTypeService = fileTypeService;
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
    }
}