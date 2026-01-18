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
        public async IAsyncEnumerable<StakeholderDto> GetStakeholdersStreamAsync(GetStakeholdersStreamRequest request, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
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
        public async IAsyncEnumerable<CycleDto> GetCyclesStreamAsync(GetCyclesStreamRequest request, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            // Gọi gRPC
            using var call = _grpcClient.GetCyclesStream(request, cancellationToken: cancellationToken);

            // Đọc stream từ gRPC và convert sang Model của mình
            await foreach (var item in call.ResponseStream.ReadAllAsync(cancellationToken))
            {
                // Mapping: Proto -> DTO
                yield return new CycleDto
                {
                    Id = Guid.Parse(item.Id),
                    Name = item.Name,
                    Year = item.Year,
                    StartDate = item.StartDate.ToDateTime().ToLocalTime(),
                    EndDate = item.EndDate.ToDateTime().ToLocalTime(),
                    Status = item.Status,
                    EvaluationPurpose = item.EvaluationPurpose,
                    Scope = item.Scope
                };
            }
        }

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
