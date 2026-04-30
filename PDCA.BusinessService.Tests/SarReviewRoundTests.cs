using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.Tests;

public class SarReviewRoundTests
{
    [Fact]
    public void SarReport_review_round_default_is_zero_in_model()
    {
        using var context = CreateContext();

        var entityType = context.Model.FindEntityType(typeof(SarReport));
        var property = entityType?.FindProperty(nameof(SarReport.ReviewRound));

        Assert.NotNull(entityType);
        Assert.NotNull(property);
        Assert.Equal(0, property!.GetDefaultValue());
    }

    [Theory]
    [InlineData((int)SarStatus.Draft, (int)CycleStatus.Do, 0, 1)]
    [InlineData((int)SarStatus.RevisionRequested, (int)CycleStatus.Check, 1, 2)]
    public async Task Submit_increments_review_round_on_every_submit(
        int initialStatus,
        int cycleStatus,
        int initialReviewRound,
        int expectedReviewRound)
    {
        await using var context = CreateContext();
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = cycleStatus,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });

        context.Councils.Add(new Council
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            UserId = userId,
            RoleId = (int)CouncilRole.Secretary,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });

        context.SarReports.Add(new SarReport
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            Status = initialStatus,
            ReviewRound = initialReviewRound,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });

        await context.SaveChangesAsync();

        var service = CreateService(context, cycleId, cycleStatus, userId);

        await service.Submit(new SubmitSarRequest
        {
            CycleId = cycleId
        });

        var report = await context.SarReports.SingleAsync(x => x.CycleId == cycleId);

        Assert.Equal((int)SarStatus.Submitted, report.Status);
        Assert.Equal(expectedReviewRound, report.ReviewRound);
        Assert.Equal("secretary.user", report.SubmittedBy);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static SarService CreateService(
        BusinessContext context,
        Guid cycleId,
        int cycleStatus,
        Guid userId)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim("name", userId.ToString()),
                    new Claim("unique_name", "secretary.user"),
                },
                authenticationType: "TestAuth"))
        };

        return new SarService(
            context,
            new HttpContextAccessor { HttpContext = httpContext },
            new FakeCycleService(cycleId, cycleStatus),
            null!,
            null!);
    }

    private sealed class FakeCycleService : ICycleService
    {
        private readonly Guid _cycleId;
        private readonly int _cycleStatus;

        public FakeCycleService(Guid cycleId, int cycleStatus)
        {
            _cycleId = cycleId;
            _cycleStatus = cycleStatus;
        }

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

        public Task<List<Guid>> GetCycleIdsByUserAsync(Guid userId) => Task.FromResult(new List<Guid>());

        public Task<(bool Found, int Status)> GetCycleStatusAsync(Guid cycleId)
            => Task.FromResult((cycleId == _cycleId, _cycleStatus));

        public Task<bool> IsRevisionAllowedAsync(Guid cycleId) => Task.FromResult(true);
    }
}
