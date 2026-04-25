using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Tests;

public class SarCollabPersistenceTests
{
    [Fact]
    public async Task PersistSnapshotFromCollab_updates_snapshot_and_keeps_rendered_html_intact()
    {
        await using var context = CreateContext();
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-5),
            EndDate = DateTime.UtcNow.AddDays(5),
            Status = (int)CycleStatus.Do,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        context.SarReports.Add(new SarReport
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            Status = (int)SarStatus.Draft,
            RenderedHtml = "<p>existing-html</p>",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        await context.SaveChangesAsync();

        var service = CreateService(context, userId, cycleId);
        var newSnapshot = Convert.ToBase64String(new byte[] { 1, 2, 3, 4 });

        await service.PersistSnapshotFromCollab(new PersistSarSnapshotFromCollabRequest
        {
            CycleId = cycleId,
            YDocSnapshotBase64 = newSnapshot
        });

        var report = await context.SarReports.SingleAsync(x => x.CycleId == cycleId);
        Assert.Equal("<p>existing-html</p>", report.RenderedHtml);
        Assert.Equal(newSnapshot, Convert.ToBase64String(report.YdocSnapshot!));
        Assert.NotNull(report.LastSavedAt);
    }

    [Fact]
    public async Task PersistSnapshotFromCollab_does_not_update_when_status_is_submitted()
    {
        await using var context = CreateContext();
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-5),
            EndDate = DateTime.UtcNow.AddDays(5),
            Status = (int)CycleStatus.Check,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        context.SarReports.Add(new SarReport
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            Status = (int)SarStatus.Submitted,
            RenderedHtml = "<p>submitted</p>",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        await context.SaveChangesAsync();

        var service = CreateService(context, userId, cycleId);

        await service.PersistSnapshotFromCollab(new PersistSarSnapshotFromCollabRequest
        {
            CycleId = cycleId,
            YDocSnapshotBase64 = Convert.ToBase64String(new byte[] { 9, 9, 9 })
        });

        var report = await context.SarReports.SingleAsync(x => x.CycleId == cycleId);
        Assert.Null(report.YdocSnapshot);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new BusinessContext(options);
    }

    private static SarService CreateService(BusinessContext context, Guid userId, Guid cycleId)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim("name", userId.ToString()),
                new Claim("unique_name", "collab.test")
            }, "TestAuth"))
        };

        return new SarService(
            context,
            new HttpContextAccessor { HttpContext = httpContext },
            new FakeCycleService(cycleId, (int)CycleStatus.Do),
            null!,
            null!);
    }

    private sealed class FakeCycleService : ICycleService
    {
        private readonly Guid _cycleId;
        private readonly int _status;

        public FakeCycleService(Guid cycleId, int status)
        {
            _cycleId = cycleId;
            _status = status;
        }

        public Task<(bool Found, int Status)> GetCycleStatusAsync(Guid cycleId)
            => Task.FromResult((cycleId == _cycleId, _status));

        public Task<bool> CanUserDoActionInPdcaAsync(PdcaActionCheckRequest request) => Task.FromResult(true);
        public Task<bool> IsUserInRoleAsync(Guid cycleId, Guid userId, int role) => Task.FromResult(true);
        public Task<int?> GetUserRoleAsync(Guid cycleId, Guid userId) => Task.FromResult<int?>(null);
        public Task<List<Guid>> GetCycleIdsByUserAsync(Guid userId) => Task.FromResult(new List<Guid>());
        public Task<bool> IsRevisionAllowedAsync(Guid cycleId) => Task.FromResult(true);
        public Task<ModelCycle> GetById(GetByIdRequest request) => throw new NotImplementedException();
        public Task Insert(CycleRequest request) => throw new NotImplementedException();
        public Task Update(CycleRequest request) => throw new NotImplementedException();
        public Task DeleteList(DeleteListRequest request) => throw new NotImplementedException();
        public Task<GetListPagingResponse<ModelCycleGetListPaging>> GetList(CycleGetListPagingRequest request) => throw new NotImplementedException();
        public Task<List<ModelCombobox>> GetComboboxByUser() => throw new NotImplementedException();
        public Task<List<ModelCombobox>> GetComboboxForExternalReview() => throw new NotImplementedException();
        public Task ChangeStatusAsync(CycleChangeStatusRequest request) => throw new NotImplementedException();
    }
}
