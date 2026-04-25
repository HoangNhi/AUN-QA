using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.Protos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Tests;

public class SarExternalReviewListTests
{
    private static readonly Guid ExtRoleId = new("551d1351-008e-4910-a39c-1fcdde409fdf");

    [Fact]
    public async Task GetList_ExternalReviewer_ReturnsOnlyAccessibleCycles()
    {
        await using var context = CreateContext();
        var accessibleCycleId = Guid.NewGuid();
        var otherCycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        SeedCycle(context, accessibleCycleId);
        SeedCycle(context, otherCycleId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId, ExtRoleId, new[] { accessibleCycleId });

        var result = await service.GetList(new SarGetListPagingRequest
        {
            PageIndex = 1,
            PageSize = 50
        });

        Assert.Equal(1, result.TotalRow);
        Assert.Single(result.Data);
        Assert.Equal(accessibleCycleId, result.Data[0].CycleId);
    }

    [Fact]
    public async Task GetList_ExternalReviewer_NoAccessibleCycles_ReturnsEmpty()
    {
        await using var context = CreateContext();
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        SeedCycle(context, cycleId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId, ExtRoleId, Array.Empty<Guid>());

        var result = await service.GetList(new SarGetListPagingRequest
        {
            PageIndex = 1,
            PageSize = 50
        });

        Assert.Equal(0, result.TotalRow);
        Assert.Empty(result.Data);
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
        Guid userId,
        Guid roleId,
        IEnumerable<Guid> accessibleCycleIds)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.Name, "ext.reviewer"),
                    new Claim("name", userId.ToString()),
                    new Claim("role", roleId.ToString())
                },
                authenticationType: "TestAuth"))
        };

        return new SarService(
            context,
            new HttpContextAccessor { HttpContext = httpContext },
            new FakeCycleService(accessibleCycleIds),
            null!,
            null!,
            null);
    }

    private static void SeedCycle(BusinessContext context, Guid cycleId)
    {
        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = $"Cycle {cycleId:N}",
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

    private sealed class FakeCycleService : ICycleService
    {
        private readonly List<Guid> _accessibleCycleIds;

        public FakeCycleService(IEnumerable<Guid> ids) =>
            _accessibleCycleIds = ids.ToList();

        public Task<List<Guid>> GetCycleIdsByUserAsync(Guid userId) =>
            Task.FromResult(_accessibleCycleIds);

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
}
