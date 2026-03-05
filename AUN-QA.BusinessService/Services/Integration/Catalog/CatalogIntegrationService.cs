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
                throw new Exception("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }

            foreach (var item in lst)
            {
                yield return item;
            }
        }
        #endregion

        #region Cycle Service
        public async IAsyncEnumerable<CycleDto> GetCyclesStreamAsync(GetCyclesStreamRequest request, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var lst = new List<CycleDto>();
            try
            {
                // Gọi gRPC
                using var call = _grpcClient.GetCyclesStream(request, cancellationToken: cancellationToken);

                // Đọc stream từ gRPC và convert sang Model của mình
                await foreach (var item in call.ResponseStream.ReadAllAsync(cancellationToken))
                {
                    // Mapping: Proto -> DTO
                    lst.Add(new CycleDto
                    {
                        Id = Guid.Parse(item.Id),
                        Name = item.Name,
                        Year = item.Year,
                        StartDate = item.StartDate.ToDateTime().ToLocalTime(),
                        EndDate = item.EndDate.ToDateTime().ToLocalTime(),
                        Status = item.Status,
                        EvaluationPurpose = item.EvaluationPurpose,
                        Scope = item.Scope
                    });
                }
            }
            catch (RpcException)
            {
                throw new Exception("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }

            foreach (var item in lst)
            {
                yield return item;
            }
        }

        public async Task<int> GetUserRoleAsync(string cycleId, string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                var request = new GetUserRoleRequest
                {
                    CycleId = cycleId,
                    UserId = userId
                };

                var response = await _grpcClient.GetUserRoleAsync(request, cancellationToken: cancellationToken);
                return response.Value;
            }
            catch (RpcException)
            {
                throw new Exception("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }
        }

        public async Task<bool> IsUserInRoleAsync(string cycleId, string userId, int role, CancellationToken cancellationToken = default)
        {
            try
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
            catch (RpcException)
            {
                throw new Exception("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }
        }

        public async Task<bool> CanUserDoActionInPdcaAsync(string cycleId, string userId, string? standardId = null, List<int>? allowedRoles = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var request = new CanUserDoActionInPdcaRequest
                {
                    CycleId = cycleId,
                    UserId = userId
                };
                if (standardId != null)
                    request.StandardId = standardId;
                if (allowedRoles != null)
                    request.AllowedRoles.AddRange(allowedRoles);

                var response = await _grpcClient.CanUserDoActionInPdcaAsync(request, cancellationToken: cancellationToken);
                return response.Value;
            }
            catch (RpcException)
            {
                throw new Exception("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }
        }

        public async Task<List<Guid>> GetCycleIdsByUserAsync(string userId, CancellationToken cancellationToken = default)
        {
            try
            {
                var request = new GetCycleIdsByUserRequest
                {
                    UserId = userId
                };

                var response = await _grpcClient.GetCycleIdsByUserAsync(request, cancellationToken: cancellationToken);
                return response.CycleIds.Select(id => Guid.Parse(id)).ToList();
            }
            catch (RpcException)
            {
                throw new Exception("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
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
                throw new Exception("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
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
                throw new Exception("Lỗi kết nối đến CatalogService. Vui lòng thử lại sau.");
            }

            foreach (var item in lst)
            {
                yield return item;
            }
        }
        #endregion
    }
}
