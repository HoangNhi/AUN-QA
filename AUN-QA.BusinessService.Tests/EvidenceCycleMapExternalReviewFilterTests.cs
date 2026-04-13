using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Council.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.CoreFeature.EvidenceCycleMap;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Tests;

public class EvidenceCycleMapExternalReviewFilterTests
{
    private static readonly Guid ExtRoleId = new("551d1351-008e-4910-a39c-1fcdde409fdf");

    [Fact]
    public async Task GetList_ExternalReviewer_ReturnsOnlyVerifiedEvidence()
    {
        await using var context = CreateContext();
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var verifiedEvidenceId = Guid.NewGuid();
        var draftEvidenceId = Guid.NewGuid();

        SeedCycle(context, cycleId);
        SeedEvidence(context, verifiedEvidenceId, "MC-VER", (int)EvidenceStatus.Verified);
        SeedEvidence(context, draftEvidenceId, "MC-DRAFT", (int)EvidenceStatus.Draft);
        SeedEvidenceCycleMap(context, cycleId, verifiedEvidenceId);
        SeedEvidenceCycleMap(context, cycleId, draftEvidenceId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId, ExtRoleId, new[] { cycleId });
        var result = await service.GetList(new EvidenceCycleMapGetListPagingRequest
        {
            PageIndex = 1,
            PageSize = 50
        });

        Assert.Equal(1, result.TotalRow);
        Assert.Single(result.Data);
        Assert.All(result.Data, item => Assert.Equal((int)EvidenceStatus.Verified, item.Evidence_Status));
    }

    [Fact]
    public async Task GetList_InternalUser_ReturnsAllStatuses()
    {
        await using var context = CreateContext();
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var verifiedEvidenceId = Guid.NewGuid();
        var draftEvidenceId = Guid.NewGuid();

        SeedCycle(context, cycleId);
        SeedEvidence(context, verifiedEvidenceId, "MC-VER", (int)EvidenceStatus.Verified);
        SeedEvidence(context, draftEvidenceId, "MC-DRAFT", (int)EvidenceStatus.Draft);
        SeedEvidenceCycleMap(context, cycleId, verifiedEvidenceId);
        SeedEvidenceCycleMap(context, cycleId, draftEvidenceId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId, Guid.NewGuid(), new[] { cycleId });
        var result = await service.GetList(new EvidenceCycleMapGetListPagingRequest
        {
            PageIndex = 1,
            PageSize = 50
        });

        Assert.Equal(2, result.TotalRow);
        Assert.Equal(2, result.Data.Count);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static EvidenceCycleMapService CreateService(
        BusinessContext context,
        Guid userId,
        Guid roleId,
        IEnumerable<Guid> accessibleCycleIds)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.Name, "internal.user"),
                    new Claim("name", userId.ToString()),
                    new Claim("role", roleId.ToString())
                },
                authenticationType: "TestAuth"))
        };

        return new EvidenceCycleMapService(
            context,
            null!,
            new HttpContextAccessor { HttpContext = httpContext },
            new FakeUploadFileService(),
            new FakeCycleService(accessibleCycleIds));
    }

    private static void SeedCycle(BusinessContext context, Guid cycleId)
    {
        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Test Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = (int)CycleStatus.Check,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedEvidence(BusinessContext context, Guid evidenceId, string code, int status)
    {
        context.Evidences.Add(new Evidence
        {
            Id = evidenceId,
            Code = code,
            Name = $"Evidence {code}",
            FileTypeId = Guid.NewGuid(),
            Status = status,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedEvidenceCycleMap(BusinessContext context, Guid cycleId, Guid evidenceId)
    {
        context.EvidenceCycleMaps.Add(new EvidenceCycleMap
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            EvidenceId = evidenceId,
            ReviewStatus = (int)EvidenceCycleMapReviewStatus.NotStarted,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private sealed class FakeCycleService : ICycleService
    {
        private readonly List<Guid> _accessibleCycleIds;

        public FakeCycleService(IEnumerable<Guid> accessibleCycleIds)
        {
            _accessibleCycleIds = accessibleCycleIds.ToList();
        }

        public Task<List<Guid>> GetCycleIdsByUserAsync(Guid userId) => Task.FromResult(_accessibleCycleIds);
        public Task<ModelCycle> GetById(GetByIdRequest request) => throw new NotImplementedException();
        public Task Insert(CycleRequest request) => throw new NotImplementedException();
        public Task Update(CycleRequest request) => throw new NotImplementedException();
        public Task DeleteList(DeleteListRequest request) => throw new NotImplementedException();
        public Task<GetListPagingResponse<ModelCycleGetListPaging>> GetList(CycleGetListPagingRequest request) => throw new NotImplementedException();
        public Task<List<ModelCombobox>> GetComboboxByUser() => throw new NotImplementedException();
        public Task<List<ModelCombobox>> GetComboboxForExternalReview() => throw new NotImplementedException();
        public Task ChangeStatusAsync(CycleChangeStatusRequest request) => throw new NotImplementedException();
        public Task<bool> CanUserDoActionInPdcaAsync(PdcaActionCheckRequest request) => Task.FromResult(true);
        public Task<bool> IsUserInRoleAsync(Guid cycleId, Guid userId, int role) => Task.FromResult(true);
        public Task<int?> GetUserRoleAsync(Guid cycleId, Guid userId) => Task.FromResult<int?>(null);
        public Task<(bool Found, int Status)> GetCycleStatusAsync(Guid cycleId) => Task.FromResult((true, (int)CycleStatus.Check));
        public Task<bool> IsRevisionAllowedAsync(Guid cycleId) => Task.FromResult(false);
    }

    private sealed class FakeUploadFileService : IUploadFileService
    {
        public Task<List<ModelAttachment>> UploadDataAsync(string lienKetId, string folderName, string tempFolder)
            => Task.FromResult(new List<ModelAttachment>());

        public Task<bool> DeleteDataAsync(List<string> filePaths)
            => Task.FromResult(true);

        public Task<ModelFilePreview> PreviewFileAsync(
            string fileUrl,
            string mode = "internal",
            string? watermarkText = null,
            int watermarkOpacity = 25,
            int watermarkPosition = 0)
            => Task.FromResult(new ModelFilePreview());
    }
}
