using System.Net;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;

namespace AUN_QA.BusinessService.Tests;

public class SarServiceTests
{
    [Fact]
    public void BuildAutofillPayloadHtml_WithMixedApprovedAndUnapproved_IncludesOnlyApproved()
    {
        var approvedEval = new CriterionEvaluation
        {
            Id = Guid.NewGuid(),
            CriterionId = Guid.NewGuid(),
            StandardId = Guid.NewGuid(),
            ApprovedBy = "user1",
            OfficialScore = 4,
            OfficialCurrentState = "Approved description",
            CreatedAt = new DateTime(2026, 4, 11, 8, 0, 0, DateTimeKind.Utc),
            CreatedBy = "creator",
            IsActived = true,
            IsDeleted = false
        };

        var unapprovedEval = new CriterionEvaluation
        {
            Id = Guid.NewGuid(),
            CriterionId = Guid.NewGuid(),
            StandardId = Guid.NewGuid(),
            ApprovedBy = null,
            CreatedAt = new DateTime(2026, 4, 11, 9, 0, 0, DateTimeKind.Utc),
            CreatedBy = "creator",
            IsActived = true,
            IsDeleted = false
        };

        var evaluations = new List<CriterionEvaluation> { approvedEval, unapprovedEval };
        var submissions = new List<EvaluationSubmission>
        {
            new()
            {
                Id = Guid.NewGuid(),
                CriterionEvaluationId = approvedEval.Id,
                EvaluatorId = Guid.NewGuid(),
                CurrentState = "Reviewer approved note",
                CreatedAt = new DateTime(2026, 4, 11, 8, 30, 0, DateTimeKind.Utc),
                CreatedBy = "reviewer",
                IsActived = true,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                CriterionEvaluationId = unapprovedEval.Id,
                EvaluatorId = Guid.NewGuid(),
                CurrentState = "Reviewer should not appear",
                CreatedAt = new DateTime(2026, 4, 11, 9, 30, 0, DateTimeKind.Utc),
                CreatedBy = "reviewer",
                IsActived = true,
                IsDeleted = false
            }
        };

        var criterionMeta = CreateCriterionMeta(
            (approvedEval.CriterionId, "1.1", "Test Criterion", 1, 1),
            (unapprovedEval.CriterionId, "1.2", "Unapproved Criterion", 1, 2));
        var evaluatorNames = new Dictionary<Guid, string>();
        var approverNames = new Dictionary<string, string> { { "user1", "Trần Văn A" } };

        var result = InvokeBuildAutofillPayloadHtml(
            evaluations,
            submissions,
            criterionMeta,
            evaluatorNames,
            approverNames);

        Assert.Contains("1.1. Test Criterion", result);
        Assert.DoesNotContain("1.2. Unapproved Criterion", result);
        Assert.Contains("Approved description", result);
        Assert.DoesNotContain("Reviewer should not appear", result);
    }

    [Fact]
    public void BuildAutofillPayloadHtml_WithOfficialData_DisplaysOfficialFieldsNotSubmissions()
    {
        var eval = new CriterionEvaluation
        {
            Id = Guid.NewGuid(),
            CriterionId = Guid.NewGuid(),
            StandardId = Guid.NewGuid(),
            ApprovedBy = "user1",
            OfficialScore = 5,
            OfficialCurrentState = "Official mô tả",
            OfficialStrengths = "Official điểm mạnh",
            OfficialWeaknesses = "Official điểm yếu",
            OfficialActionPlan = "Official kế hoạch",
            CreatedAt = new DateTime(2026, 4, 11, 8, 0, 0, DateTimeKind.Utc),
            CreatedBy = "creator",
            IsActived = true,
            IsDeleted = false
        };

        var submission = new EvaluationSubmission
        {
            Id = Guid.NewGuid(),
            CriterionEvaluationId = eval.Id,
            EvaluatorId = Guid.NewGuid(),
            CurrentState = "Reviewer mô tả",
            Strengths = "Reviewer điểm mạnh",
            Weaknesses = "Reviewer điểm yếu",
            ActionPlan = "Reviewer kế hoạch",
            ProposedScore = 3,
            CreatedAt = new DateTime(2026, 4, 11, 8, 30, 0, DateTimeKind.Utc),
            CreatedBy = "reviewer",
            IsActived = true,
            IsDeleted = false
        };

        var evaluations = new List<CriterionEvaluation> { eval };
        var submissions = new List<EvaluationSubmission> { submission };
        var criterionMeta = CreateCriterionMeta(
            (eval.CriterionId, "1.3", "Test Criterion", 1, 1));
        var evaluatorNames = new Dictionary<Guid, string> { { submission.EvaluatorId, "Nguyễn Văn B" } };
        var approverNames = new Dictionary<string, string> { { "user1", "Trần Văn A" } };

        var result = InvokeBuildAutofillPayloadHtml(
            evaluations,
            submissions,
            criterionMeta,
            evaluatorNames,
            approverNames);

        Assert.Contains("Official mô tả", result);
        Assert.Contains("Official điểm mạnh", result);
        Assert.Contains("Official điểm yếu", result);
        Assert.Contains("Official kế hoạch", result);

        Assert.DoesNotContain("Reviewer mô tả", result);
        Assert.DoesNotContain("Reviewer điểm mạnh", result);
        Assert.DoesNotContain("Reviewer điểm yếu", result);
        Assert.DoesNotContain("Reviewer kế hoạch", result);
        Assert.DoesNotContain("Mức tự đánh giá", result);
        Assert.DoesNotContain("3/7", result);
    }

    [Fact]
    public void BuildAutofillPayloadHtml_WithOfficialScore_DisplaysCorrectFormat()
    {
        var eval = new CriterionEvaluation
        {
            Id = Guid.NewGuid(),
            CriterionId = Guid.NewGuid(),
            StandardId = Guid.NewGuid(),
            ApprovedBy = "headofcouncil",
            OfficialScore = 4,
            OfficialCurrentState = "Test",
            CreatedAt = new DateTime(2026, 4, 11, 8, 0, 0, DateTimeKind.Utc),
            CreatedBy = "creator",
            IsActived = true,
            IsDeleted = false
        };

        var evaluations = new List<CriterionEvaluation> { eval };
        var submissions = new List<EvaluationSubmission>();
        var criterionMeta = CreateCriterionMeta(
            (eval.CriterionId, "1.4", "Score Test", 1, 1));
        var evaluatorNames = new Dictionary<Guid, string>();
        var approverNames = new Dictionary<string, string> { { "headofcouncil", "Chủ tịch Hội đồng" } };

        var result = InvokeBuildAutofillPayloadHtml(
            evaluations,
            submissions,
            criterionMeta,
            evaluatorNames,
            approverNames);

        Assert.Contains("<strong>Điểm chốt:</strong> 4/7 (Bởi Chủ tịch Hội đồng)", result);
    }

    private static string InvokeBuildAutofillPayloadHtml(
        IEnumerable<CriterionEvaluation> evaluations,
        IEnumerable<EvaluationSubmission> submissions,
        IReadOnlyDictionary<Guid, StandardWithCriteriaDto> criterionMeta,
        IReadOnlyDictionary<Guid, string> evaluatorNames,
        IReadOnlyDictionary<string, string> approverNames)
    {
        return WebUtility.HtmlDecode(SarService.BuildAutofillPayloadHtml(
            evaluations,
            submissions,
            criterionMeta,
            evaluatorNames,
            approverNames));
    }

    private static Dictionary<Guid, StandardWithCriteriaDto> CreateCriterionMeta(
        params (Guid CriterionId, string CriterionCode, string CriterionName, int StandardOrder, int CriterionOrder)[] items)
    {
        var result = new Dictionary<Guid, StandardWithCriteriaDto>();

        foreach (var item in items)
        {
            result[item.CriterionId] = new StandardWithCriteriaDto
            {
                CriterionId = item.CriterionId,
                CriterionCode = item.CriterionCode,
                CriterionName = item.CriterionName,
                StandardOrder = item.StandardOrder,
                CriterionOrder = item.CriterionOrder
            };
        }

        return result;
    }
}
