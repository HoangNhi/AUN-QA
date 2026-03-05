using AUN_QA.CatalogService.Protos;
using AUN_QA.CatalogService.Services.CoreFeature.Cycle;
using AUN_QA.CatalogService.Services.CoreFeature.FileType;
using AUN_QA.CatalogService.Services.CoreFeature.Stakeholder;
using AUN_QA.CatalogService.Services.CoreFeature.Standard;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

namespace AUN_QA.CatalogService.Services.gRPC
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CatalogGrpcService : CatalogProto.CatalogProtoBase
    {
        private readonly IStakeholderService _stakeholderService;
        private readonly ICycleService _cycleService;
        private readonly IStandardService _standardService;
        private readonly IFileTypeService _fileTypeService;

        public CatalogGrpcService(IStakeholderService stakeholderService, ICycleService cycleService, IStandardService standardService, IFileTypeService fileTypeService)
        {
            _stakeholderService = stakeholderService;
            _cycleService = cycleService;
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

        #region Cycle Service
        public override async Task GetCyclesStream(
            GetCyclesStreamRequest request,
            IServerStreamWriter<CycleInfo> responseStream,
            ServerCallContext context)
        {
            await foreach (var item in _cycleService.GetCyclesStreamAsync(
                request,
                context.CancellationToken))
            {
                await responseStream.WriteAsync(item);
            }
        }

        public override async Task<Int32Value> GetUserRole(GetUserRoleRequest request, ServerCallContext context)
        {
            var result = await _cycleService.GetUserRoleAsync(request);
            return new Int32Value { Value = (int)result };
        }

        public override async Task<BoolValue> IsUserInRole(IsUserInRoleRequest request, ServerCallContext context)
        {
            var result = await _cycleService.IsUserInRoleAsync(request);
            return new BoolValue { Value = result };
        }

        public override async Task<BoolValue> CanUserDoActionInPdca(
            CanUserDoActionInPdcaRequest request,
            ServerCallContext context)
        {
            var result = await _cycleService.CanUserDoActionInPdcaAsync(new CatalogService.DTOs.CoreFeature.Cycle.Requests.PdcaActionCheckRequest
            {
                UserId = Guid.Parse(request.UserId),
                CycleId = Guid.Parse(request.CycleId),
                StandardId = !string.IsNullOrEmpty(request.StandardId) ? Guid.Parse(request.StandardId) : null,
                AllowedRoles = request.AllowedRoles.Count > 0 ? request.AllowedRoles.ToList() : null
            });
            return new BoolValue { Value = result };
        }

        public override async Task<CycleIdsByUserResponse> GetCycleIdsByUser(
            GetCycleIdsByUserRequest request,
            ServerCallContext context)
        {
            var cycleIds = await _cycleService.GetCycleIdsByUserAsync(Guid.Parse(request.UserId));
            var response = new CycleIdsByUserResponse();
            response.CycleIds.AddRange(cycleIds.Select(id => id.ToString()));
            return response;
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