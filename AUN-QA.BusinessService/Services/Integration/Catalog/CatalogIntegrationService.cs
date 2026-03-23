using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.Shared.Exceptions;
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
            var lst = new List<StakeholderDto>();
            try
            {
                // Gọi gRPC
                using var call = _grpcClient.GetStakeholdersStream(request, cancellationToken: cancellationToken);

                // Đọc stream từ gRPC và convert sang Model của mình
                await foreach (var item in call.ResponseStream.ReadAllAsync(cancellationToken))
                {
                    // Mapping: Proto -> DTO
                    lst.Add(new StakeholderDto
                    {
                        Id = Guid.Parse(item.Id),
                        FullName = item.FullName,
                        Email = item.Email,
                        Type = item.Type,
                        Description = item.Description,
                    });
                }
            }
            catch (RpcException)
            {
                throw new BusinessException("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }

            foreach (var item in lst)
            {
                yield return item;
            }
        }
        #endregion

        #region Standard Service
        public async IAsyncEnumerable<CriterionDto> GetCriterionsForEvidenceStreamAsync(GetCriterionsForEvidenceStreamRequest request, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var lst = new List<CriterionDto>();
            try
            {
                // Gọi gRPC
                using var call = _grpcClient.GetCriterionsForEvidenceStream(request, cancellationToken: cancellationToken);
                // Đọc stream từ gRPC và convert sang Model của mình
                await foreach (var item in call.ResponseStream.ReadAllAsync(cancellationToken))
                {
                    // Mapping: Proto -> DTO
                    lst.Add(new CriterionDto
                    {
                        Id = Guid.Parse(item.Id),
                        StandardId = Guid.Parse(item.StandardId),
                        Code = item.Code,
                        Name = item.Name,
                        IsPrerequisite = item.IsPrerequisite,
                        DiagnosticQuestions = item.DiagnosticQuestions,
                        Description = item.Description,
                        Order = item.Order
                    });
                }
            }
            catch (RpcException)
            {
                throw new BusinessException("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }

            foreach (var item in lst)
            {
                yield return item;
            }
        }

        public async IAsyncEnumerable<StandardWithCriteriaDto> GetStandardsWithCriteriaStreamAsync(GetStandardsWithCriteriaStreamRequest request, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var lst = new List<StandardWithCriteriaDto>();
            try
            {
                using var call = _grpcClient.GetStandardsWithCriteriaStream(request, cancellationToken: cancellationToken);
                await foreach (var item in call.ResponseStream.ReadAllAsync(cancellationToken))
                {
                    lst.Add(new StandardWithCriteriaDto
                    {
                        StandardId = Guid.Parse(item.StandardId),
                        StandardCode = item.StandardCode,
                        StandardName = item.StandardName,
                        StandardOrder = item.StandardOrder,
                        CriterionId = Guid.Parse(item.CriterionId),
                        CriterionCode = item.CriterionCode,
                        CriterionName = item.CriterionName,
                        IsPrerequisite = item.IsPrerequisite,
                        CriterionOrder = item.CriterionOrder
                    });
                }
            }
            catch (RpcException)
            {
                throw new BusinessException("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }

            foreach (var item in lst)
            {
                yield return item;
            }
        }
        #endregion

        #region FileType Service
        public async IAsyncEnumerable<FileTypeInfo> GetFileTypesStreamAsync(GetFileTypesStreamRequest request, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var lst = new List<FileTypeInfo>();
            try
            {
                // Gọi gRPC
                using var call = _grpcClient.GetFileTypesStream(request, cancellationToken: cancellationToken);

                // Đọc stream từ gRPC và convert sang Model của mình
                await foreach (var item in call.ResponseStream.ReadAllAsync(cancellationToken))
                {
                    // Mapping: Proto -> DTO
                    lst.Add(item);
                }
            }
            catch (RpcException)
            {
                throw new BusinessException("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }

            foreach (var item in lst)
            {
                yield return item;
            }
        }
        #endregion
    }
}
