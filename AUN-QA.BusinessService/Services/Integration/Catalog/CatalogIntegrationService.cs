using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.CatalogService.Protos;
using AutoDependencyRegistration.Attributes;
using Grpc.Core;
using System.Runtime.CompilerServices;

namespace AUN_QA.BusinessService.Services.Integration.Catalog
{
    [RegisterClassAsScoped]
    public class CatalogIntegrationService : ICatalogIntegrationService
    {
        private readonly CatalogProto.CatalogProtoClient _grpcClient;

        public CatalogIntegrationService(CatalogProto.CatalogProtoClient grpcClient)
        {
            _grpcClient = grpcClient;
        }

        #region Stakeholder Service
        public async IAsyncEnumerable<StakeholderDto> GetStakeholdersStreamAsync(int? type, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var request = new GetStakeholdersStreamRequest { StakeholderType = type };

            // Gọi gRPC
            using var call = _grpcClient.GetStakeholdersStream(request, cancellationToken: cancellationToken);

            // Đọc stream từ gRPC và convert sang Model của mình
            await foreach (var item in call.ResponseStream.ReadAllAsync(cancellationToken))
            {
                // Mapping: Proto -> DTO
                yield return new StakeholderDto
                {
                    Id = Guid.Parse(item.Id),
                    FullName = item.FullName,
                    Email = item.Email,
                    Type = item.Type,
                    Description = item.Description,
                };
            }
        }
        #endregion

        #region Cycle Service
        public async Task<int> GetUserRoleAsync(string cycleId, string userId, CancellationToken cancellationToken = default)
        {
            var request = new GetUserRoleRequest
            {
                CycleId = cycleId,
                UserId = userId
            };

            var response = await _grpcClient.GetUserRoleAsync(request, cancellationToken: cancellationToken);
            return response.Value;
        }

        public async Task<bool> IsUserInRoleAsync(string cycleId, string userId, int role, CancellationToken cancellationToken = default)
        {
            var request = new IsUserInRoleRequest
            {
                CycleId = cycleId,
                UserId = userId,
                Role = role
            };

            var response = await _grpcClient.IsUserInRoleAsync(request, cancellationToken: cancellationToken);
            return response.Value;
        }
        #endregion
    }
}
