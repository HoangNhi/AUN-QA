using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.Shared.Exceptions;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.Protos;
using AutoDependencyRegistration.Attributes;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.ExternalReview
{
    [RegisterClassAsTransient]
    public class ExternalReviewService : IExternalReviewService
    {
        private const string ExtRoleId = "551d1351-008e-4910-a39c-1fcdde409fdf";

        private readonly BusinessContext _context;
        private readonly IHttpContextAccessor _accessor;
        private readonly SystemProto.SystemProtoClient _systemClient;

        public ExternalReviewService(
            BusinessContext context,
            IHttpContextAccessor accessor,
            SystemProto.SystemProtoClient systemClient)
        {
            _context = context;
            _accessor = accessor;
            _systemClient = systemClient;
        }

        public async Task<ModelExternalReview> CreateAsync(ExternalReviewRequest request)
        {
            var cycleExists = await _context.Cycles
                .AsNoTracking()
                .AnyAsync(x => x.Id == request.CycleId && !x.IsDeleted && x.IsActived);

            if (!cycleExists)
            {
                throw new BusinessException("Chu kỳ không tồn tại.");
            }

            var reviewExists = await _context.ExternalReviews
                .AnyAsync(x => x.CycleId == request.CycleId && !x.IsDeleted);

            if (reviewExists)
            {
                throw new BusinessException("Chu kỳ này đã có đánh giá ngoài.");
            }

            var now = DateTime.UtcNow;
            var username = GetCurrentUsernameOrThrow();

            var review = new Entities.ExternalReview
            {
                Id = Guid.NewGuid(),
                CycleId = request.CycleId,
                Status = (int)ExternalReviewStatus.New,
                WatermarkOpacity = 25,
                WatermarkPosition = (int)WatermarkPosition.Diagonal,
                IsCompleted = false,
                CreatedAt = now,
                CreatedBy = username,
                IsActived = true,
                IsDeleted = false
            };

            _context.ExternalReviews.Add(review);
            await _context.SaveChangesAsync();

            return MapReview(review);
        }

        public async Task<GetListPagingResponse<ExternalReviewListItemDto>> GetListAsync(
            ExternalReviewGetListPagingRequest request)
        {
            var pageIndex = request.PageIndex <= 0 ? 1 : request.PageIndex;
            var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

            var query = from review in _context.ExternalReviews.AsNoTracking()
                        join cycle in _context.Cycles.AsNoTracking()
                            on review.CycleId equals cycle.Id
                        where !review.IsDeleted
                              && review.IsActived
                              && !cycle.IsDeleted
                              && cycle.IsActived
                        select new
                        {
                            Review = review,
                            Cycle = cycle
                        };

            if (!string.IsNullOrWhiteSpace(request.TextSearch))
            {
                var text = request.TextSearch.Trim();
                query = query.Where(x => x.Cycle.Name.Contains(text));
            }

            if (request.Status.HasValue)
            {
                var status = request.Status.Value;
                query = query.Where(x => x.Review.Status == status);
            }

            if (request.CycleId.HasValue)
            {
                var cycleId = request.CycleId.Value;
                query = query.Where(x => x.Cycle.Id == cycleId);
            }

            var totalRow = await query.CountAsync();

            var pageItems = await query
                .OrderByDescending(x => x.Cycle.Year)
                .ThenByDescending(x => x.Review.CreatedAt)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new
                {
                    x.Review.Id,
                    x.Review.CycleId,
                    CycleName = x.Cycle.Name,
                    x.Cycle.Year,
                    x.Review.Status,
                    x.Review.IsCompleted,
                    x.Review.CreatedAt
                })
                .ToListAsync();

            var reviewIds = pageItems.Select(x => x.Id).ToList();
            var accountCounts = reviewIds.Count == 0
                ? new Dictionary<Guid, int>()
                : await _context.ExternalReviewAccounts
                    .AsNoTracking()
                    .Where(x => reviewIds.Contains(x.ExternalReviewId))
                    .GroupBy(x => x.ExternalReviewId)
                    .Select(x => new { x.Key, Count = x.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Count);

            var resultCounts = reviewIds.Count == 0
                ? new Dictionary<Guid, int>()
                : await _context.ExternalReviewResults
                    .AsNoTracking()
                    .Where(x => reviewIds.Contains(x.ExternalReviewId) && !x.IsDeleted && x.IsActived)
                    .GroupBy(x => x.ExternalReviewId)
                    .Select(x => new { x.Key, Count = x.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Count);

            var data = pageItems.Select(x => new ExternalReviewListItemDto
            {
                Id = x.Id,
                CycleId = x.CycleId,
                CycleName = x.CycleName,
                Year = x.Year,
                Status = x.Status,
                IsCompleted = x.IsCompleted,
                AccountCount = accountCounts.TryGetValue(x.Id, out var accountCount) ? accountCount : 0,
                ResultCount = resultCounts.TryGetValue(x.Id, out var resultCount) ? resultCount : 0,
                CreatedAt = x.CreatedAt
            }).ToList();

            return new GetListPagingResponse<ExternalReviewListItemDto>
            {
                PageIndex = pageIndex,
                PageSize = pageSize,
                TotalRow = totalRow,
                Data = data
            };
        }

        public async Task<ModelExternalReview?> GetByCycleIdAsync(Guid cycleId)
        {
            var review = await _context.ExternalReviews
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.CycleId == cycleId && !x.IsDeleted && x.IsActived);

            if (review == null)
            {
                return null;
            }

            var results = await _context.ExternalReviewResults
                .AsNoTracking()
                .Where(x => x.ExternalReviewId == review.Id && !x.IsDeleted && x.IsActived)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var resultIds = results.Select(x => x.Id).ToList();
            var findings = resultIds.Count == 0
                ? new List<Entities.ExternalReviewFinding>()
                : await _context.ExternalReviewFindings
                    .AsNoTracking()
                    .Where(x => resultIds.Contains(x.ExternalReviewResultId) && !x.IsDeleted && x.IsActived)
                    .OrderBy(x => x.CreatedAt)
                    .ToListAsync();

            var findingsByResult = findings
                .GroupBy(x => x.ExternalReviewResultId)
                .ToDictionary(x => x.Key, x => x.ToList());

            var model = MapReview(review);
            model.Results = results
                .Select(x => MapResult(
                    x,
                    findingsByResult.TryGetValue(x.Id, out var resultFindings)
                        ? resultFindings
                        : new List<Entities.ExternalReviewFinding>()))
                .ToList();

            return model;
        }

        public async Task UpdateStatusAsync(ExternalReviewStatusRequest request)
        {
            var review = await GetReviewOrThrowAsync(request.Id);
            var targetStatus = ParseStatusOrThrow(request.Status);

            if (targetStatus == ExternalReviewStatus.Completed)
            {
                throw new BusinessException("Trạng thái Completed phải dùng API confirm-completion.");
            }

            if (review.IsCompleted || review.Status == (int)ExternalReviewStatus.Completed)
            {
                throw new BusinessException("Đánh giá ngoài đã hoàn tất, không thể cập nhật trạng thái.");
            }

            var now = DateTime.UtcNow;
            var username = GetCurrentUsernameOrThrow();

            review.Status = (int)targetStatus;
            review.UpdatedAt = now;
            review.UpdatedBy = username;
            review.IsCompleted = false;
            review.CompletedAt = null;
            review.CompletedBy = null;

            await _context.SaveChangesAsync();
            await SyncAccountActivationAsync(
                review.Id,
                targetStatus == ExternalReviewStatus.InProgress);
        }

        public async Task UpdateWatermarkAsync(ExternalReviewWatermarkRequest request)
        {
            var review = await GetReviewOrThrowAsync(request.Id);

            if (review.IsCompleted || review.Status == (int)ExternalReviewStatus.Completed)
            {
                throw new BusinessException("Đánh giá ngoài đã hoàn tất, không thể cập nhật watermark.");
            }

            ParseWatermarkPositionOrThrow(request.WatermarkPosition);

            var now = DateTime.UtcNow;
            var username = GetCurrentUsernameOrThrow();

            review.WatermarkText = request.WatermarkText.Trim();
            review.WatermarkOpacity = request.WatermarkOpacity;
            review.WatermarkPosition = request.WatermarkPosition;
            review.UpdatedAt = now;
            review.UpdatedBy = username;

            await _context.SaveChangesAsync();
        }

        public async Task ConfirmCompletionAsync(Guid id)
        {
            var review = await GetReviewOrThrowAsync(id);

            if (review.IsCompleted && review.Status == (int)ExternalReviewStatus.Completed)
            {
                await SyncAccountActivationAsync(id, false);
                return;
            }

            var hasResult = await _context.ExternalReviewResults
                .AnyAsync(x => x.ExternalReviewId == id && !x.IsDeleted && x.IsActived);

            if (!hasResult)
            {
                throw new BusinessException("Cần ít nhất 1 kết quả trước khi xác nhận hoàn tất.");
            }

            var now = DateTime.UtcNow;
            var username = GetCurrentUsernameOrThrow();

            review.Status = (int)ExternalReviewStatus.Completed;
            review.IsCompleted = true;
            review.CompletedAt = now;
            review.CompletedBy = username;
            review.UpdatedAt = now;
            review.UpdatedBy = username;

            await _context.SaveChangesAsync();
            await SyncAccountActivationAsync(id, false);
        }

        public async Task<ModelExternalReviewResult> UpsertResultAsync(ExternalReviewResultRequest request)
        {
            var review = await GetReviewOrThrowAsync(request.ExternalReviewId);

            if (review.IsCompleted || review.Status == (int)ExternalReviewStatus.Completed)
            {
                throw new BusinessException("Đánh giá ngoài đã hoàn tất, không thể cập nhật kết quả.");
            }

            var now = DateTime.UtcNow;
            var username = GetCurrentUsernameOrThrow();

            var existingResult = await _context.ExternalReviewResults
                .FirstOrDefaultAsync(x =>
                    x.ExternalReviewId == request.ExternalReviewId
                    && x.StandardId == request.StandardId
                    && !x.IsDeleted);

            if (existingResult != null)
            {
                existingResult.Strengths = request.Strengths;
                existingResult.UpdatedAt = now;
                existingResult.UpdatedBy = username;
                existingResult.IsActived = true;

                await _context.SaveChangesAsync();

                var findings = await _context.ExternalReviewFindings
                    .AsNoTracking()
                    .Where(x => x.ExternalReviewResultId == existingResult.Id && !x.IsDeleted && x.IsActived)
                    .OrderBy(x => x.CreatedAt)
                    .ToListAsync();

                return MapResult(existingResult, findings);
            }

            var result = new Entities.ExternalReviewResult
            {
                Id = Guid.NewGuid(),
                ExternalReviewId = request.ExternalReviewId,
                StandardId = request.StandardId,
                Strengths = request.Strengths,
                CreatedAt = now,
                CreatedBy = username,
                IsActived = true,
                IsDeleted = false
            };

            _context.ExternalReviewResults.Add(result);
            await _context.SaveChangesAsync();

            return MapResult(result, new List<Entities.ExternalReviewFinding>());
        }

        public async Task<ModelExternalReviewFinding> AddFindingAsync(ExternalReviewFindingRequest request)
        {
            ParseFindingTypeOrThrow(request.FindingType);

            var result = await _context.ExternalReviewResults
                .Include(x => x.ExternalReview)
                .FirstOrDefaultAsync(x => x.Id == request.ExternalReviewResultId && !x.IsDeleted && x.IsActived);

            if (result == null)
            {
                throw new BusinessException("Không tìm thấy kết quả đánh giá.");
            }

            if (result.ExternalReview.IsCompleted || result.ExternalReview.Status == (int)ExternalReviewStatus.Completed)
            {
                throw new BusinessException("Đánh giá ngoài đã hoàn tất, không thể thêm phát hiện.");
            }

            var now = DateTime.UtcNow;
            var username = GetCurrentUsernameOrThrow();

            var finding = new Entities.ExternalReviewFinding
            {
                Id = Guid.NewGuid(),
                ExternalReviewResultId = request.ExternalReviewResultId,
                FindingType = request.FindingType,
                Content = request.Content.Trim(),
                CriterionId = request.CriterionId,
                CreatedAt = now,
                CreatedBy = username,
                IsActived = true,
                IsDeleted = false
            };

            _context.ExternalReviewFindings.Add(finding);
            await _context.SaveChangesAsync();

            return MapFinding(finding);
        }

        public async Task UpdateFindingAsync(ExternalReviewFindingUpdateRequest request)
        {
            ParseFindingTypeOrThrow(request.FindingType);

            var finding = await _context.ExternalReviewFindings
                .Include(x => x.ExternalReviewResult)
                .ThenInclude(x => x.ExternalReview)
                .FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted && x.IsActived);

            if (finding == null)
            {
                throw new BusinessException("Không tìm thấy phát hiện.");
            }

            if (finding.ExternalReviewResult.ExternalReview.IsCompleted
                || finding.ExternalReviewResult.ExternalReview.Status == (int)ExternalReviewStatus.Completed)
            {
                throw new BusinessException("Đánh giá ngoài đã hoàn tất, không thể cập nhật phát hiện.");
            }

            finding.FindingType = request.FindingType;
            finding.Content = request.Content.Trim();
            finding.CriterionId = request.CriterionId;
            finding.UpdatedAt = DateTime.UtcNow;
            finding.UpdatedBy = GetCurrentUsernameOrThrow();

            await _context.SaveChangesAsync();
        }

        public async Task DeleteFindingAsync(Guid findingId)
        {
            var finding = await _context.ExternalReviewFindings
                .Include(x => x.ExternalReviewResult)
                .ThenInclude(x => x.ExternalReview)
                .FirstOrDefaultAsync(x => x.Id == findingId && !x.IsDeleted && x.IsActived);

            if (finding == null)
            {
                throw new BusinessException("Không tìm thấy phát hiện.");
            }

            if (finding.ExternalReviewResult.ExternalReview.IsCompleted
                || finding.ExternalReviewResult.ExternalReview.Status == (int)ExternalReviewStatus.Completed)
            {
                throw new BusinessException("Đánh giá ngoài đã hoàn tất, không thể xóa phát hiện.");
            }

            finding.IsDeleted = true;
            finding.IsActived = false;
            finding.UpdatedAt = DateTime.UtcNow;
            finding.UpdatedBy = GetCurrentUsernameOrThrow();

            await _context.SaveChangesAsync();
        }

        public async Task<List<ModelExtAccount>> GetAccountsAsync(Guid externalReviewId)
        {
            await GetReviewOrThrowAsync(externalReviewId);

            var accounts = await _context.ExternalReviewAccounts
                .AsNoTracking()
                .Where(x => x.ExternalReviewId == externalReviewId)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new ModelExtAccount
                {
                    Id = x.Id,
                    ExternalReviewId = x.ExternalReviewId,
                    UserId = x.UserId,
                    CreatedAt = x.CreatedAt,
                    CreatedBy = x.CreatedBy
                })
                .ToListAsync();

            if (accounts.Count == 0)
            {
                return accounts;
            }

            try
            {
                var request = new GetUsersByIdsRequest();
                request.UserIds.AddRange(accounts.Select(x => x.UserId.ToString()));
                var response = await _systemClient.GetUsersByIdsAsync(request);

                var userMap = response.Users
                    .Where(x => !string.IsNullOrWhiteSpace(x.Id))
                    .GroupBy(x => x.Id.Trim(), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

                foreach (var account in accounts)
                {
                    if (userMap.TryGetValue(account.UserId.ToString(), out var userInfo))
                    {
                        account.Fullname = string.IsNullOrWhiteSpace(userInfo.Fullname) ? null : userInfo.Fullname;
                        account.Username = string.IsNullOrWhiteSpace(userInfo.Username) ? null : userInfo.Username;
                        account.IsActived = userInfo.IsActived;
                    }
                }
            }
            catch
            {
                // Keep base account data if user enrichment fails.
            }

            return accounts;
        }

        public async Task<ModelExtAccount> AddAccountAsync(Guid externalReviewId, Guid userId)
        {
            if (userId == Guid.Empty)
            {
                throw new BusinessException("UserId không hợp lệ.");
            }

            var review = await GetReviewOrThrowAsync(externalReviewId);

            var exists = await _context.ExternalReviewAccounts
                .AnyAsync(x => x.ExternalReviewId == externalReviewId && x.UserId == userId);

            if (exists)
            {
                throw new BusinessException("Tài khoản đã được liên kết vào đánh giá này.");
            }

            var account = new Entities.ExternalReviewAccount
            {
                Id = Guid.NewGuid(),
                ExternalReviewId = externalReviewId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = GetCurrentUsernameOrThrow()
            };

            _context.ExternalReviewAccounts.Add(account);
            await _context.SaveChangesAsync();

            var shouldActivate = review.Status == (int)ExternalReviewStatus.InProgress
                && !review.IsCompleted;

            await SyncUsersActivationAsync(new[] { userId }, shouldActivate);

            return new ModelExtAccount
            {
                Id = account.Id,
                ExternalReviewId = account.ExternalReviewId,
                UserId = account.UserId,
                CreatedAt = account.CreatedAt,
                CreatedBy = account.CreatedBy,
                IsActived = shouldActivate
            };
        }

        public async Task<ModelExtAccount> CreateAndLinkAccountAsync(
            Guid externalReviewId,
            ExternalReviewCreateAccountRequest request)
        {
            var review = await GetReviewOrThrowAsync(externalReviewId);

            var grpcRequest = new CreateExternalUserRequest
            {
                Fullname = request.Fullname.Trim(),
                Username = request.Username.Trim(),
                Email = request.Email.Trim(),
                Password = request.Password,
                RoleId = ExtRoleId
            };

            var grpcResponse = await _systemClient.CreateExternalUserAsync(grpcRequest);

            if (!grpcResponse.Success)
            {
                throw new BusinessException(grpcResponse.Message ?? "Không thể tạo tài khoản chuyên gia.");
            }

            var userId = Guid.Parse(grpcResponse.Id);

            var exists = await _context.ExternalReviewAccounts
                .AnyAsync(x => x.ExternalReviewId == externalReviewId && x.UserId == userId);

            if (exists)
            {
                throw new BusinessException("Tài khoản đã được liên kết vào đánh giá này.");
            }

            var account = new Entities.ExternalReviewAccount
            {
                Id = Guid.NewGuid(),
                ExternalReviewId = externalReviewId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = GetCurrentUsernameOrThrow()
            };

            _context.ExternalReviewAccounts.Add(account);
            await _context.SaveChangesAsync();

            var shouldActivate = review.Status == (int)ExternalReviewStatus.InProgress
                && !review.IsCompleted;

            await SyncUsersActivationAsync(new[] { userId }, shouldActivate);

            return new ModelExtAccount
            {
                Id = account.Id,
                ExternalReviewId = account.ExternalReviewId,
                UserId = account.UserId,
                Fullname = request.Fullname.Trim(),
                Username = request.Username.Trim(),
                CreatedAt = account.CreatedAt,
                CreatedBy = account.CreatedBy,
                IsActived = shouldActivate
            };
        }

        public async Task RemoveAccountAsync(Guid accountId)
        {
            var account = await _context.ExternalReviewAccounts
                .FirstOrDefaultAsync(x => x.Id == accountId);

            if (account == null)
            {
                throw new BusinessException("Không tìm thấy liên kết tài khoản.");
            }

            _context.ExternalReviewAccounts.Remove(account);
            await _context.SaveChangesAsync();

            await SyncUsersActivationAsync(new[] { account.UserId }, false);
        }

        private async Task<Entities.ExternalReview> GetReviewOrThrowAsync(Guid id)
        {
            var review = await _context.ExternalReviews
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted && x.IsActived);

            if (review == null)
            {
                throw new BusinessException("Không tìm thấy đánh giá ngoài.");
            }

            return review;
        }

        private async Task SyncAccountActivationAsync(Guid externalReviewId, bool isActived)
        {
            var userIds = await _context.ExternalReviewAccounts
                .AsNoTracking()
                .Where(x => x.ExternalReviewId == externalReviewId)
                .Select(x => x.UserId)
                .Distinct()
                .ToListAsync();

            if (userIds.Count == 0)
            {
                return;
            }

            await SyncUsersActivationAsync(userIds, isActived);
        }

        private async Task SyncUsersActivationAsync(IEnumerable<Guid> userIds, bool isActived)
        {
            var request = new SetUsersActivedRequest
            {
                IsActived = isActived
            };
            request.UserIds.AddRange(userIds.Select(x => x.ToString()));
            await _systemClient.SetUsersActivedAsync(request);
        }

        private string GetCurrentUsernameOrThrow()
        {
            var username = _accessor.HttpContext?.User?.Identity?.Name;
            if (string.IsNullOrWhiteSpace(username))
            {
                throw new BusinessException("Không xác định được người dùng hiện tại.");
            }

            return username.Trim();
        }

        private static ExternalReviewStatus ParseStatusOrThrow(int status)
        {
            if (!Enum.IsDefined(typeof(ExternalReviewStatus), status))
            {
                throw new BusinessException("Trạng thái ExternalReview không hợp lệ.");
            }

            return (ExternalReviewStatus)status;
        }

        private static void ParseFindingTypeOrThrow(int findingType)
        {
            if (!Enum.IsDefined(typeof(FindingType), findingType))
            {
                throw new BusinessException("FindingType không hợp lệ.");
            }
        }

        private static void ParseWatermarkPositionOrThrow(int watermarkPosition)
        {
            if (!Enum.IsDefined(typeof(WatermarkPosition), watermarkPosition))
            {
                throw new BusinessException("WatermarkPosition không hợp lệ.");
            }
        }

        private static ModelExternalReview MapReview(Entities.ExternalReview review)
        {
            return new ModelExternalReview
            {
                Id = review.Id,
                CycleId = review.CycleId,
                Status = review.Status,
                WatermarkText = review.WatermarkText,
                WatermarkOpacity = review.WatermarkOpacity,
                WatermarkPosition = review.WatermarkPosition,
                IsCompleted = review.IsCompleted,
                CompletedAt = review.CompletedAt,
                CompletedBy = review.CompletedBy,
                CreatedAt = review.CreatedAt,
                CreatedBy = review.CreatedBy,
                UpdatedAt = review.UpdatedAt,
                UpdatedBy = review.UpdatedBy
            };
        }

        private static ModelExternalReviewResult MapResult(
            Entities.ExternalReviewResult result,
            IEnumerable<Entities.ExternalReviewFinding> findings)
        {
            return new ModelExternalReviewResult
            {
                Id = result.Id,
                ExternalReviewId = result.ExternalReviewId,
                StandardId = result.StandardId,
                Strengths = result.Strengths,
                CreatedAt = result.CreatedAt,
                CreatedBy = result.CreatedBy,
                UpdatedAt = result.UpdatedAt,
                UpdatedBy = result.UpdatedBy,
                Findings = findings.Select(MapFinding).ToList()
            };
        }

        private static ModelExternalReviewFinding MapFinding(Entities.ExternalReviewFinding finding)
        {
            return new ModelExternalReviewFinding
            {
                Id = finding.Id,
                ExternalReviewResultId = finding.ExternalReviewResultId,
                FindingType = finding.FindingType,
                Content = finding.Content,
                CriterionId = finding.CriterionId,
                CreatedAt = finding.CreatedAt,
                CreatedBy = finding.CreatedBy,
                UpdatedAt = finding.UpdatedAt,
                UpdatedBy = finding.UpdatedBy
            };
        }
    }
}
