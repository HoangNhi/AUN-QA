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
    }
}
