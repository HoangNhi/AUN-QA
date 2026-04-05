using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AUN_QA.CatalogService.Protos;
using AUN_QA.SystemService.Protos;
using AUN_QA.Shared.Exceptions;
using AutoDependencyRegistration.Attributes;
using Microsoft.EntityFrameworkCore;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;

namespace AUN_QA.BusinessService.Services.CoreFeature.CriterionEvaluation
{
    [RegisterClassAsTransient]
    public class CriterionEvaluationService : ICriterionEvaluationService
    {
        private readonly BusinessContext _context;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ICatalogIntegrationService _catalogService;
        private readonly ICycleService _cycleService;
        private readonly SystemProto.SystemProtoClient _systemClient;

        public CriterionEvaluationService(
            BusinessContext context,
            IHttpContextAccessor contextAccessor,
            ICatalogIntegrationService catalogService,
            ICycleService cycleService,
            SystemProto.SystemProtoClient systemClient)
        {
            _context = context;
            _contextAccessor = contextAccessor;
            _catalogService = catalogService;
            _cycleService = cycleService;
            _systemClient = systemClient;
        }

        #region Summary
        public async Task<ModelCriterionEvaluationSummary> GetSummary(GetCriterionEvaluationSummaryRequest request)
        {
            var evaluations = await _context.CriterionEvaluations
                .AsNoTracking()
                .Where(x => x.CycleId == request.CycleId && !x.IsDeleted && x.IsActived)
                .ToListAsync();

            if (!evaluations.Any())
                return new ModelCriterionEvaluationSummary();

            var metaLookup = await FetchCriterionMetaAsync(request.StandardSetId);
            var evaluationMode = await _catalogService.GetStandardSetEvaluationModeAsync(request.StandardSetId.ToString());
            var isAunMode = evaluationMode == CriterionEvaluationPolicy.EvaluationModeAun;

            var approved = evaluations.Where(x => x.Status == (int)CriterionEvaluationStatus.Approved).ToList();
            var prerequisiteIds = metaLookup.Where(kv => kv.Value.IsPrerequisite).Select(kv => kv.Key).ToHashSet();

            var prerequisiteEvals = evaluations.Where(x => prerequisiteIds.Contains(x.CriterionId)).ToList();
            var prerequisitePassed = prerequisiteEvals.Count(x =>
                x.Status == (int)CriterionEvaluationStatus.Approved &&
                (x.OfficialResult == true || (x.OfficialScore.HasValue && x.OfficialScore >= 4)));

            var failedCriteria = isAunMode ? 0 : approved.Count(x => x.OfficialResult == false);
            var failedStandards = isAunMode
                ? 0
                : approved
                    .Where(x => x.OfficialResult == false)
                    .GroupBy(x => x.StandardId)
                    .Count(g => g.Count() > 2);

            var aunProgramVerdict = isAunMode
                ? CriterionEvaluationPolicy.CalculateRoundedAunScore(approved.Select(x => x.OfficialScore))
                : null;
            var moetProgramVerdict = isAunMode
                ? null
                : CalculateMoetProgramVerdict(failedStandards, failedCriteria, approved.Any());

            var previousCycle = await FindPreviousCycleAsync(request.CycleId, request.StandardSetId);

            Guid? previousCycleId = null;
            string? previousCycleName = null;
            int? previousApprovedCriteria = null;
            int? previousFailedCriteria = null;
            int? previousFailedStandards = null;
            string? previousMoetProgramVerdict = null;
            int? improvedCriteria = null;
            int? regressedCriteria = null;

            if (previousCycle != null)
            {
                previousCycleId = previousCycle.Id;
                previousCycleName = previousCycle.Name;

                var prevEvaluations = await _context.CriterionEvaluations
                    .AsNoTracking()
                    .Where(x => x.CycleId == previousCycle.Id && !x.IsDeleted && x.IsActived)
                    .ToListAsync();

                var prevApproved = prevEvaluations.Where(x => x.Status == (int)CriterionEvaluationStatus.Approved).ToList();
                previousApprovedCriteria = prevApproved.Count;

                if (!isAunMode)
                {
                    previousFailedCriteria = prevApproved.Count(x => x.OfficialResult == false);
                    previousFailedStandards = prevApproved
                        .Where(x => x.OfficialResult == false)
                        .GroupBy(x => x.StandardId)
                        .Count(g => g.Count() > 2);
                    previousMoetProgramVerdict = CalculateMoetProgramVerdict(
                        previousFailedStandards.Value,
                        previousFailedCriteria.Value,
                        prevApproved.Any());
                }

                var prevLookup = prevApproved.ToDictionary(x => x.CriterionId);
                int improved = 0, regressed = 0;
                foreach (var curr in approved)
                {
                    if (!prevLookup.TryGetValue(curr.CriterionId, out var prev)) continue;

                    if (curr.OfficialScore.HasValue && prev.OfficialScore.HasValue)
                    {
                        if (curr.OfficialScore > prev.OfficialScore) improved++;
                        else if (curr.OfficialScore < prev.OfficialScore) regressed++;
                    }
                    else if (curr.OfficialResult.HasValue && prev.OfficialResult.HasValue)
                    {
                        if (curr.OfficialResult == true && prev.OfficialResult == false) improved++;
                        else if (curr.OfficialResult == false && prev.OfficialResult == true) regressed++;
                    }
                }
                improvedCriteria = improved;
                regressedCriteria = regressed;
            }

            return new ModelCriterionEvaluationSummary
            {
                TotalCriteria = evaluations.Count,
                ApprovedCriteria = approved.Count,
                PrerequisiteTotal = prerequisiteEvals.Count,
                PrerequisitePassed = prerequisitePassed,
                FailedStandards = failedStandards,
                FailedCriteria = failedCriteria,
                AunProgramVerdict = aunProgramVerdict,
                MoetProgramVerdict = moetProgramVerdict,
                PreviousCycleId = previousCycleId,
                PreviousCycleName = previousCycleName,
                PreviousApprovedCriteria = previousApprovedCriteria,
                PreviousFailedCriteria = previousFailedCriteria,
                PreviousFailedStandards = previousFailedStandards,
                PreviousMoetProgramVerdict = previousMoetProgramVerdict,
                ImprovedCriteria = improvedCriteria,
                RegressedCriteria = regressedCriteria,
            };
        }
        #endregion

        private async Task<Entities.Cycle?> FindPreviousCycleAsync(Guid currentCycleId, Guid standardSetId)
        {
            var currentCycle = await _context.Cycles
                .AsNoTracking()
                .Where(x => x.Id == currentCycleId && !x.IsDeleted && x.IsActived)
                .FirstOrDefaultAsync();

            if (currentCycle == null) return null;

            // Find most recent cycle with same StandardSetId, earlier StartDate
            var candidates = await _context.Cycles
                .AsNoTracking()
                .Where(x => x.StandardSetId == standardSetId
                    && x.Id != currentCycleId
                    && x.StartDate < currentCycle.StartDate
                    && !x.IsDeleted && x.IsActived)
                .OrderByDescending(x => x.StartDate)
                .ToListAsync();

            // Pick the first one that has at least 1 approved evaluation
            foreach (var candidate in candidates)
            {
                var hasApproved = await _context.CriterionEvaluations
                    .AsNoTracking()
                    .AnyAsync(x => x.CycleId == candidate.Id
                        && x.Status == (int)CriterionEvaluationStatus.Approved
                        && !x.IsDeleted && x.IsActived);
                if (hasApproved) return candidate;
            }
            return null;
        }

        #region List
        public async Task<List<ModelStandardEvaluationGroup>> GetList(CriterionEvaluationGetListRequest request)
        {
            var query = _context.CriterionEvaluations
                .AsNoTracking()
                .Where(x => x.CycleId == request.CycleId && !x.IsDeleted && x.IsActived);

            if (request.Status.HasValue)
                query = query.Where(x => x.Status == request.Status.Value);

            var evaluations = await query.ToListAsync();

            if (!evaluations.Any())
                return new List<ModelStandardEvaluationGroup>();

            var metaLookup = await FetchCriterionMetaAsync(request.StandardSetId);
            var evaluationMode = await _catalogService.GetStandardSetEvaluationModeAsync(request.StandardSetId.ToString());
            var isAunMode = evaluationMode == CriterionEvaluationPolicy.EvaluationModeAun;

            var requirementRows = new List<CriterionRequirementRow>();
            await foreach (var row in _catalogService.GetRequirementsByStandardSetStreamAsync(
                new GetRequirementsByStandardSetStreamRequest { StandardSetId = request.StandardSetId.ToString() }))
            {
                requirementRows.Add(row);
            }

            var requirementsByCriterion = requirementRows
                .GroupBy(r => Guid.Parse(r.CriterionId))
                .ToDictionary(g => g.Key, g => g.ToList());

            var allFileTypeIds = requirementRows
                .Select(r => Guid.Parse(r.FileTypeId))
                .Distinct().ToList();

            var evidenceCountByFileType = await (
                from ecm in _context.EvidenceCycleMaps
                join ev in _context.Evidences on ecm.EvidenceId equals ev.Id
                where ecm.CycleId == request.CycleId
                   && !ecm.IsDeleted && ecm.IsActived
                   && ev.Status == (int)EvidenceStatus.Verified
                   && allFileTypeIds.Contains(ev.FileTypeId)
                   && !ev.IsDeleted && ev.IsActived
                group ev by ev.FileTypeId into g
                select new { FileTypeId = g.Key, Count = g.Count() }
            ).ToDictionaryAsync(x => x.FileTypeId, x => x.Count);

            if (!string.IsNullOrWhiteSpace(request.TextSearch))
            {
                var search = request.TextSearch.ToLower();
                evaluations = evaluations.Where(x =>
                    metaLookup.TryGetValue(x.CriterionId, out var meta) &&
                    (meta.CriterionCode.ToLower().Contains(search) || meta.CriterionName.ToLower().Contains(search))
                ).ToList();
            }

            var evalIds = evaluations.Select(x => x.Id).ToList();
            var submissionCounts = await _context.EvaluationSubmissions
                .AsNoTracking()
                .Where(x => evalIds.Contains(x.CriterionEvaluationId) && !x.IsDeleted && x.IsActived)
                .GroupBy(x => x.CriterionEvaluationId)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Count);

            var evaluatorCouncils = await _context.Councils
                .AsNoTracking()
                .Where(c => c.CycleId == request.CycleId && c.RoleId == (int)CouncilRole.Evaluator && !c.IsDeleted && c.IsActived)
                .ToListAsync();

            var evaluatorCountByStandard = new Dictionary<Guid, int>();
            foreach (var standardId in evaluations.Select(e => e.StandardId).Distinct())
            {
                evaluatorCountByStandard[standardId] = evaluatorCouncils
                    .Count(c => CriterionEvaluationPolicy.AssignedStandardsContains(c.AssignedStandards, standardId));
            }

            var standardOrder = metaLookup.Values
                .GroupBy(m => m.StandardId)
                .ToDictionary(g => g.Key, g => g.First().StandardOrder);

            var groups = evaluations
                .GroupBy(x => x.StandardId)
                .OrderBy(g => standardOrder.TryGetValue(g.Key, out var o) ? o : 0)
                .Select(g =>
                {
                    var items = g
                        .OrderBy(x => metaLookup.TryGetValue(x.CriterionId, out var m) ? m.CriterionOrder : 0)
                        .Select(x =>
                        {
                            metaLookup.TryGetValue(x.CriterionId, out var meta);
                            submissionCounts.TryGetValue(x.Id, out var subCount);

                            var evidenceCount = 0;
                            var missingCount = 0;
                            if (requirementsByCriterion.TryGetValue(x.CriterionId, out var reqs))
                            {
                                evidenceCount = reqs
                                    .Sum(r => evidenceCountByFileType.TryGetValue(Guid.Parse(r.FileTypeId), out var c) ? c : 0);
                                missingCount = reqs
                                    .Where(r => r.IsMandatory)
                                    .Sum(r =>
                                    {
                                        evidenceCountByFileType.TryGetValue(Guid.Parse(r.FileTypeId), out var c);
                                        return Math.Max(0, r.MinQuantity - c);
                                    });
                            }

                            return new ModelCriterionEvaluationItem
                            {
                                Id = x.Id,
                                CriterionId = x.CriterionId,
                                CriterionCode = meta?.CriterionCode ?? "",
                                CriterionName = meta?.CriterionName ?? "",
                                IsPrerequisite = meta?.IsPrerequisite ?? false,
                                Status = x.Status,
                                OfficialScore = x.OfficialScore,
                                OfficialResult = x.OfficialResult,
                                EvidenceCount = evidenceCount,
                                MissingEvidenceCount = missingCount,
                                SubmissionCount = subCount,
                                TotalEvaluators = evaluatorCountByStandard.TryGetValue(g.Key, out var tc) ? tc : 0
                            };
                        }).ToList();

                    var approvedItems = items.Where(i => i.Status == (int)CriterionEvaluationStatus.Approved).ToList();
                    var isPassed = !isAunMode && CalculateMoetStandardPassed(approvedItems);
                    var standardScore = isAunMode
                        ? CriterionEvaluationPolicy.CalculateRoundedAunScore(approvedItems.Select(i => i.OfficialScore))
                        : null;

                    StandardWithCriteriaDto? standardMeta = null;
                    foreach (var item in g)
                    {
                        if (metaLookup.TryGetValue(item.CriterionId, out var m))
                        {
                            standardMeta = m;
                            break;
                        }
                    }

                    return new ModelStandardEvaluationGroup
                    {
                        StandardId = g.Key,
                        StandardCode = standardMeta?.StandardCode ?? "",
                        StandardName = standardMeta?.StandardName ?? "",
                        IsPassed = isPassed,
                        StandardScore = standardScore,
                        ApprovedCount = approvedItems.Count,
                        TotalCount = items.Count,
                        Items = items
                    };
                }).ToList();

            return groups;
        }
        #endregion

        #region Submissions
        public async Task<List<ModelEvaluationSubmission>> GetSubmissions(Guid criterionEvaluationId)
        {
            var submissions = await _context.EvaluationSubmissions
                .AsNoTracking()
                .Where(x => x.CriterionEvaluationId == criterionEvaluationId && !x.IsDeleted && x.IsActived)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var userIds = submissions.Select(x => x.EvaluatorId.ToString()).Distinct().ToList();
            var grpcRequest = new GetUsersByIdsRequest();
            grpcRequest.UserIds.AddRange(userIds);
            var grpcResponse = await _systemClient.GetUsersByIdsAsync(grpcRequest);
            var userMap = grpcResponse.Users.ToDictionary(u => Guid.Parse(u.Id));

            return submissions.Select(x =>
            {
                userMap.TryGetValue(x.EvaluatorId, out var userInfo);
                return new ModelEvaluationSubmission
                {
                    Id = x.Id,
                    EvaluatorId = x.EvaluatorId,
                    EvaluatorName = userInfo?.Fullname ?? x.CreatedBy,
                    EvaluatorAvatar = string.IsNullOrEmpty(userInfo?.Avatar) ? null : userInfo.Avatar,
                    CurrentState = x.CurrentState,
                    Strengths = x.Strengths,
                    Weaknesses = x.Weaknesses,
                    ActionPlan = x.ActionPlan,
                    ProposedScore = x.ProposedScore,
                    ProposedResult = x.ProposedResult,
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt
                };
            }).ToList();
        }

        public async Task<EvaluationSubmissionRequest?> GetMySubmission(Guid criterionEvaluationId)
        {
            var userId = GetCurrentUserId();

            var submission = await _context.EvaluationSubmissions
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.CriterionEvaluationId == criterionEvaluationId &&
                    x.EvaluatorId == userId &&
                    !x.IsDeleted && x.IsActived);

            if (submission == null) return null;

            return new EvaluationSubmissionRequest
            {
                Id = submission.Id,
                CriterionEvaluationId = submission.CriterionEvaluationId,
                CurrentState = submission.CurrentState,
                Strengths = submission.Strengths,
                Weaknesses = submission.Weaknesses,
                ActionPlan = submission.ActionPlan,
                ProposedScore = submission.ProposedScore,
                ProposedResult = submission.ProposedResult
            };
        }
        #endregion

        #region Submit
        public async Task Submit(EvaluationSubmissionRequest request)
        {
            var evaluation = await _context.CriterionEvaluations
                .FirstOrDefaultAsync(x => x.Id == request.CriterionEvaluationId && !x.IsDeleted && x.IsActived);

            if (evaluation == null)
                throw new BusinessException("Không tìm thấy tiêu chí đánh giá");

            if (evaluation.Status == (int)CriterionEvaluationStatus.Approved)
                throw new BusinessException("Tiêu chí đã được duyệt, không thể chỉnh sửa phiếu đánh giá");

            var currentState = request.CurrentState!.Trim();
            var strengths = request.Strengths!.Trim();
            var weaknesses = request.Weaknesses!.Trim();
            var actionPlan = request.ActionPlan!.Trim();

            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();
            var councils = await _context.Councils
                .AsNoTracking()
                .Where(x => x.CycleId == evaluation.CycleId && x.UserId == userId && !x.IsDeleted && x.IsActived)
                .ToListAsync();

            if (!CriterionEvaluationPolicy.CanTvhSubmit(evaluation.CycleId, userId, evaluation.StandardId, councils))
                throw new BusinessException("Bạn không có quyền gửi phiếu đánh giá cho tiêu chuẩn này", 403);

            var existing = await _context.EvaluationSubmissions
                .FirstOrDefaultAsync(x =>
                    x.CriterionEvaluationId == request.CriterionEvaluationId &&
                    x.EvaluatorId == userId &&
                    !x.IsDeleted && x.IsActived);

            if (existing != null)
            {
                existing.CurrentState = currentState;
                existing.Strengths = strengths;
                existing.Weaknesses = weaknesses;
                existing.ActionPlan = actionPlan;
                existing.ProposedScore = request.ProposedScore;
                existing.ProposedResult = request.ProposedResult;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = userName;
                _context.EvaluationSubmissions.Update(existing);
            }
            else
            {
                var newSubmission = new Entities.EvaluationSubmission
                {
                    Id = Guid.NewGuid(),
                    CriterionEvaluationId = request.CriterionEvaluationId,
                    EvaluatorId = userId,
                    CurrentState = currentState,
                    Strengths = strengths,
                    Weaknesses = weaknesses,
                    ActionPlan = actionPlan,
                    ProposedScore = request.ProposedScore,
                    ProposedResult = request.ProposedResult,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userName,
                    IsActived = true,
                    IsDeleted = false
                };
                await _context.EvaluationSubmissions.AddAsync(newSubmission);
            }

            if (evaluation.Status == (int)CriterionEvaluationStatus.Empty)
            {
                evaluation.Status = (int)CriterionEvaluationStatus.Waiting;
                evaluation.UpdatedAt = DateTime.UtcNow;
                evaluation.UpdatedBy = userName;
                _context.CriterionEvaluations.Update(evaluation);
            }

            await _context.SaveChangesAsync();
        }
        #endregion

        #region Approve
        public async Task Approve(ApproveEvaluationRequest request)
        {
            var evaluation = await _context.CriterionEvaluations
                .FirstOrDefaultAsync(x => x.Id == request.CriterionEvaluationId && !x.IsDeleted && x.IsActived);

            if (evaluation == null)
                throw new BusinessException("Không tìm thấy tiêu chí đánh giá");

            await CheckApprovePermissionAsync(evaluation.CycleId.ToString());

            if (request.OfficialScore == null && request.OfficialResult == null)
                throw new BusinessException("Phải có điểm chốt (AUN) hoặc kết quả chốt (MOET)");

            if (request.OfficialScore.HasValue && (request.OfficialScore < 1 || request.OfficialScore > 7))
                throw new BusinessException("Điểm AUN phải từ 1 đến 7");

            if (string.IsNullOrWhiteSpace(request.OfficialCurrentState))
                throw new BusinessException("Vui lòng nhập mô tả thực trạng chốt");

            if (string.IsNullOrWhiteSpace(request.OfficialStrengths))
                throw new BusinessException("Vui lòng nhập điểm mạnh chốt");

            if (string.IsNullOrWhiteSpace(request.OfficialWeaknesses))
                throw new BusinessException("Vui lòng nhập điểm tồn tại chốt");

            if (string.IsNullOrWhiteSpace(request.OfficialActionPlan))
                throw new BusinessException("Vui lòng nhập kế hoạch cải tiến chốt");

            var userName = GetCurrentUserName();

            evaluation.OfficialScore = request.OfficialScore;
            evaluation.OfficialResult = request.OfficialResult;
            evaluation.OfficialCurrentState = request.OfficialCurrentState?.Trim();
            evaluation.OfficialStrengths = request.OfficialStrengths?.Trim();
            evaluation.OfficialWeaknesses = request.OfficialWeaknesses?.Trim();
            evaluation.OfficialActionPlan = request.OfficialActionPlan?.Trim();
            evaluation.Status = (int)CriterionEvaluationStatus.Approved;
            evaluation.ApprovedBy = userName;
            evaluation.ApprovedAt = DateTime.UtcNow;
            evaluation.UpdatedAt = DateTime.UtcNow;
            evaluation.UpdatedBy = userName;

            _context.CriterionEvaluations.Update(evaluation);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region GetEvidencesForCriterion
        public async Task<List<ModelCriterionEvidence>> GetEvidencesForCriterion(Guid criterionEvaluationId, Guid cycleId)
        {
            var evaluation = await _context.CriterionEvaluations
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == criterionEvaluationId && !x.IsDeleted && x.IsActived);

            if (evaluation == null)
                throw new BusinessException("Không tìm thấy tiêu chí đánh giá");

            var grpcRequest = new AUN_QA.CatalogService.Protos.GetFileTypesByCriterionStreamRequest
            {
                CriterionId = evaluation.CriterionId.ToString()
            };

            var fileTypeIds = new List<Guid>();
            await foreach (var ft in _catalogService.GetFileTypesByCriterionStreamAsync(grpcRequest))
            {
                if (Guid.TryParse(ft.Id, out var ftId))
                    fileTypeIds.Add(ftId);
            }

            if (!fileTypeIds.Any())
                return new List<ModelCriterionEvidence>();

            var result = await (
                from ecm in _context.EvidenceCycleMaps
                join ev in _context.Evidences on ecm.EvidenceId equals ev.Id
                where ecm.CycleId == cycleId
                   && !ecm.IsDeleted && ecm.IsActived
                   && ev.Status == (int)EvidenceStatus.Verified
                   && fileTypeIds.Contains(ev.FileTypeId)
                   && !ev.IsDeleted && ev.IsActived
                select new ModelCriterionEvidence
                {
                    Id = ev.Id,
                    Code = ev.Code,
                    Name = ev.Name,
                    EvidenceCycleMapId = ecm.Id
                }
            ).ToListAsync();

            return result;
        }
        #endregion

        #region Popup Data
        public async Task<ModelCriterionPopupData> GetPopupData(GetPopupDataRequest request)
        {
            var evaluation = await _context.CriterionEvaluations
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.CriterionEvaluationId && !x.IsDeleted && x.IsActived);

            if (evaluation == null)
                throw new BusinessException("Không tìm thấy tiêu chí đánh giá");

            if (evaluation.CycleId != request.CycleId)
                throw new BusinessException("Dữ liệu tiêu chí không thuộc chu kỳ được yêu cầu");

            var submissions = await GetSubmissions(request.CriterionEvaluationId);
            var mySubmission = await GetMySubmission(request.CriterionEvaluationId);
            var evidences = await GetEvidencesForCriterion(request.CriterionEvaluationId, request.CycleId);

            // Get cycle with StandardSetId
            var cycle = await _context.Cycles
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == request.CycleId && !x.IsDeleted && x.IsActived);

            if (cycle == null)
                throw new BusinessException("Không tìm thấy chu kỳ đánh giá");

            // Get EvaluationMode from CatalogService via gRPC
            var evaluationMode = await _catalogService.GetStandardSetEvaluationModeAsync(cycle.StandardSetId.ToString());

            // Get survey campaigns for the cycle
            var surveyCampaigns = await _context.SurveyCampaigns
                .AsNoTracking()
                .Where(x => x.CycleId == request.CycleId && !x.IsDeleted && x.IsActived)
                .Select(x => new ModelSurveyCampaign
                {
                    Id = x.Id,
                    Name = x.Name,
                    Status = x.Status,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            OfficialDescriptiveFields? officialFields = null;
            if (evaluation.Status == (int)CriterionEvaluationStatus.Approved)
            {
                officialFields = new OfficialDescriptiveFields
                {
                    CurrentState = evaluation.OfficialCurrentState,
                    Strengths = evaluation.OfficialStrengths,
                    Weaknesses = evaluation.OfficialWeaknesses,
                    ActionPlan = evaluation.OfficialActionPlan
                };
            }

            return new ModelCriterionPopupData
            {
                Submissions = submissions,
                MySubmission = mySubmission,
                Evidences = evidences.Select(e => new CriterionEvidence
                {
                    Id = e.Id,
                    Code = e.Code,
                    Name = e.Name,
                    EvidenceCycleMapId = e.EvidenceCycleMapId
                }).ToList(),
                SurveyCampaigns = surveyCampaigns,
                EvaluationMode = evaluationMode,
                OfficialFields = officialFields
            };
        }
        #endregion

        #region Initialize
        public async Task InitializeForCycle(InitializeCycleEvaluationRequest request)
        {
            var grpcRequest = new GetStandardsWithCriteriaStreamRequest
            {
                StandardSetId = request.StandardSetId.ToString()
            };

            var criteriaRows = new List<StandardWithCriteriaDto>();
            await foreach (var row in _catalogService.GetStandardsWithCriteriaStreamAsync(grpcRequest))
                criteriaRows.Add(row);

            if (!criteriaRows.Any())
                throw new BusinessException("Bộ tiêu chuẩn không có tiêu chí nào");

            var existingCriterionIds = (await _context.CriterionEvaluations
                .AsNoTracking()
                .Where(x => x.CycleId == request.CycleId && !x.IsDeleted)
                .Select(x => x.CriterionId)
                .ToListAsync())
                .ToHashSet();

            var userName = GetCurrentUserName();
            var now = DateTime.UtcNow;

            var uniqueCriteria = criteriaRows
                .GroupBy(x => x.CriterionId)
                .Select(g => g.First())
                .Where(x => !existingCriterionIds.Contains(x.CriterionId))
                .ToList();

            if (!uniqueCriteria.Any())
                return;

            var newEvaluations = uniqueCriteria.Select(c => new Entities.CriterionEvaluation
            {
                Id = Guid.NewGuid(),
                CycleId = request.CycleId,
                CriterionId = c.CriterionId,
                StandardId = c.StandardId,
                Status = (int)CriterionEvaluationStatus.Empty,
                CreatedAt = now,
                CreatedBy = userName,
                IsActived = true,
                IsDeleted = false
            }).ToList();

            await _context.CriterionEvaluations.AddRangeAsync(newEvaluations);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region Helpers
        private static List<int> Roles(params CouncilRole[] roles)
            => roles.Select(r => (int)r).ToList();

        private Guid GetCurrentUserId()
        {
            var idStr = _contextAccessor.HttpContext!.User.Claims
                .FirstOrDefault(x => x.Type == "name")?.Value;
            if (!Guid.TryParse(idStr, out var userId))
                throw new BusinessException("Không xác định được người dùng hiện tại");
            return userId;
        }

        private string GetCurrentUserName()
            => _contextAccessor.HttpContext!.User.Identity?.Name
               ?? _contextAccessor.HttpContext!.User.Claims
                   .FirstOrDefault(x => x.Type == "name")?.Value
               ?? "unknown";

        private async Task CheckApprovePermissionAsync(string cycleId)
        {
            var userId = _contextAccessor.HttpContext!.User.Claims
                .FirstOrDefault(x => x.Type == "name")?.Value ?? "";

            var allowed = await _cycleService.CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = Guid.Parse(cycleId),
                UserId = Guid.Parse(userId),
                AllowedRoles = Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman)
            });

            if (!allowed)
                throw new BusinessException("Bạn không có quyền duyệt kết quả đánh giá");
        }

        private async Task<Dictionary<Guid, StandardWithCriteriaDto>> FetchCriterionMetaAsync(Guid standardSetId)
        {
            var grpcRequest = new GetStandardsWithCriteriaStreamRequest
            {
                StandardSetId = standardSetId.ToString()
            };

            var result = new Dictionary<Guid, StandardWithCriteriaDto>();
            await foreach (var row in _catalogService.GetStandardsWithCriteriaStreamAsync(grpcRequest))
            {
                result.TryAdd(row.CriterionId, row);
            }
            return result;
        }

        private static string? CalculateMoetProgramVerdict(int failedStandards, int failedCriteria, bool hasApproved)
        {
            if (!hasApproved)
                return null;

            if (failedStandards == 0)
                return "Đạt";

            return failedStandards <= 2 && failedCriteria <= 16
                ? "Đạt có điều kiện"
                : "Không đạt";
        }

        private static bool CalculateMoetStandardPassed(IEnumerable<ModelCriterionEvaluationItem> approvedItems)
        {
            var approvedItemList = approvedItems.ToList();
            var failedCount = approvedItemList.Count(i => i.OfficialResult == false);
            var prerequisiteFailed = approvedItemList.Any(i => i.IsPrerequisite && i.OfficialResult == false);
            return !prerequisiteFailed && failedCount <= 2;
        }
        #endregion
    }
}


