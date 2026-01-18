using AUN_QA.CatalogService.Protos;
using AUN_QA.CatalogService.Services.CoreFeature.Cycle;
using AUN_QA.CatalogService.Services.CoreFeature.Stakeholder;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;

namespace AUN_QA.CatalogService.Services.gRPC
{
    public class CatalogGrpcService : CatalogProto.CatalogProtoBase
    {
        private readonly IStakeholderService _stakeholderService;
        private readonly ICycleService _cycleService;

        public CatalogGrpcService(IStakeholderService stakeholderService, ICycleService cycleService)
        {
            _stakeholderService = stakeholderService;
            _cycleService = cycleService;
        }

        #region Stakeholder Service
        public override async Task GetStakeholdersStream(
            GetStakeholdersStreamRequest request,
            IServerStreamWriter<StakeholderMinimalInfo> responseStream,
            ServerCallContext context)
        {
            await foreach (var item in _stakeholderService.GetStakeholdersStreamAsync(
                request.StakeholderType,
                context.CancellationToken))
            {
                await responseStream.WriteAsync(item);
            }
        }

        #endregion

        #region Cycle Service
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

        #endregion
    }
}